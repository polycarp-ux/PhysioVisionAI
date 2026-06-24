import sys
import os
import base64
import cv2
import numpy as np
import mediapipe as mp
import uvicorn
# Explicitly import the solutions module to prevent the Windows path bug
from mediapipe.python.solutions import pose as mp_pose

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pose_math import calculate_angle

app = FastAPI(title="PhysioVision AI Live Processing Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe Pose Detection engine cleanly
pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

class FrameData(BaseModel):
    image: str          # Base64 data image string
    exercise_type: str  # "squat" or "bicep_curl"

@app.get("/")
def home():
    return {"status": "online", "message": "PhysioVision AI Backend is running smoothly"}

@app.post("/analyze-frame")
def analyze_frame(data: FrameData):
    try:
        # Decode the incoming Base64 text back into raw binary bytes
        img_bytes = base64.b64decode(data.image)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"feedback": "Error parsing image frame data", "angle": None}

        # MediaPipe requires RGB images, OpenCV defaults to BGR
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        # Fallback check if user steps completely out of vision tracking bounds
        if not results.pose_landmarks:
            return {"feedback": "No human body detected. Step back fully into frame.", "angle": None}

        landmarks = results.pose_landmarks.landmark
        exercise = data.exercise_type.lower()
        
        feedback = "Good posture! Keep matching the rhythm."
        angle_to_return = None

        # --- PROCESS SQUAT ---
        if exercise == "squat":
            # 23: Hip, 25: Knee, 27: Ankle
            hip = [landmarks[23].x, landmarks[23].y]
            knee = [landmarks[25].x, landmarks[25].y]
            ankle = [landmarks[27].x, landmarks[27].y]
            
            knee_angle = calculate_angle(hip, knee, ankle)
            angle_to_return = knee_angle

            if knee_angle < 80:
                feedback = "ALERT: Squatting too deep! High knee load strain."
            elif knee_angle > 165:
                feedback = "Good. Descend slowly into the squat position."
            else:
                feedback = "Perfect form depth. Maintain control."

        # --- PROCESS BICEP CURL ---
        elif exercise == "bicep_curl":
            # 11: Shoulder, 13: Elbow, 15: Wrist
            shoulder = [landmarks[11].x, landmarks[11].y]
            elbow = [landmarks[13].x, landmarks[13].y]
            wrist = [landmarks[15].x, landmarks[15].y]
            
            elbow_angle = calculate_angle(shoulder, elbow, wrist)
            angle_to_return = elbow_angle

            if elbow_angle < 45:
                feedback = "Top contraction achieved. Release slowly."
            elif elbow_angle > 150:
                feedback = "Extend fully, then curl back up."
            else:
                feedback = "Excellent tracking! Keep elbow locked in place."

        return {"feedback": feedback, "angle": angle_to_return}

    except Exception as e:
        return {"feedback": f"Processing anomaly: {str(e)}", "angle": None}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)