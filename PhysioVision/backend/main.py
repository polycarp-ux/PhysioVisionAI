import sys
import os
import base64
import cv2
import numpy as np
import uvicorn
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

pose = mp_pose.Pose(
    static_image_mode=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

class FrameData(BaseModel):
    image: str
    exercise_type: str

@app.get("/")
def home():
    return {"status": "online", "message": "PhysioVision AI Backend is running smoothly"}

@app.post("/analyze-frame")
def analyze_frame(data: FrameData):
    try:
        img_bytes = base64.b64decode(data.image)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"feedback": "Error parsing image frame", "angle": None, "landmarks": [], "angles": {}}

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        if not results.pose_landmarks:
            return {"feedback": "No body detected. Step back into frame.", "angle": None, "landmarks": [], "angles": {}}

        landmarks = results.pose_landmarks.landmark
        h, w = frame.shape[:2]

        # ── Send all 33 landmark positions back to the app ──
        landmark_list = []
        for lm in landmarks:
            landmark_list.append({
                "x": lm.x,
                "y": lm.y,
                "z": lm.z,
                "visibility": lm.visibility
            })

        exercise = data.exercise_type.lower()
        feedback = "Good posture! Keep it up."
        angle_to_return = None
        angles = {}

        # ── SQUAT ──
        if exercise in ["squat", "squats", "lunges", "glute_bridge", "sit_to_stand"]:
            hip = [landmarks[23].x, landmarks[23].y]
            knee = [landmarks[25].x, landmarks[25].y]
            ankle = [landmarks[27].x, landmarks[27].y]
            knee_angle = calculate_angle(hip, knee, ankle)
            angle_to_return = knee_angle
            angles["leftKnee"] = knee_angle

            hip_r = [landmarks[24].x, landmarks[24].y]
            knee_r = [landmarks[26].x, landmarks[26].y]
            ankle_r = [landmarks[28].x, landmarks[28].y]
            knee_angle_r = calculate_angle(hip_r, knee_r, ankle_r)
            angles["rightKnee"] = knee_angle_r

            if knee_angle < 80:
                feedback = "ALERT: Too deep! Reduce knee bend to protect your joint."
            elif knee_angle > 165:
                feedback = "Good. Now descend slowly into the squat position."
            else:
                feedback = "Perfect form depth. Maintain control and keep going!"

        # ── BICEP CURL ──
        elif exercise in ["bicep_curl", "bicep_curls"]:
            shoulder = [landmarks[11].x, landmarks[11].y]
            elbow = [landmarks[13].x, landmarks[13].y]
            wrist = [landmarks[15].x, landmarks[15].y]
            elbow_angle = calculate_angle(shoulder, elbow, wrist)
            angle_to_return = elbow_angle
            angles["leftElbow"] = elbow_angle

            shoulder_r = [landmarks[12].x, landmarks[12].y]
            elbow_r = [landmarks[14].x, landmarks[14].y]
            wrist_r = [landmarks[16].x, landmarks[16].y]
            elbow_angle_r = calculate_angle(shoulder_r, elbow_r, wrist_r)
            angles["rightElbow"] = elbow_angle_r

            if elbow_angle < 45:
                feedback = "Top contraction achieved! Lower slowly for full range."
            elif elbow_angle > 150:
                feedback = "Extend fully then curl back up. Keep elbow close to body."
            else:
                feedback = "Excellent curl! Keep your elbow locked in position."

        # ── PUSH UPS ──
        elif exercise in ["pushups", "push_ups", "wall_pushup"]:
            shoulder = [landmarks[11].x, landmarks[11].y]
            elbow = [landmarks[13].x, landmarks[13].y]
            wrist = [landmarks[15].x, landmarks[15].y]
            elbow_angle = calculate_angle(shoulder, elbow, wrist)
            angle_to_return = elbow_angle
            angles["leftElbow"] = elbow_angle

            if elbow_angle < 90:
                feedback = "Great depth! Now push back up strongly."
            elif elbow_angle > 160:
                feedback = "Good. Lower your chest toward the floor slowly."
            else:
                feedback = "Good push-up! Keep your body in a straight line."

        # ── SHOULDER PRESS ──
        elif exercise in ["shoulder_press"]:
            shoulder = [landmarks[11].x, landmarks[11].y]
            elbow = [landmarks[13].x, landmarks[13].y]
            wrist = [landmarks[15].x, landmarks[15].y]
            elbow_angle = calculate_angle(shoulder, elbow, wrist)
            angle_to_return = elbow_angle
            angles["leftElbow"] = elbow_angle

            if elbow_angle > 160:
                feedback = "Full extension! Lower with control."
            elif elbow_angle < 80:
                feedback = "Press the weight fully overhead!"
            else:
                feedback = "Good press! Keep your core tight."

        # ── PLANK ──
        elif exercise in ["plank"]:
            shoulder = [landmarks[11].x, landmarks[11].y]
            hip = [landmarks[23].x, landmarks[23].y]
            knee = [landmarks[25].x, landmarks[25].y]
            hip_angle = calculate_angle(shoulder, hip, knee)
            angle_to_return = hip_angle
            angles["leftHip"] = hip_angle

            if hip_angle < 160:
                feedback = "Raise your hips! Keep your body in a straight line."
            elif hip_angle > 190:
                feedback = "Lower your hips! Do not pike up."
            else:
                feedback = "Perfect plank position! Squeeze your core."

        # ── DEADLIFT ──
        elif exercise in ["deadlift"]:
            shoulder = [landmarks[11].x, landmarks[11].y]
            hip = [landmarks[23].x, landmarks[23].y]
            knee = [landmarks[25].x, landmarks[25].y]
            hip_angle = calculate_angle(shoulder, hip, knee)
            angle_to_return = hip_angle
            angles["leftHip"] = hip_angle

            if hip_angle < 70:
                feedback = "Keep your back flat! Hinge at the hips."
            elif hip_angle >= 160:
                feedback = "Perfect lockout! Drive hips forward."
            else:
                feedback = "Good deadlift! Keep the bar close to your body."

        # ── ELDERLY / REHAB EXERCISES ──
        elif exercise in ["heel_toe", "ankle_circles", "shoulder_rolls", "seated_march"]:
            shoulder = [landmarks[11].x, landmarks[11].y]
            hip = [landmarks[23].x, landmarks[23].y]
            knee = [landmarks[25].x, landmarks[25].y]
            hip_angle = calculate_angle(shoulder, hip, knee)
            angle_to_return = hip_angle
            angles["leftHip"] = hip_angle
            feedback = "Great job! Move slowly and carefully. You are doing well."

        # ── FALL PREVENTION ──
        elif exercise in ["fall_prevention", "single_leg_stand", "heel_to_toe"]:
            hip = [landmarks[23].x, landmarks[23].y]
            knee = [landmarks[25].x, landmarks[25].y]
            ankle = [landmarks[27].x, landmarks[27].y]
            knee_angle = calculate_angle(hip, knee, ankle)
            angle_to_return = knee_angle
            angles["leftKnee"] = knee_angle
            feedback = "Balance exercise detected. Keep your gaze forward and breathe steadily."

        # ── WHEELCHAIR UPPER BODY ──
        elif exercise in ["wheelchair_upper", "seated_shoulder_press", "seated_row"]:
            shoulder = [landmarks[11].x, landmarks[11].y]
            elbow = [landmarks[13].x, landmarks[13].y]
            wrist = [landmarks[15].x, landmarks[15].y]
            elbow_angle = calculate_angle(shoulder, elbow, wrist)
            angle_to_return = elbow_angle
            angles["leftElbow"] = elbow_angle
            feedback = "Upper body exercise detected. Keep your back straight and movements controlled."

        # ── STROKE RECOVERY ──
        elif exercise in ["stroke_recovery", "arm_raises"]:
            shoulder = [landmarks[11].x, landmarks[11].y]
            elbow = [landmarks[13].x, landmarks[13].y]
            wrist = [landmarks[15].x, landmarks[15].y]
            elbow_angle = calculate_angle(shoulder, elbow, wrist)
            angle_to_return = elbow_angle
            angles["leftElbow"] = elbow_angle
            feedback = "Gentle movement detected. Take your time. Every small movement is progress."

        # ── SYMMETRY CHECK ──
        # Always calculate both sides for symmetry
        left_shoulder = [landmarks[11].x, landmarks[11].y]
        right_shoulder = [landmarks[12].x, landmarks[12].y]
        left_hip = [landmarks[23].x, landmarks[23].y]
        right_hip = [landmarks[24].x, landmarks[24].y]

        shoulder_symmetry = round(abs(left_shoulder[0] - right_shoulder[0]) * 100, 1)
        hip_symmetry = round(abs(left_hip[0] - right_hip[0]) * 100, 1)

        return {
            "feedback": feedback,
            "angle": angle_to_return,
            "angles": angles,
            "landmarks": landmark_list,
            "symmetry": {
                "shoulder": shoulder_symmetry,
                "hip": hip_symmetry,
            }
        }

    except Exception as e:
        return {
            "feedback": f"Processing error: {str(e)}",
            "angle": None,
            "angles": {},
            "landmarks": [],
            "symmetry": {}
        }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)