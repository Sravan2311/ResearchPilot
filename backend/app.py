import os
import shutil
import time
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from utils.db import get_db, is_mock_db
from utils.auth import hash_password, verify_password, create_access_token, decode_access_token
from agents.orchestrator import ResearchOrchestrator

app = FastAPI(
    title="ResearchPilot AI Backend",
    description="Multi-Agent Research Assistant API with Authentication & MongoDB",
    version="1.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Instantiate orchestrator
orchestrator = ResearchOrchestrator()
db = get_db()

# Pydantic Schemas
class UserRegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class ResetPasswordSchema(BaseModel):
    old_password: str
    new_password: str

class ForgotPasswordSchema(BaseModel):
    email: EmailStr
    new_password: str

class UpdateProfileSchema(BaseModel):
    full_name: Optional[str] = ""
    institution: Optional[str] = ""
    role: Optional[str] = "Researcher"

class SmtpConfigSchema(BaseModel):
    user: str
    password: str
    host: Optional[str] = "smtp.gmail.com"
    port: Optional[int] = 587

class ContactMessageSchema(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
    smtp_config: Optional[SmtpConfigSchema] = None

# JWT Authentication Dependency Helper
def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing.")
    
    # Expected: "Bearer <token>"
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format. Use 'Bearer <token>'.")
        
    token = parts[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token is expired or invalid.")
        
    return payload

@app.get("/api/health")
def health_check():
    from utils.db import is_mock_db
    return {
        "status": "healthy",
        "api_key_configured": os.getenv("OPENAI_API_KEY") is not None,
        "database": "mock_in_memory" if is_mock_db else "mongodb"
    }

# --- Authentication Endpoints ---

@app.post("/api/auth/register")
def register_user(user_data: UserRegisterSchema):
    # Check if user already exists
    if db.users.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Account with this email already exists.")
        
    if db.users.find_one({"username": user_data.username}):
        raise HTTPException(status_code=400, detail="Username is already taken.")
        
    hashed = hash_password(user_data.password)
    user_record = {
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed,
        "created_at": time.time()
    }
    
    result = db.users.insert_one(user_record)
    return {
        "success": True,
        "message": "User registered successfully.",
        "user_id": str(result.inserted_id)
    }

@app.post("/api/auth/login")
def login_user(credentials: UserLoginSchema):
    user = db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password.")
        
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password.")
        
    user_id = str(user["_id"])
    token = create_access_token(user_id, user["username"])
    
    return {
        "success": True,
        "token": token,
        "username": user["username"],
        "email": user["email"]
    }

@app.post("/api/auth/reset-password")
def reset_password(data: ResetPasswordSchema, current_user: dict = Depends(get_current_user)):
    user = db.users.find_one({"username": current_user.get("username")})
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    if not verify_password(data.old_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password entered is incorrect.")
        
    hashed_new = hash_password(data.new_password)
    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed_new}}
    )
    return {
        "success": True,
        "message": "Password updated successfully."
    }

@app.post("/api/auth/forgot-password")
def forgot_password(data: ForgotPasswordSchema):
    user = db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="No user registered with this email address.")
        
    hashed_new = hash_password(data.new_password)
    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed_new}}
    )
    return {
        "success": True,
        "message": "Password reset completed successfully. Please sign in with your new password!"
    }

@app.get("/api/auth/profile")
def get_user_profile(current_user: dict = Depends(get_current_user)):
    user = db.users.find_one({"username": current_user.get("username")})
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    return {
        "username": user.get("username"),
        "email": user.get("email"),
        "full_name": user.get("full_name", ""),
        "institution": user.get("institution", ""),
        "role": user.get("role", "Researcher"),
        "created_at": user.get("created_at", time.time())
    }

@app.post("/api/auth/update-profile")
def update_profile(data: UpdateProfileSchema, current_user: dict = Depends(get_current_user)):
    user = db.users.find_one({"username": current_user.get("username")})
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
        
    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "full_name": data.full_name,
            "institution": data.institution,
            "role": data.role
        }}
    )
    return {
        "success": True,
        "message": "Profile updated successfully.",
        "full_name": data.full_name,
        "institution": data.institution,
        "role": data.role
    }

# --- Analysis & History Endpoints ---

