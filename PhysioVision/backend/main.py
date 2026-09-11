import sys
import os
import base64
import json
import urllib.error
import urllib.request

import cv2
import numpy as np
import uvicorn
from dotenv import load_dotenv
import mediapipe as mp

mp_pose = mp.solutions.pose

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from firebase_admin import auth

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pose_math import calculate_angle
from database import get_user_sessions, save_session_to_firestore, save_user_to_firestore

load_dotenv()

app = FastAPI(title="PhysioVision AI Live Processing Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FrameData(BaseModel):
    image: str
    exercise_type: str


class SessionData(BaseModel):
    user_id: str
    user_email: str | None = None
    user_name: str | None = None
    exercise_id: str
    exercise_name: str
    reps: int
    duration: int
    accuracy_score: float


class AuthData(BaseModel):
    email: str
    password: str
    display_name: str | None = None


@app.get("/")
def home():
    return {
        "status": "online",
        "message": "PhysioVision AI Backend is running",
    }


def firebase_auth_request(endpoint: str, payload: dict):
    api_key = os.getenv("FIREBASE_WEB_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="FIREBASE_WEB_API_KEY is not configured",
        )

    request = urllib.request.Request(
        f"https://identitytoolkit.googleapis.com/v1/{endpoint}?key={api_key}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))

    except urllib.error.HTTPError as error:
        try:
            error_body = json.loads(error.read().decode("utf-8"))
            message = error_body.get("error", {}).get(
                "message",
                "Firebase authentication failed",
            )
        except json.JSONDecodeError:
            message = "Firebase authentication failed"

        raise HTTPException(status_code=400, detail=message) from error

    except urllib.error.URLError as error:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to Firebase Authentication",
        ) from error


@app.post("/auth/register")
def register_user(data: AuthData):
    result = firebase_auth_request(
        "accounts:signUp",
        {
            "email": data.email,
            "password": data.password,
            "returnSecureToken": True,
        },
    )

    user = auth.verify_id_token(result["idToken"])

    if data.display_name:
        auth.update_user(
            user["uid"],
            display_name=data.display_name,
        )
    save_user_to_firestore(user["uid"], user.get("email"), data.display_name)

    return {
        "status": "success",
        "id_token": result["idToken"],
        "refresh_token": result["refreshToken"],
        "user": {
            "uid": user["uid"],
            "email": user.get("email"),
            "display_name": data.display_name,
        },
    }


@app.post("/auth/login")
def login_user(data: AuthData):
    result = firebase_auth_request(
        "accounts:signInWithPassword",
        {
            "email": data.email,
            "password": data.password,
            "returnSecureToken": True,
        },
    )

    user = auth.verify_id_token(result["idToken"])
    firebase_user = auth.get_user(user["uid"])
    display_name = firebase_user.display_name or user.get("name")
    save_user_to_firestore(user["uid"], user.get("email"), display_name)

    return {
        "status": "success",
        "id_token": result["idToken"],
        "refresh_token": result["refreshToken"],
        "user": {
            "uid": user["uid"],
            "email": user.get("email"),
            "display_name": display_name,
        },
    }


pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=0,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)


@app.post("/api/save-session")
async def save_session(data: SessionData):
    result = save_session_to_firestore(
        user_id=data.user_id,
        user_email=data.user_email,
        user_name=data.user_name,
        exercise_id=data.exercise_id,
        exercise_name=data.exercise_name,
        reps=data.reps,
        duration=data.duration,
        accuracy_score=data.accuracy_score,
    )

    if result.get("status") == "error":
        raise HTTPException(
            status_code=500,
            detail=result.get(
                "message",
                "Failed to save exercise session",
            ),
        )

    return result


@app.get("/api/sessions/{user_id}")
def list_sessions(user_id: str):
    return {"sessions": get_user_sessions(user_id)}


