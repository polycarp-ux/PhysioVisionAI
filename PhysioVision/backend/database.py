import os
import json
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore


BASE_DIR = Path(__file__).resolve().parent
CREDENTIALS_PATH = BASE_DIR / "serviceAccountKey.json"

SERVICE_ACCOUNT_JSON = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

if not firebase_admin._apps:
    if SERVICE_ACCOUNT_JSON:
        try:
            cred = credentials.Certificate(json.loads(SERVICE_ACCOUNT_JSON))
        except json.JSONDecodeError as error:
            raise ValueError(
                "FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON"
            ) from error
    else:
        if not CREDENTIALS_PATH.exists():
            raise FileNotFoundError(
                f"Firebase credentials not found: {CREDENTIALS_PATH}"
            )
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(CREDENTIALS_PATH)
        cred = credentials.Certificate(str(CREDENTIALS_PATH))

    firebase_admin.initialize_app(cred)

db = firestore.client()


def save_user_to_firestore(user_id: str, email: str | None, name: str | None) -> None:
    db.collection("users").document(user_id).set(
        {
            "user_id": user_id,
            "email": email,
            "name": name,
            "updated_at": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )


def save_session_to_firestore(
    user_id: str,
    user_email: str | None,
    user_name: str | None,
    exercise_id: str,
    exercise_name: str,
    reps: int,
    duration: int,
    accuracy_score: float,
):
    try:
        # Creates: users/{user_id}/exercise_sessions/{session_id}
        user_ref = db.collection("users").document(user_id)
        session_ref = user_ref.collection("exercise_sessions").document()

        user_ref.set(
            {
                "user_id": user_id,
                "email": user_email,
                "name": user_name,
                "updated_at": firestore.SERVER_TIMESTAMP,
            },
            merge=True,
        )

        session_ref.set(
            {
                "session_id": session_ref.id,
                "user_id": user_id,
                "user_email": user_email,
                "user_name": user_name,
                "exercise_id": exercise_id,
                "exercise_name": exercise_name,
                "reps": reps,
                "duration_seconds": duration,
                "accuracy_score": accuracy_score,
                "created_at": firestore.SERVER_TIMESTAMP,
            }
        )

        return {
            "status": "success",
            "id": session_ref.id,
            "path": f"users/{user_id}/exercise_sessions/{session_ref.id}",
        }

    except Exception as error:
        print(f"Firestore Error: {error}")
        return {
            "status": "error",
            "message": str(error),
        }


def get_user_sessions(user_id: str) -> list[dict]:
    sessions = []
    query = (
        db.collection("users")
        .document(user_id)
        .collection("exercise_sessions")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
    )
    for snapshot in query.stream():
        session = snapshot.to_dict()
        session["id"] = snapshot.id
        created_at = session.get("created_at")
        if hasattr(created_at, "isoformat"):
            session["created_at"] = created_at.isoformat()
        sessions.append(session)
    return sessions