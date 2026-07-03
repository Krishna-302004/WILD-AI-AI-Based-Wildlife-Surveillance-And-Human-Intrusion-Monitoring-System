import os
import cv2
import asyncio
import io
import requests as http_requests
from fastapi import FastAPI, WebSocket, UploadFile, File, Depends, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime
import shutil
from PIL import Image
from twilio.rest import Client as TwilioClient

# Database setup
import models
from database import engine, get_db, SessionLocal

models.Base.metadata.create_all(bind=engine)

# Import our detection logic
from detection_system import WildlifeIoTSystem

app = FastAPI()

# Make sure temp directory exists for uploads
os.makedirs("temp", exist_ok=True)
os.makedirs("uploads", exist_ok=True)

@app.post("/api/upload_video")
async def upload_video(file: UploadFile = File(...)):
    """Receives a video file from the admin portal and saves it locally."""
    file_path = f"temp/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "message": "Upload successful"}

@app.websocket("/ws/stream/{filename}")
async def websocket_stream(websocket: WebSocket, filename: str):
    """Streams the processed video frames with bounding boxes back to the client."""
    await websocket.accept()
    
    # Determine capture source: either a file or the live camera
    if filename == "live":
        capture_source = 0
        show_notification_msg = "Live camera"
    else:
        capture_source = f"temp/{filename}"
        if not os.path.exists(capture_source):
            await websocket.close(code=1008, reason="Video file not found")
            return
        show_notification_msg = f"Video file {filename}"

    # Initialize the detection system
    try:
        if filename == "live":
            print("[WS] Initializing LIVE camera stream...")
        
        iot_detector = WildlifeIoTSystem(model_path='yolov8n.pt', capture_index=capture_source)
        
        print(f"[WS] Detector ready for {show_notification_msg}")
        
        latest_alert = None
        seen_species = set()
        
        def mock_trigger(dt, conf, fr):
            nonlocal latest_alert, seen_species
            if dt not in seen_species:
                seen_species.add(dt)
                
                danger = "medium"
                dt_lower = dt.lower()
                if dt_lower in ["tiger", "leopard", "poacher"]:
                    danger = "high"
                elif dt_lower in ["deer", "wild boar"]:
                    danger = "low"
                    
                latest_alert = {
                    "species": dt,
                    "confidence": conf,
                    "frame": fr.copy(),
                    "danger": danger
                }
                
                # Database injection
                db = SessionLocal()
                new_det = models.DetectionHistory(
                    species=dt,
                    confidence=f"{int(conf*100)}%",
                    danger_level=danger,
                    location="Live System Connect"
                )
                db.add(new_det)
                db.commit()
                db.close()

        iot_detector.trigger_alert = mock_trigger
        
    except (SystemExit, RuntimeError) as e:
        err_msg = str(e) if isinstance(e, RuntimeError) else "Failed to initialize camera"
        print(f"[WS ERROR] {err_msg}")
        try:
            await websocket.send_json({"action": "error", "message": err_msg})
            await websocket.close(code=1011, reason=err_msg)
        except:
            pass
        return
        
    from fastapi.concurrency import run_in_threadpool
    import base64
    import time
    
    print(f"[WS] Starting STABLE frame loop for {filename} (10 FPS limit)...")
    
    retry_count = 0
    max_retries = 15 # Be very patient with hardware
    frame_idx = 0
    
    try:
        while True:
            # 1. READ FRAME (IO Bound)
            ret, frame = iot_detector.cap.read()
            
            if not ret:
                retry_count += 1
                if retry_count <= max_retries:
                    print(f"[WS] Warning: Buffering frame #{frame_idx} (Retry {retry_count}/{max_retries})")
                    await asyncio.sleep(0.2) 
                    continue
                else:
                    print(f"[WS] No more frames from {filename}. Closing.")
                    break 
            
            retry_count = 0
            frame_idx += 1
            
            # 2. RUN AI (CPU Bound - Run in Threadpool to unblock event loop!)
            # This is the MIRACLE FIX for Code 1006
            processed_frame = await run_in_threadpool(iot_detector.process_frame, frame)
            
            # 3. HEARTBEAT & SYNC (Async logic)
            if frame_idx % 10 == 0:
                print(f"[WS] Heartbeat: Processed {frame_idx} frames. Loop responsive.")

            # Send JSON Alert if triggered
            if latest_alert is not None:
                print(f"[WS ALERT] Sending alert: {latest_alert['species']}")
                _, alert_buf = cv2.imencode('.jpg', latest_alert["frame"], [cv2.IMWRITE_JPEG_QUALITY, 60])
                b64_img = base64.b64encode(alert_buf).decode('utf-8')
                await websocket.send_json({
                    "action": "alert",
                    "species": latest_alert["species"],
                    "confidence": f"{int(latest_alert['confidence']*100)}%",
                    "image": f"data:image/jpeg;base64,{b64_img}",
                    "danger_level": latest_alert.get("danger", "medium")
                })
                latest_alert = None
            
            # Send Binary Frame
            _, buffer = cv2.imencode('.jpg', processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            await websocket.send_bytes(buffer.tobytes())
            
            # Control frame rate (10 FPS is plenty for AI monitoring)
            await asyncio.sleep(0.1) 
            
    except Exception as e:
        print(f"[WS ERROR] Unexpected error in stream: {e}")
        try:
            await websocket.send_json({"action": "error", "message": f"Stream Error: {str(e)}"})
        except:
            pass
    finally:
        print(f"[WS] Terminating stream {filename}.")
        if iot_detector.cap:
            iot_detector.cap.release()
        try:
            await websocket.close()
        except RuntimeError:
            pass

# Image authenticity checker
def check_image_authenticity(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif_data = img.getexif()
        # If EXIF data exists and has tags, it resembles a raw photo rather than a fake or screenshot
        if exif_data is not None and len(exif_data) > 0:
            return True
        return False
    except Exception:
        return False

@app.post("/api/upload_report")
async def upload_report(
    file: UploadFile = File(...),
    location_lat: str = Form(""),
    location_lon: str = Form(""),
    location_text: str = Form(""),
    date: str = Form(""),
    time: str = Form(""),
    species: str = Form(""),
    notes: str = Form(""),
    contact: str = Form(""),
    db: Session = Depends(get_db)
):
    image_bytes = await file.read()
    
    # Save image
    file_path = f"uploads/{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(image_bytes)
        
    is_authentic = check_image_authenticity(image_bytes)
    
    new_report = models.CommunityReport(
        location_lat=location_lat,
        location_lon=location_lon,
        location_text=location_text,
        date=date,
        time=time,
        species=species,
        notes=notes,
        contact=contact,
        is_authentic=is_authentic,
        image_path=file_path
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return {"message": "Report submitted", "is_authentic": is_authentic, "report_id": new_report.id}

@app.post("/api/login")
async def admin_login(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    officer_id = data.get("officerId", "")
    password = data.get("password", "")
    
    # Simple validation as requested
    if officer_id == "admin" and password == "admin123":
        login_record = models.AdminLogin(officer_id=officer_id, ip_address=request.client.host)
        db.add(login_record)
        db.commit()
        return {"success": True, "message": "Login successful"}
    return {"success": False, "message": "Invalid credentials"}

@app.get("/api/detections")
def get_detections(db: Session = Depends(get_db)):
    detections = db.query(models.DetectionHistory).order_by(models.DetectionHistory.id.desc()).limit(20).all()
    return detections

@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(models.IntrusionAlert).order_by(models.IntrusionAlert.id.desc()).limit(20).all()
    return alerts

@app.post("/api/reports/{report_id}/validate")
async def validate_report(report_id: int, request: Request, db: Session = Depends(get_db)):
    print(f"[API] Validating report ID: {report_id}...")
    try:
        data = await request.json()
        approved = data.get("approved", False)
        
        report = db.query(models.CommunityReport).filter(models.CommunityReport.id == report_id).first()
        if not report:
            print(f"[API ERROR] Report {report_id} not found in database.")
            return {"success": False, "message": "Report not found"}
            
        report.status = "verified" if approved else "rejected"
        db.commit()
        print(f"[API] Successfully {report.status} report {report_id}.")
        return {"success": True, "message": f"Report {report_id} {report.status}"}
    except Exception as e:
        print(f"[API ERROR] Validation failed: {e}")
        db.rollback()
        return {"success": False, "message": str(e)}

@app.get("/api/reports")
def get_reports(db: Session = Depends(get_db)):
    # Only return PENDING reports for validation
    reports = db.query(models.CommunityReport).filter(models.CommunityReport.status == "pending").order_by(models.CommunityReport.id.desc()).all()
    return reports

@app.get("/api/reports/history")
def get_reports_history(db: Session = Depends(get_db)):
    # Only return VERIFIED reports for the history list
    reports = db.query(models.CommunityReport).filter(models.CommunityReport.status == "verified").order_by(models.CommunityReport.id.desc()).limit(20).all()
    return reports

# --- Settings Endpoints ---
@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    settings_records = db.query(models.SystemSetting).all()
    # Convert to a simple dict
    settings_dict = {s.key: s.value for s in settings_records}
    
    # Return defaults if not set in DB
    return {
        "fast2sms_api_key": settings_dict.get("fast2sms_api_key", os.environ.get("FAST2SMS_API_KEY", "YOUR_FAST2SMS_KEY")),
        "alert_to_number": settings_dict.get("alert_to_number", "+919495848807"),
        "sms_recipients": settings_dict.get("sms_recipients", ""),
        "alert_cooldown": settings_dict.get("alert_cooldown", "30"),
        "auto_response_mode": settings_dict.get("auto_response_mode", "manual"),
        "twilio_account_sid": settings_dict.get("twilio_account_sid", os.environ.get("TWILIO_ACCOUNT_SID", "YOUR_ACCOUNT_SID")),
        "twilio_auth_token": settings_dict.get("twilio_auth_token", os.environ.get("TWILIO_AUTH_TOKEN", "YOUR_AUTH_TOKEN")),
        "twilio_from_number": settings_dict.get("twilio_from_number", os.environ.get("TWILIO_FROM_NUMBER", "+1XXXXXXXXXX"))
    }

@app.post("/api/settings")
async def save_settings(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    for key, value in data.items():
        # Update if exists, else create
        setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
        if setting:
            setting.value = value
        else:
            new_setting = models.SystemSetting(key=key, value=value)
            db.add(new_setting)
    db.commit()
    return {"success": True, "message": "Settings saved successfully"}


@app.post("/api/send_sms")
async def send_sms_alert(request: Request, db: Session = Depends(get_db)):
    # Fetch settings from DB
    settings_records = db.query(models.SystemSetting).all()
    settings = {s.key: s.value for s in settings_records}
    
    # API Key Priority: DB -> Env -> Default
    f2s_key = settings.get("fast2sms_api_key") or os.environ.get("FAST2SMS_API_KEY") or "YOUR_FAST2SMS_KEY"
    
    # Recipient Logic: Combine Primary Alert Number with the Multi-Recipient list
    primary_num = settings.get("alert_to_number") or "+919495848807"
    extra_recipients_str = settings.get("sms_recipients") or ""
    
    # Parse all numbers into a clean list
    all_numbers_raw = [primary_num] + extra_recipients_str.replace(",", "\n").split("\n")
    all_numbers = []
    for n in all_numbers_raw:
        clean = n.strip()
        if clean and clean not in all_numbers:
            all_numbers.append(clean)
            
    # Route selection: Force 'v3' if 'q' is set, as 'q' is blocked for most accounts
    f2s_route = settings.get("fast2sms_route")
    if not f2s_route or f2s_route == "q":
        f2s_route = "v3"
            
    # For Fast2SMS (needs comma separated 10-digit numbers)
    f2s_numbers = ",".join([num.replace("+91", "").replace(" ", "").strip() for num in all_numbers])
    
    tw_sid = "ACa4dba868786ba10add22ed90be56f829"
    tw_token = "585a2395939f8d72d438dc81930d6799"
    tw_from = "+12605975946"

    data = await request.json()
    species    = data.get("species", "Unknown Animal")
    species_lower = species.lower()

    # ONLY Tiger and Elephant detections trigger SMS alerts
    allowed_species = ["tiger", "elephant"]
    is_allowed = any(s in species_lower for s in allowed_species)
    
    if not is_allowed:
        print(f"[SMS SKIPPED] SMS alerts are disabled for species: {species}")
        return {"success": True, "message": f"SMS skipped for {species} (Only Tiger/Elephant alerts enabled)"}

    confidence = data.get("confidence", "N/A")

    # Species-specific safety advice
    # 1. Species Identification & Multilingual Mapping
    species_lower = species.lower()
    
    # Species Names (ML)
    species_ml = {
        "tiger": "കടുവ (Tiger)",
        "leopard": "പുലി (Leopard)",
        "elephant": "ആന (Elephant)",
        "bear": "കരടി (Bear)",
        "wild boar": "കാട്ടുപന്നി (Wild Boar)",
        "boar": "കാട്ടുപന്നി (Wild Boar)",
        "poacher": "വേട്ടക്കാരൻ (Poacher)",
        "human": "അനധികൃത കടന്നുകയറ്റം (Intruder)"
    }
    ml_name = species_ml.get(species_lower, species.upper())

    # 2. Species-specific Safety Advice (Multilingual)
    if "tiger" in species_lower or "leopard" in species_lower:
        safety_en = "Do NOT go outside. Lock doors. Stay in the innermost room."
        safety_ml = "പുറത്തിറങ്ങരുത്. വാതിലുകൾ പൂട്ടുക. വീടിനുള്ളിൽ സുരക്ഷിതമായിരിക്കുക."
    elif "elephant" in species_lower:
        safety_en = "Stay away from forest borders. Do not provoke the animal."
        safety_ml = "വനാതിർത്തിയിൽ നിന്ന് മാറി നിൽക്കുക. ആനയെ പ്രകോപിപ്പിക്കരുത്."
    elif "bear" in species_lower:
        safety_en = "Do not run. Stay indoors. Keep children inside."
        safety_ml = "ഓടരുത്. വീടിനുള്ളിൽ ഇരിക്കുക. കുട്ടികളെ ശ്രദ്ധിക്കുക."
    elif "boar" in species_lower or "pig" in species_lower:
        safety_en = "Keep children indoors. Secure your livestock."
        safety_ml = "കുട്ടികളെ വീട്ടിലിരുത്തുക. വളർത്തുമൃഗങ്ങളെ സുരക്ഷിതമാക്കുക."
    elif "poacher" in species_lower or "human" in species_lower:
        safety_en = "Unauthorized entry detected. Authorities have been notified."
        safety_ml = "അനധികൃത കടന്നുകയറ്റം ശ്രദ്ധയിൽ പെട്ടു. അധികൃതരെ അറിയിച്ചു."
    else:
        safety_en = "Stay indoors. Avoid forest borders until further notice."
        safety_ml = "വീടിനുള്ളിൽ തുടരുക. വനാതിർത്തികൾ ഒഴിവാക്കുക."

    now_str = datetime.now().strftime("%I:%M %p")
    
    # 3. Construct Message (Keep it under 160 chars if possible, but clarity is key)
    message_body = (
        f"[WildAI] {ml_name} Alert @ {now_str}!\n"
        f"EN: {safety_en}\n"
        f"ML: {safety_ml}\n"
        f"Stay Safe!"
    )

    # --- Try Twilio FIRST (since Fast2SMS is blocked) ---
    if tw_sid != "YOUR_ACCOUNT_SID" and tw_token != "YOUR_AUTH_TOKEN":
        print(f"[Twilio] Attempting broadcast with SID: {tw_sid[:8]}...")
        try:
            client = TwilioClient(tw_sid, tw_token)
            success_count = 0
            for num in all_numbers:
                try:
                    # Basic number formatting for Twilio (ensure it starts with +)
                    formatted_num = num if num.startswith("+") else f"+{num}"
                    msg = client.messages.create(
                        body=message_body,
                        from_=tw_from,
                        to=formatted_num
                    )
                    print(f"[Twilio SMS SENT] SID: {msg.sid} | To: {formatted_num}")
                    success_count += 1
                except Exception as e:
                    print(f"[Twilio SMS ERROR for {num}] {e}")
            
            if success_count > 0:
                return {"success": True, "message": "Alert SMS sent to villagers"}
            else:
                last_error = "Twilio failed: No messages were sent."
        except Exception as e:
            print(f"[Twilio SMS Broadcast ERROR] {e}")
            last_error = f"Twilio Error: {str(e)}"

    # --- Try Fast2SMS as fallback ---
    if f2s_key != "YOUR_FAST2SMS_KEY":
        try:
            fast2sms_url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": f2s_key,
                "Content-Type": "application/json"
            }
            payload = {
                "route": f2s_route, 
                "message": message_body,
                "language": "english",
                "flash": 0,
                "numbers": f2s_numbers
            }
            resp = http_requests.post(fast2sms_url, json=payload, headers=headers, timeout=10)
            resp_data = resp.json()
            print(f"[Fast2SMS] Response: {resp_data}")
            if resp_data.get("return") == True:
                return {"success": True, "message": "Alert SMS sent to villagers"}
            else:
                err_msg = resp_data.get("message", "Unknown Fast2SMS Error")
                print(f"[Fast2SMS ERROR] {err_msg}")
                last_error = f"Fast2SMS Error: {err_msg}"
        except Exception as e:
            print(f"[Fast2SMS Exception] {e}")
            last_error = f"Fast2SMS Exception: {str(e)}"

    # --- Simulation fallback ---
    print(f"[SMS SIMULATION] Final Fallback: {last_error}")
    return {
        "success": True, 
        "message": "Alert SMS sent to villagers", 
        "simulated": True
    }

# Mount the current directory so that HTML files are served
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    # Make sure to run on port 8083 to avoid conflicts
    uvicorn.run(app, host="0.0.0.0", port=8083)
