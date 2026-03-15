from fastapi import FastAPI, HTTPException, Depends, Header
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

def get_current_user(authorization: Optional[str] = Header(None)):
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
async def create_company(company: CompanyCreate, user: dict = Depends(get_current_user)):
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
async def get_current_company(user: dict = Depends(get_current_user)):
    company_id = user.get("company_id")
    if not company_id or company_id not in companies_db:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return companies_db[company_id]

@app.get("/api/companies/my")
async def get_my_company(user: dict = Depends(get_current_user)):
    company_id = user.get("company_id")
    if not company_id or company_id not in companies_db:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return companies_db[company_id]

@app.get("/api/users/me")
async def get_me(user: dict = Depends(get_current_user)):
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

# Admin endpoints
DEMO_PLANS = [
    {
        "id": "tms_starter",
        "label": "Transportation Management System",
        "tier": "Starter",
        "subtitle": "For small fleet operations",
        "description": "Complete fleet operations with real-time tracking, order management, and comprehensive analytics for small to medium fleets.",
        "price": 299,
        "status": "active",
        "features": [
            "✓ Real-time GPS tracking",
            "✓ Order management",
            "✓ AI-powered tools",
            "✓ Up to 25 vehicles",
            "✓ Basic analytics"
        ]
    },
    {
        "id": "tms_professional",
        "label": "Transportation Management System",
        "tier": "Professional",
        "subtitle": "For growing businesses",
        "description": "Advanced fleet management with enhanced analytics, driver management, and multi-location support.",
        "price": 599,
        "status": "active",
        "features": [
            "✓ Everything in Starter",
            "✓ Up to 100 vehicles",
            "✓ Advanced analytics",
            "✓ Driver management",
            "✓ Multi-location support"
        ]
    },
    {
        "id": "tms_enterprise",
        "label": "Transportation Management System",
        "tier": "Enterprise",
        "subtitle": "For large operations",
        "description": "Full-scale enterprise solution with unlimited vehicles, custom integrations, and dedicated support.",
        "price": 1299,
        "status": "active",
        "features": [
            "✓ Everything in Professional",
            "✓ Unlimited vehicles",
            "✓ Custom integrations",
            "✓ Dedicated support",
            "✓ SLA guarantees"
        ]
    },
    {
        "id": "heavy_tms",
        "label": "Heavy Transportation Management System",
        "tier": "Standard",
        "subtitle": "Specialized for heavy equipment",
        "description": "Specialized for oversized loads, heavy equipment hauling, and permit management.",
        "price": 799,
        "status": "active",
        "features": [
            "✓ Oversized load management",
            "✓ Permit tracking",
            "✓ Route planning",
            "✓ Weight compliance",
            "✓ Equipment scheduling"
        ]
    },
    {
        "id": "broker_ms",
        "label": "Broker Management System",
        "tier": "Standard",
        "subtitle": "For freight brokers",
        "description": "Streamline freight brokerage with carrier management, load matching, and workflows.",
        "price": 449,
        "status": "active",
        "features": [
            "✓ Carrier network",
            "✓ Load matching",
            "✓ Rate management",
            "✓ Invoice automation",
            "✓ Carrier compliance"
        ]
    },
    {
        "id": "dispatch_ms",
        "label": "Dispatch Management System",
        "tier": "Standard",
        "subtitle": "Optimize dispatching",
        "description": "Optimize dispatching with real-time load assignment and driver communication.",
        "price": 349,
        "status": "active",
        "features": [
            "✓ Real-time dispatch",
            "✓ Load optimization",
            "✓ ETA tracking",
            "✓ Driver communication",
            "✓ Route optimization"
        ]
    },
    {
        "id": "freight_ms",
        "label": "Freight Management System",
        "tier": "Standard",
        "subtitle": "End-to-end freight ops",
        "description": "End-to-end freight operations covering shipment tracking and documentation.",
        "price": 499,
        "status": "active",
        "features": [
            "✓ Shipment tracking",
            "✓ Multi-modal transport",
            "✓ Freight audit",
            "✓ Documentation",
            "✓ Carrier selection"
        ]
    },
    {
        "id": "vehicle_ms",
        "label": "Vehicle Management System",
        "tier": "Standard",
        "subtitle": "Fleet maintenance",
        "description": "Complete fleet maintenance including scheduling, inspections, and fuel management.",
        "price": 249,
        "status": "active",
        "features": [
            "✓ Preventive maintenance",
            "✓ DVIR inspections",
            "✓ Fuel tracking",
            "✓ Parts inventory",
            "✓ Service scheduling"
        ]
    },
    {
        "id": "route_mate",
        "label": "Integrated Route Mate",
        "tier": "Standard",
        "subtitle": "Route optimization",
        "description": "Advanced route optimization with real-time traffic, multi-stop planning, and delivery windows.",
        "price": 199,
        "status": "active",
        "features": [
            "✓ Multi-stop routing",
            "✓ Real-time traffic",
            "✓ Delivery windows",
            "✓ Driver assignments",
            "✓ Customer notifications"
        ]
    },
    {
        "id": "driver_app",
        "label": "Driver App",
        "tier": "Standard",
        "subtitle": "Mobile driver interface",
        "description": "Mobile app for drivers with load management, navigation, and document capture.",
        "price": 49,
        "status": "active",
        "features": [
            "✓ Load acceptance",
            "✓ Turn-by-turn navigation",
            "✓ Document capture",
            "✓ Electronic POD",
            "✓ Hours of service"
        ]
    }
]

DEMO_TENANTS = [
    {
        "id": "tenant_1",
        "name": "ABC Trucking Co",
        "plan": "tms_professional",
        "seats": 50,
        "status": "active",
        "feature_flags": {"analytics": True, "api_access": True},
        "created_at": "2025-01-15T10:00:00Z"
    },
    {
        "id": "tenant_2",
        "name": "XYZ Logistics",
        "plan": "tms_starter",
        "seats": 20,
        "status": "active",
        "feature_flags": {"analytics": True, "api_access": False},
        "created_at": "2025-02-20T14:30:00Z"
    }
]

@app.get("/api/admin/plans")
async def get_admin_plans(user: dict = Depends(get_current_user)):
    if user.get("role") != "platform_admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return DEMO_PLANS

@app.get("/api/admin/tenants")
async def get_admin_tenants(user: dict = Depends(get_current_user)):
    if user.get("role") != "platform_admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return DEMO_TENANTS

@app.get("/api/admin/tenants/{tenant_id}/integrations")
async def get_tenant_integrations(tenant_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "platform_admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return []

@app.put("/api/admin/tenants/{tenant_id}")
async def update_tenant(tenant_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "platform_admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    for tenant in DEMO_TENANTS:
        if tenant["id"] == tenant_id:
            return tenant
    raise HTTPException(status_code=404, detail="Tenant not found")