@app.post("/analyze-frame")
def analyze_frame(data: FrameData):
    try:
        img_bytes = base64.b64decode(data.image)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {
                "feedback": "Error parsing image frame",
                "angle": None,
                "landmarks": [],
                "angles": {},
                "is_good_form": False,
            }

        max_width = 640
        if frame.shape[1] > max_width:
            scale = max_width / frame.shape[1]
            frame = cv2.resize(
                frame,
                (max_width, int(frame.shape[0] * scale)),
                interpolation=cv2.INTER_AREA,
            )

        height, width, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)

        if not results.pose_landmarks:
            return {
                "feedback": "No body detected. Step back into frame.",
                "angle": None,
                "landmarks": [],
                "angles": {},
                "is_good_form": False,
            }

        landmarks = results.pose_landmarks.landmark

        landmark_list = []

        for landmark in landmarks:
            landmark_list.append(
                {
                    "x": landmark.x,
                    "y": landmark.y,
                    "z": landmark.z,
                    "x_px": int(landmark.x * width),
                    "y_px": int(landmark.y * height),
                    "visibility": landmark.visibility,
                }
            )

        exercise = (
            data.exercise_type
            .lower()
            .replace("-", "_")
            .replace(" ", "_")
        )

        feedback = "Good posture! Keep going."
        is_good_form = True
        angle_to_return = None
        angles = {}

        if exercise in [
            "squat",
            "squats",
            "glute_bridge",
            "sit_to_stand",
        ]:
            hip = [landmarks[23].x, landmarks[23].y]
            knee = [landmarks[25].x, landmarks[25].y]
            ankle = [landmarks[27].x, landmarks[27].y]

            knee_angle = calculate_angle(hip, knee, ankle)

            hip_right = [landmarks[24].x, landmarks[24].y]
            knee_right = [landmarks[26].x, landmarks[26].y]
            ankle_right = [landmarks[28].x, landmarks[28].y]

            knee_angle_right = calculate_angle(
                hip_right,
                knee_right,
                ankle_right,
            )

            angle_to_return = round(knee_angle, 1)
            angles["leftKnee"] = knee_angle
            angles["rightKnee"] = knee_angle_right

            if knee_angle < 70:
                feedback = "ALERT: Squatting too deep! Protect your knees."
                is_good_form = False
            elif knee_angle > 165:
                feedback = "Lower your hips into the squat position."
            else:
                feedback = "Great squat depth! Drive up through your heels."

        elif exercise in ["lunge", "lunges"]:
            left_knee = calculate_angle(
                [landmarks[23].x, landmarks[23].y],
                [landmarks[25].x, landmarks[25].y],
                [landmarks[27].x, landmarks[27].y],
            )

            right_knee = calculate_angle(
                [landmarks[24].x, landmarks[24].y],
                [landmarks[26].x, landmarks[26].y],
                [landmarks[28].x, landmarks[28].y],
            )

            active_knee_angle = min(left_knee, right_knee)

            angle_to_return = round(active_knee_angle, 1)
            angles["leftKnee"] = left_knee
            angles["rightKnee"] = right_knee

            if active_knee_angle > 150:
                feedback = "Step forward and drop rear knee towards floor."
            elif 80 <= active_knee_angle <= 110:
                feedback = "Excellent lunge depth! Keep torso upright."
            elif active_knee_angle < 65:
                feedback = (
                    "ALERT: Knee bending too sharp! "
                    "Keep front knee behind toe."
                )
                is_good_form = False

        elif exercise in ["bicep_curl", "bicep_curls"]:
            shoulder = [landmarks[11].x, landmarks[11].y]
            elbow = [landmarks[13].x, landmarks[13].y]
            wrist = [landmarks[15].x, landmarks[15].y]

            elbow_angle = calculate_angle(shoulder, elbow, wrist)

            shoulder_right = [landmarks[12].x, landmarks[12].y]
            elbow_right = [landmarks[14].x, landmarks[14].y]
            wrist_right = [landmarks[16].x, landmarks[16].y]

            elbow_angle_right = calculate_angle(
                shoulder_right,
                elbow_right,
                wrist_right,
            )

            angle_to_return = round(elbow_angle, 1)
            angles["leftElbow"] = elbow_angle
            angles["rightElbow"] = elbow_angle_right

            hip = [landmarks[23].x, landmarks[23].y]
            elbow_hip_distance = abs(elbow[0] - hip[0])

            if elbow_hip_distance > 0.25:
                feedback = (
                    "ALERT: Keep your elbow tucked close to your body!"
                )
                is_good_form = False
            elif elbow_angle < 45:
                feedback = "Good squeeze at top! Lower weight slowly."
            elif elbow_angle > 155:
                feedback = "Fully extend arm then curl upward."
            else:
                feedback = "Controlled motion! Keep curling."

        elif exercise in ["pushups", "push_ups", "wall_pushup"]:
            shoulder = [landmarks[11].x, landmarks[11].y]
            elbow = [landmarks[13].x, landmarks[13].y]
            wrist = [landmarks[15].x, landmarks[15].y]

            elbow_angle = calculate_angle(shoulder, elbow, wrist)

            hip = [landmarks[23].x, landmarks[23].y]
            knee = [landmarks[25].x, landmarks[25].y]

            body_alignment = calculate_angle(shoulder, hip, knee)

            angle_to_return = round(elbow_angle, 1)
            angles["leftElbow"] = elbow_angle

            if body_alignment < 145:
                feedback = "ALERT: Keep back straight! Do not sag hips."
                is_good_form = False
            elif elbow_angle < 90:
                feedback = "Great depth! Push back up firmly."
            elif elbow_angle > 160:
                feedback = "Lower your chest toward floor slowly."
            else:
                feedback = "Good rep line! Keep core engaged."

        elif exercise == "shoulder_press":
            shoulder = [landmarks[11].x, landmarks[11].y]
            elbow = [landmarks[13].x, landmarks[13].y]
            wrist = [landmarks[15].x, landmarks[15].y]

            elbow_angle = calculate_angle(shoulder, elbow, wrist)

            angle_to_return = round(elbow_angle, 1)
            angles["leftElbow"] = elbow_angle

            if elbow_angle > 160:
                feedback = "Full overhead reach! Lower under control."
            elif elbow_angle < 75:
                feedback = "Press arms fully overhead!"
            else:
                feedback = "Good press path! Maintain balance."

        elif exercise == "plank":
            shoulder = [landmarks[11].x, landmarks[11].y]
            hip = [landmarks[23].x, landmarks[23].y]
            knee = [landmarks[25].x, landmarks[25].y]

            hip_angle = calculate_angle(shoulder, hip, knee)

            angle_to_return = round(hip_angle, 1)
            angles["leftHip"] = hip_angle

            if hip_angle < 155:
                feedback = "ALERT: Lift hips! Keep flat plank alignment."
                is_good_form = False
            elif hip_angle > 195:
                feedback = "ALERT: Lower hips! Do not pike upward."
                is_good_form = False
            else:
                feedback = "Solid plank posture! Keep holding."

        elif exercise == "deadlift":
            shoulder = [landmarks[11].x, landmarks[11].y]
            hip = [landmarks[23].x, landmarks[23].y]
            knee = [landmarks[25].x, landmarks[25].y]

            hip_angle = calculate_angle(shoulder, hip, knee)

            angle_to_return = round(hip_angle, 1)
            angles["leftHip"] = hip_angle

            if hip_angle < 65:
                feedback = "ALERT: Flat back required! Hinge through hips."
                is_good_form = False
            elif hip_angle >= 160:
                feedback = "Full lockout position! Lower controlled."
            else:
                feedback = "Good lift trajectory! Keep bar close."

        else:
            angle_to_return = 180
            feedback = "Performing standard motion check."

        return {
            "feedback": feedback,
            "is_good_form": is_good_form,
            "angle": angle_to_return,
            "angles": angles,
            "landmarks": landmark_list,
        }

    except Exception as error:
        return {
            "feedback": f"Processing error: {error}",
            "is_good_form": False,
            "angle": None,
            "angles": {},
            "landmarks": [],
        }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )