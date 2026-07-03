import cv2  #opencv
import time
import sys  #exit functions
import os
from datetime import datetime
from ultralytics import YOLO #import yolo v8 model

class WildlifeIoTSystem:
    def __init__(self, model_path='yolov8n.pt', capture_index=0):
        print("[SYSTEM] Initializing YOLOv8 IoT Detector...")
        
        # Load YOLOv8 Model (Nano version recommended for Pi/IoT)
        try:
            self.model = YOLO(model_path) #load yolov8
            print(f"[SYSTEM] Model {model_path} loaded successfully.")
        except Exception as e:
            print(f"[ERROR] Failed to load model: {e}")
            raise RuntimeError(f"Failed to load YOLO model: {e}")

        # Initialize Camera
        # For Windows, CAP_DSHOW is often faster and more reliable
        if isinstance(capture_index, int) and os.name == 'nt':
            self.cap = cv2.VideoCapture(capture_index, cv2.CAP_DSHOW)
        else:
            self.cap = cv2.VideoCapture(capture_index)
            
        if not self.cap.isOpened():
            err_msg = f"Could not open video stream (Index: {capture_index}). Check if camera is used by another app."
            print(f"[ERROR] {err_msg}")
            raise RuntimeError(err_msg)
            
        # Warm-up phase (essential for some webcams to adjust exposure/focus)
        if isinstance(capture_index, int):
            print(f"[SYSTEM] Warming up camera {capture_index}...")
            for _ in range(20): # Increased to 20 frames for deeper warm-up
                self.cap.read()
            time.sleep(1.0) # Explicit wait for auto-focus
            print("[SYSTEM] Camera warm-up complete.")
            
        # Alert Cooldowns (to prevent spamming)
        self.last_alert_time = {
            'tiger': 0, #last alert time for each threat
            'elephant': 0,
            'poacher': 0
        }
        self.alert_cooldown = 10 # seconds gap btw alerts

        print("[SYSTEM] Monitoring Active. Press 'q' to exit.")
        
    #alert function
    def trigger_alert(self, detection_type, confidence, frame):
        """
        Triggers physical responses (Sound, SMS) based on detection.
        """
        current_time = time.time()
        
        # Check cooldown
        if current_time - self.last_alert_time.get(detection_type, 0) < self.alert_cooldown:
            return #if alery alreadt triggered recently skip

        self.last_alert_time[detection_type] = current_time #update last alert time
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        print(f"\n>>> [ALERT TRIGGERED] Type: {detection_type.upper()} | Conf: {confidence:.2f} | Time: {timestamp}")

        # ---------------------------------------------------------
        # PHYSICAL RESPONSE LOGIC (Hardware Integration Point)
        # ---------------------------------------------------------
        if detection_type == "tiger":
            # HIGH THREAT
            print("    [AUDIO] >>> Playing: tiger_repellent_drums.wav")
            print("    [SMS]   >>> Sending CRITICAL ALERT to Forest Officer")
            # os.system("aplay sounds/drums.wav")
            
        elif detection_type == "elephant":
            # MEDIUM THREAT
            print("    [AUDIO] >>> Playing: bee_sound.wav (Bio-Repellent)")
            print("    [SMS]   >>> Sending WARNING to Villagers & Officer")
            # os.system("aplay sounds/bees.wav")
            
        elif detection_type == "poacher":
            # HUMAN INTRUSION
            print("    [AUDIO] >>> Playing: police_siren.wav")
            print("    [SMS]   >>> Sending SECURITY BREACH alert with GPS coordinates")
            # os.system("aplay sounds/siren.wav")
        # ---------------------------------------------------------
        
        # Save detection image for evidence
        filename = f"detection_{detection_type}_{int(time.time())}.jpg"
        cv2.imwrite(filename, frame) # Image saved for verification

    def process_frame(self, frame): #process each video frame
        """
        Runs YOLO inference and maps COCO classes to Wildlife Threats.
        """
        results = self.model(frame, stream=True, verbose=False) #run yolo

        for result in results: #iterate through detected objects
            boxes = result.boxes
            for box in boxes:
                confidence = float(box.conf[0]) #detection confidence
                cls = int(box.cls[0])
                label = self.model.names[cls] #gets object name

                # ---------------------------------------------
                # THREAT MAPPING (COCO -> Wildlife Project)
                # ---------------------------------------------
                # Class 0: person -> Poacher
                # Class 20: elephant -> Elephant
                # Class 21: bear -> Bear
                # Class 15: cat -> Tiger/Leopard (Proxy)
                # Class 16: dog -> Wolf/Wild Dog
                # ---------------------------------------------
                
                detected_threat = None
                
                if label == 'person' and confidence > 0.5:
                    detected_threat = "poacher"
                elif label == 'elephant' and confidence > 0.6:
                    detected_threat = "elephant"
                elif label == 'cat' and confidence > 0.4:
                    detected_threat = "tiger" # Small cats logic
                elif label == 'bear' and confidence > 0.5:
                    detected_threat = "bear" # Distinguished from Tiger

                if detected_threat:
                    # Draw Bounding Box
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    color = (0, 0, 255) if detected_threat == 'poacher' else (0, 255, 255)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, f"{detected_threat.upper()} {confidence:.2f}", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

                    # Trigger Alert System
                    self.trigger_alert(detected_threat, confidence, frame)

        return frame

    def run(self): #main loop it runs conti capture frames, sends each frame for detection, displays output on screen
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break

            # Resize for faster inference on IoT devices (optional)
            # frame = cv2.resize(frame, (640, 480))

            # Process Frame
            frame = self.process_frame(frame)

            # Display Feed
            cv2.imshow('Wildlife Guardian - IoT Feed', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        self.cap.release() # release the camera, close windows
        cv2.destroyAllWindows()
        print("[SYSTEM] Monitoring Stopped.")

if __name__ == "__main__":
    # ==========================================
    # CONFIGURATION
    # ==========================================
    # Set this to your video file path (e.g., "C:/Users/sayoo/Desktop/tiger.mp4")
    # OR set to 0 for Webcam, 1 for External Camera
    VIDEO_SOURCE = r"C:\Users\sayoo\Dropbox\PC\Downloads\wild .mp4"
    
    # Example for testing with a file (Uncomment and replace path):
    # VIDEO_SOURCE = r"C:\Users\sayoo\Downloads\test_wildlife.mp4"

    print(f"[LAUNCH] Starting Wildlife Guardian with source: {VIDEO_SOURCE}")
    
    # Create and run the system
    iot_system = WildlifeIoTSystem(model_path='yolov8n.pt', capture_index=VIDEO_SOURCE)
    iot_system.run()
