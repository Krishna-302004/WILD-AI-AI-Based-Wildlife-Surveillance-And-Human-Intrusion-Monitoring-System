import cv2
import os
import time
from detection_system import WildlifeIoTSystem

def run_test():
    video_path = r"tiger\vid3.mp4"
    if not os.path.exists(video_path):
        print(f"Error: {video_path} not found.")
        return

    # Create the system with the video file
    system = WildlifeIoTSystem(model_path='yolov8n.pt', capture_index=video_path)
    
    # Override alert function to stop after first detection to save processing time
    original_trigger = system.trigger_alert
    
    detection_found = False
    saved_file = ""
    
    def mock_trigger(detection_type, confidence, frame):
        nonlocal detection_found, saved_file
        print(f"--- TRIGGERED: {detection_type} ({confidence}) ---")
        if detection_type == "tiger":
            output_file = f"tiger_detection_vid3.jpg"
            cv2.imwrite(output_file, frame)
            saved_file = output_file
            detection_found = True
        
    system.trigger_alert = mock_trigger
    
    # Process frames
    frame_count = 0
    while True:
        ret, frame = system.cap.read()
        if not ret or detection_found:
            break
            
        system.process_frame(frame)
        frame_count += 1
        
        # Stop after 300 frames to avoid infinite loops if nothing is found
        if frame_count > 300:
            print("No detection within first 300 frames.")
            break
            
    system.cap.release()
    
    if detection_found:
        print(f"SUCCESS: Detection saved to {saved_file}")
    else:
        print("Test finished. No tiger detected.")

if __name__ == "__main__":
    run_test()