@app.post("/api/analyze")
async def analyze_papers(
    files: List[UploadFile] = File(...),
    api_key: str = Form(None),
    base_url: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Receives PDF papers, runs the pipeline, logs outputs, 
    and saves the complete survey dossier to MongoDB linked to the user.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
        
    saved_paths = []
    try:
        # Save files temporarily
        for file in files:
            if not file.filename.endswith(".pdf"):
                raise HTTPException(status_code=400, detail=f"File '{file.filename}' is not a PDF.")
            
            save_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_paths.append(save_path)

        # Build custom orchestrator if key provided
        pipeline_orchestrator = orchestrator
        if api_key:
            pipeline_orchestrator = ResearchOrchestrator(api_key=api_key, base_url=base_url)

        # Run multi-agent pipeline
        result = pipeline_orchestrator.run_pipeline(saved_paths)
        
        # Save results to user's MongoDB history if pipeline succeeded
        if result.get("success"):
            dossier = {
                "user_id": current_user["sub"],
                "timestamp": time.time(),
                "papers": result["papers"],
                "matrix": result["matrix"],
                "gaps": result["gaps"]
            }
            db.dossiers.insert_one(dossier)
            
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Clean up temp files
        for path in saved_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print(f"Error removing temporary file {path}: {e}")

@app.get("/api/history")
def get_user_history(current_user: dict = Depends(get_current_user)):
    """
    Fetches the logged-in user's historical dossiers.
    """
    user_id = current_user["sub"]
    history = db.dossiers.find({"user_id": user_id})
    
    cleaned_history = []
    for doc in history:
        cleaned_history.append({
            "id": str(doc["_id"]),
            "timestamp": doc["timestamp"],
            "papers": doc.get("papers", []),
            "matrix": doc.get("matrix", []),
            "gaps": doc.get("gaps", [])
        })
        
    # Sort history by newest first
    cleaned_history.sort(key=lambda x: x["timestamp"], reverse=True)
    return cleaned_history

@app.delete("/api/history/{dossier_id}")
def delete_history_entry(dossier_id: str, current_user: dict = Depends(get_current_user)):
    """
    Deletes a historical literature survey dossier from MongoDB.
    """
    from bson.objectid import ObjectId
    user_id = current_user["sub"]
    
    # Try deleting using ObjectId for MongoDB, or string lookup for mock DB
    try:
        query = {"_id": ObjectId(dossier_id), "user_id": user_id}
        # If it fails, fall back to string query for mock DB
    except Exception:
        query = {"_id": dossier_id, "user_id": user_id}
        
    result = db.dossiers.find_one(query)
    if not result:
        # Retry with string query if ObjectId parse error
        query = {"_id": dossier_id, "user_id": user_id}
        
    # Perform deletion
    # Depending on mock vs real, handle it:
    if is_mock_db: # Mock database
        if dossier_id in db.dossiers.data:
            del db.dossiers.data[dossier_id]
            return {"success": True, "message": "History entry deleted."}
    else: # Real MongoDB
        res = db.dossiers.delete_one(query)
        if res.deleted_count > 0:
            return {"success": True, "message": "History entry deleted."}
            
    raise HTTPException(status_code=404, detail="History entry not found or unauthorized.")

def send_support_email(name: str, email: str, subject: str, message: str, smtp_config: Optional[SmtpConfigSchema] = None):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    smtp_user = None
    smtp_password = None
    smtp_host = "smtp.gmail.com"
    smtp_port = 587
    
    if smtp_config:
        smtp_user = smtp_config.user
        smtp_password = smtp_config.password
        smtp_host = smtp_config.host or "smtp.gmail.com"
        smtp_port = smtp_config.port or 587
        
    if not smtp_user or not smtp_password:
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        try:
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
        except (ValueError, TypeError):
            smtp_port = 587
            
    recipient = "saisravanrajm@gmail.com"
    
    if not smtp_user or not smtp_password:
        print("[SMTP Alert] SMTP credentials not set. Falling back to FormSubmit.co direct-delivery API...")
        import urllib.request
        import json
        try:
            ticket_id = f"RP-{int(time.time() % 1000000)}"
            payload = {
                "Ticket ID": ticket_id,
                "Sender Name": name,
                "Sender Email": email,
                "Ticket Subject": subject,
                "Message Details": message,
                "Timestamp": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime()),
                "_subject": f"[ResearchPilot Admin Ticket] - {subject}"
            }
            req_data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                "https://formsubmit.co/ajax/saisravanrajm@gmail.com",
                data=req_data,
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'http://localhost:3000/',
                    'Origin': 'http://localhost:3000'
                }
            )
            with urllib.request.urlopen(req) as resp:
                resp_bytes = resp.read()
                resp_json = json.loads(resp_bytes.decode('utf-8'))
                print(f"[FormSubmit Success] Ticket successfully sent via FormSubmit.co API! Response: {resp_json}")
                return True
        except Exception as e:
            print(f"[FormSubmit Fallback Exception] Failed to send via FormSubmit fallback: {e}")
            return False
        
    try:
        ticket_id = f"RP-{int(time.time() % 1000000)}"
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = recipient
        msg['Subject'] = f"[ResearchPilot Admin Ticket] {subject}"
        
        body_text = f"""==================================================
        RESEARCHPILOT AI - ADMIN TICKET
==================================================
A new research support ticket has been submitted.

[TICKET DETAILS]
--------------------------------------------------
Ticket ID   : {ticket_id}
Sender Name : {name}
Sender Email: {email}
Subject     : {subject}
Timestamp   : {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}

[MESSAGE CONTENT]
--------------------------------------------------
{message}

--------------------------------------------------
ResearchPilot AI Heuristics Pipeline v1.1.0
=================================================="""
        msg.attach(MIMEText(body_text, 'plain'))
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, recipient, msg.as_string())
        server.quit()
        print(f"[SMTP Success] Email successfully sent to {recipient}")
        return True
    except Exception as err:
        print(f"[SMTP Error] Failed to send email: {err}")
        return False

@app.post("/api/contact")
def submit_contact_message(message_data: ContactMessageSchema):
    message_record = {
        "name": message_data.name,
        "email": message_data.email,
        "subject": message_data.subject,
        "message": message_data.message,
        "timestamp": time.time()
    }
    db.contact_messages.insert_one(message_record)
    
    # Try dynamic or env background email dispatch
    send_support_email(
        name=message_data.name,
        email=message_data.email,
        subject=message_data.subject,
        message=message_data.message,
        smtp_config=message_data.smtp_config
    )
    
    return {
        "success": True,
        "message": "Your message has been received successfully."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
