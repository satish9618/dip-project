import os
import uuid
import cv2
import requests
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from firebase_admin import credentials, firestore, initialize_app
from google.oauth2 import service_account
import google.auth.transport.requests
from ultralytics import YOLO
import uvicorn

# Firebase Setup
SERVICE_ACCOUNT_FILE = "serviceAccountKey.json"
SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"]
PROJECT_ID = "dr-animal-64f85"
TARGET_CLASSES = ["Leopard"]

# Initialize Firebase
cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
initialize_app(cred, {"projectId": PROJECT_ID})
db = firestore.client()

# Load YOLOv8 Model
model = YOLO("best.pt")

# Initialize FastAPI
app = FastAPI()

@app.get("/")
def root():
    return {"message": "🎯 Drishti Raksha is running"}

def send_alert(title: str, body: str):
    try:
        tokens_ref = db.collection("fcm_tokens")
        tokens_docs = tokens_ref.stream()
        tokens = [doc.to_dict().get("token") for doc in tokens_docs if doc.to_dict().get("token")]

        if not tokens:
            print("No FCM tokens found.")
            return

        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES
        )
        request = google.auth.transport.requests.Request()
        credentials.refresh(request)
        access_token = credentials.token

        for token in tokens:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            payload = {
                "message": {
                    "token": token,
                    "notification": {
                        "title": title,
                        "body": body
                    }
                }
            }
            url = f"https://fcm.googleapis.com/v1/projects/{PROJECT_ID}/messages:send"
            response = requests.post(url, headers=headers, json=payload)
            print(f"✅ Alert sent to {token} - Status: {response.status_code}")
    except Exception as e:
        print("❌ Error sending alert:", str(e))

@app.post("/upload-video/")
async def upload_video(file: UploadFile = File(...)):
    try:
        # Save uploaded video
        filename = f"temp_{uuid.uuid4().hex}.mp4"
        file_path = os.path.join("uploads", filename)
        os.makedirs("uploads", exist_ok=True)

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        cap = cv2.VideoCapture(file_path)
        alert_triggered = False
        frame_counter = 0  # Initialize frame counter

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_counter += 1  # Increment frame counter

            # Only process every 10th frame for efficiency
            if frame_counter % 13 == 0:
                results = model(frame)
                classes = results[0].boxes.cls.tolist() if results[0].boxes else []
                class_names = [results[0].names[int(c)] for c in classes]

                if any(cls in TARGET_CLASSES for cls in class_names):
                    if not alert_triggered:
                        send_alert("🚨 Alert!", "Suspicious object detected in uploaded video.")
                        alert_triggered = True

        cap.release()
        os.remove(file_path)

        return JSONResponse(content={
            "status": "success",
            "message": "Video processed.",
            "alert_sent": alert_triggered
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# This is where you run the FastAPI server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
