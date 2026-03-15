from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import secrets
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demo (replace with MongoDB in production)
users_db = {}
companies_db = {}
tokens_db = {}

# Demo users with pre-set credentials
DEMO_USERS = {
    "aminderpro@gmail.com": {
        "email": "aminderpro@gmail.com",
        "password_hash": hashlib.sha256("Admin@123!".encode()).hexdigest(),
        "full_name": "Admin Pro",
        "phone": "+1234567890",
        "role": "platform_admin",
        "company_id": "demo_company_1",
        "created_at": datetime.utcnow().isoformat()
    },
    "demo@test.com": {
        "email": "demo@test.com",
        "password_hash": hashlib.sha256("demo123".encode()).hexdigest(),
        "full_name": "Demo User",
        "phone": "+1234567890",
        "role": "fleet_owner",
        "company_id": "demo_company_2",
        "created_at": datetime.utcnow().isoformat()
    }
}

# Initialize demo users
users_db.update(DEMO_USERS)

# Pydantic models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str
    role: str

class CompanyCreate(BaseModel):
    name: str
    company_type: str
    address: str
    city: str
    state: str
    zip_code: str
    tax_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

def generate_token():
    return secrets.token_urlsafe(32)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_current_user(authorization: str = None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    if token not in tokens_db:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    email = tokens_db[token]
    if email not in users_db:
        raise HTTPException(status_code=401, detail="User not found")
    
    return users_db[email]

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    email = request.email.lower()
    password_hash = hash_password(request.password)
    
    if email not in users_db:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = users_db[email]
    if user["password_hash"] != password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate token
    token = generate_token()
    tokens_db[token] = email
    
    # Return user data without password_hash
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    
    return TokenResponse(
        access_token=token,
        user=user_response
    )

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    email = request.email.lower()
    
    if email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = {
        "email": email,
        "password_hash": hash_password(request.password),
        "full_name": request.full_name,
        "phone": request.phone,
        "role": request.role,
        "company_id": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    users_db[email] = user
    
    return {"message": "User registered successfully", "email": email}

@app.post("/api/companies")
async def create_company(company: CompanyCreate, authorization: str = None):
    user = get_current_user(authorization)
    
    company_id = f"company_{secrets.token_hex(8)}"
    company_data = {
        "id": company_id,
        "name": company.name,
        "company_type": company.company_type,
        "address": company.address,
        "city": company.city,
        "state": company.state,
        "zip_code": company.zip_code,
        "tax_id": company.tax_id,
        "owner_email": user["email"],
        "status": "pending_verification",
        "created_at": datetime.utcnow().isoformat()
    }
    
    companies_db[company_id] = company_data
    
    # Update user's company_id
    users_db[user["email"]]["company_id"] = company_id
    
    return company_data

@app.get("/api/companies/current")
async def get_current_company(authorization: str = None):
    user = get_current_user(authorization)
    
    company_id = user.get("company_id")
    if not company_id or company_id not in companies_db:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return companies_db[company_id]

@app.get("/api/companies/my")
async def get_my_company(authorization: str = None):
    return await get_current_company(authorization)

@app.get("/api/users/me")
async def get_me(authorization: str = None):
    user = get_current_user(authorization)
    return {k: v for k, v in user.items() if k != "password_hash"}

# Features endpoint for FeatureLoader
@app.get("/api/features")
async def get_features():
    return {
        "features": [
            {"name": "dashboard", "enabled": True},
            {"name": "fleet_management", "enabled": True},
            {"name": "driver_management", "enabled": True},
            {"name": "booking_management", "enabled": True},
            {"name": "order_management", "enabled": True},
            {"name": "equipment_management", "enabled": True},
            {"name": "carrier_profile", "enabled": True},
            {"name": "analytics", "enabled": True},
            {"name": "admin_console", "enabled": True}
        ]
    }
