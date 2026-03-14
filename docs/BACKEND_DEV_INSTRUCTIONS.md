# Carrier Profile Builder - Backend Implementation Instructions

## For: Backend Developer
## Priority: High
## Estimated Effort: 2-3 days

---

## What You're Building

A backend API to support the Carrier Profile Builder wizard in the TMS frontend. The frontend is **already deployed and functional** using localStorage for demo. Your job is to implement the real API endpoints so data persists in the database.

**Live Frontend:** https://1be480b8-f0dc-439f-83a6-3225cd134318.preview.emergentagent.com
**Access:** Login → Dashboard → Company dropdown → "Carrier Profile Builder"

---

## Database Schema

Create these MongoDB collections:

### Collection: `carrier_profiles`
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,           // Reference to users collection
  company_id: ObjectId,        // Reference to companies collection
  
  company_info: {
    legal_name: String,        // Required
    dba_name: String,
    company_type: String,      // "trucking_company" | "owner_operator" | "both"
    country: String,           // "Canada" | "USA" | "Both"
    province: String,
    phone: String,             // Required
    email: String,             // Required
    website: String,
    logo_url: String           // S3/Cloudinary URL
  },
  
  documents: [{
    _id: ObjectId,
    document_type: String,     // e.g., "nsc_certificate", "usdot_mc_authority"
    name: String,              // Display name
    file_url: String,          // S3/Cloudinary URL
    file_name: String,         // Original filename
    uploaded_at: Date,
    expiry_date: Date,
    status: String             // "uploaded" | "expired" | "expiring_soon"
  }],
  
  regulatory: {
    // Canadian
    nsc_number: String,
    nsc_safety_rating: String, // "Satisfactory" | "Conditional" | "Unsatisfactory" | "Unrated"
    cvor_number: String,
    cvor_safety_rating: String,
    cra_business_number: String,
    gst_hst_number: String,
    // US
    usdot_number: String,
    mc_number: String,
    ein: String,
    ifta_account_number: String,
    ifta_base_jurisdiction: String,
    // Cross-border
    cross_border_capable: Boolean,
    fast_card_enrolled: Boolean
  },
  
  fleet: {
    number_of_trucks: Number,
    number_of_trailers: Number,
    equipment_types: [String], // ["dry_van", "reefer", "flatbed", etc.]
    hazmat_capable: Boolean,
    cross_border_capable: Boolean,
    eld_provider: String,
    preferred_lanes: [{
      origin: String,
      destination: String,
      service_type: String     // "ftl" | "ltl" | "both"
    }],
    is_24x7_dispatch: Boolean
  },
  
  payment: {
    payment_method: String,    // "eft" | "cheque" | "wire" | "factoring"
    factoring_company_name: String,
    noa_document_url: String,
    bank_name: String,
    transit_number_encrypted: String,      // ENCRYPT THIS
    institution_number_encrypted: String,  // ENCRYPT THIS
    aba_routing_number_encrypted: String,  // ENCRYPT THIS
    account_number_encrypted: String,      // ENCRYPT THIS
    account_type: String,      // "chequing" | "savings"
    currency: String,          // "CAD" | "USD" | "Both"
    payment_terms: String      // "quick_pay" | "net_15" | "net_30" | "net_45"
  },
  
  current_step: Number,        // 1-5, tracks wizard progress
  is_complete: Boolean,
  completed_at: Date,
  created_at: Date,
  updated_at: Date
}
```

### Collection: `carrier_packages`
```javascript
{
  _id: ObjectId,
  carrier_profile_id: ObjectId,
  recipient_name: String,
  recipient_company: String,
  recipient_email: String,
  message: String,
  document_ids: [ObjectId],
  documents_included: [String],  // Document names for display
  pdf_url: String,
  date_sent: Date,
  status: String,                // "sent" | "opened" | "downloaded"
  last_opened: Date,
  reminder_sent_at: Date,
  created_at: Date
}
```

---

## API Endpoints to Implement

### Base Path: `/api/carrier-profiles`

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

### 1. GET /api/carrier-profiles/me

**Purpose:** Get current user's carrier profile

**Logic:**
```python
@router.get("/me")
async def get_my_profile(current_user = Depends(get_current_user)):
    profile = await db.carrier_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(404, "Profile not found")
    
    # Mask sensitive banking fields
    if profile.get("payment"):
        if profile["payment"].get("account_number_encrypted"):
            decrypted = decrypt(profile["payment"]["account_number_encrypted"])
            profile["payment"]["account_number_masked"] = "****" + decrypted[-4:]
            del profile["payment"]["account_number_encrypted"]
        # Remove other encrypted fields from response
        for field in ["transit_number_encrypted", "institution_number_encrypted", "aba_routing_number_encrypted"]:
            if field in profile["payment"]:
                del profile["payment"][field]
    
    return profile
```

**Response:** Full profile object (see schema above)

---

### 2. POST /api/carrier-profiles

**Purpose:** Create new carrier profile

**Logic:**
```python
@router.post("/")
async def create_profile(data: dict, current_user = Depends(get_current_user)):
    # Check if profile already exists
    existing = await db.carrier_profiles.find_one({"user_id": current_user.id})
    if existing:
        raise HTTPException(409, "Profile already exists")
    
    profile = {
        "user_id": current_user.id,
        "company_id": current_user.company_id,
        "company_info": data.get("company_info", {}),
        "documents": [],
        "regulatory": {},
        "fleet": {"equipment_types": [], "preferred_lanes": []},
        "payment": {},
        "current_step": 1,
        "is_complete": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.carrier_profiles.insert_one(profile)
    profile["_id"] = result.inserted_id
    return profile
```

---

### 3. PATCH /api/carrier-profiles/me

**Purpose:** Update profile (partial update - most important endpoint!)

**Logic:**
```python
@router.patch("/me")
async def update_profile(data: dict, current_user = Depends(get_current_user)):
    profile = await db.carrier_profiles.find_one({"user_id": current_user.id})
    if not profile:
        # Auto-create if doesn't exist
        profile = await create_profile({}, current_user)
    
    update_data = {"updated_at": datetime.utcnow()}
    
    # Handle nested updates
    if "company_info" in data:
        for key, value in data["company_info"].items():
            update_data[f"company_info.{key}"] = value
    
    if "regulatory" in data:
        for key, value in data["regulatory"].items():
            update_data[f"regulatory.{key}"] = value
    
    if "fleet" in data:
        for key, value in data["fleet"].items():
            update_data[f"fleet.{key}"] = value
    
    if "payment" in data:
        for key, value in data["payment"].items():
            # Encrypt sensitive fields
            if key in ["account_number", "transit_number", "institution_number", "aba_routing_number"]:
                update_data[f"payment.{key}_encrypted"] = encrypt(value)
            else:
                update_data[f"payment.{key}"] = value
    
    if "current_step" in data:
        update_data["current_step"] = data["current_step"]
    
    await db.carrier_profiles.update_one(
        {"user_id": current_user.id},
        {"$set": update_data}
    )
    
    return await get_my_profile(current_user)
```

---

### 4. POST /api/carrier-profiles/me/complete

**Purpose:** Mark profile as complete

```python
@router.post("/me/complete")
async def complete_profile(current_user = Depends(get_current_user)):
    await db.carrier_profiles.update_one(
        {"user_id": current_user.id},
        {"$set": {
            "is_complete": True,
            "completed_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )
    return {"status": "completed", "completed_at": datetime.utcnow()}
```

---

### 5. POST /api/carrier-profiles/me/logo

**Purpose:** Upload company logo

```python
@router.post("/me/logo")
async def upload_logo(file: UploadFile, current_user = Depends(get_current_user)):
    # Validate file
    if file.content_type not in ["image/png", "image/jpeg", "image/svg+xml"]:
        raise HTTPException(400, "Invalid file type. Use PNG, JPG, or SVG")
    
    if file.size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(400, "File too large. Max 5MB")
    
    # Upload to S3/Cloudinary
    logo_url = await upload_to_storage(file, folder="logos")
    
    # Update profile
    await db.carrier_profiles.update_one(
        {"user_id": current_user.id},
        {"$set": {"company_info.logo_url": logo_url, "updated_at": datetime.utcnow()}}
    )
    
    return {"logo_url": logo_url}
```

---

### 6. POST /api/carrier-profiles/me/documents

**Purpose:** Upload a document

```python
@router.post("/me/documents")
async def upload_document(
    file: UploadFile,
    document_type: str = Form(...),
    expiry_date: str = Form(None),
    current_user = Depends(get_current_user)
):
    # Validate
    if file.content_type not in ["application/pdf", "image/png", "image/jpeg"]:
        raise HTTPException(400, "Invalid file type. Use PDF, PNG, or JPG")
    
    if file.size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(400, "File too large. Max 10MB")
    
    # Upload to storage
    file_url = await upload_to_storage(file, folder="documents")
    
    # Get document display name
    doc_names = {
        "nsc_certificate": "NSC Certificate",
        "cvor_abstract": "CVOR Abstract",
        "cargo_insurance_ca": "Cargo Insurance Certificate (CA)",
        "auto_liability_ca": "Auto Liability Certificate (CA)",
        "wsib_clearance": "WSIB Clearance Certificate",
        "gst_hst_registration": "GST/HST Registration",
        "void_cheque": "Void Cheque or Bank Letter",
        "usdot_mc_authority": "USDOT / MC Authority Letter",
        "boc3_filing": "BOC-3 Filing Confirmation",
        "ucr_receipt": "UCR Receipt",
        "ifta_licence": "IFTA Licence",
        "cargo_insurance_us": "Cargo Insurance Certificate (US)",
        "auto_liability_us": "Auto Liability Certificate (US)",
        "w9_w8ben": "W-9 or W-8BEN"
    }
    
    # Calculate status
    status = "uploaded"
    exp_date = None
    if expiry_date:
        exp_date = datetime.fromisoformat(expiry_date)
        if exp_date < datetime.utcnow():
            status = "expired"
        elif (exp_date - datetime.utcnow()).days <= 30:
            status = "expiring_soon"
    
    doc = {
        "_id": ObjectId(),
        "document_type": document_type,
        "name": doc_names.get(document_type, document_type),
        "file_url": file_url,
        "file_name": file.filename,
        "uploaded_at": datetime.utcnow(),
        "expiry_date": exp_date,
        "status": status
    }
    
    await db.carrier_profiles.update_one(
        {"user_id": current_user.id},
        {"$push": {"documents": doc}, "$set": {"updated_at": datetime.utcnow()}}
    )
    
    return doc
```

---

### 7. DELETE /api/carrier-profiles/me/documents/{document_id}

```python
@router.delete("/me/documents/{document_id}")
async def delete_document(document_id: str, current_user = Depends(get_current_user)):
    await db.carrier_profiles.update_one(
        {"user_id": current_user.id},
        {"$pull": {"documents": {"_id": ObjectId(document_id)}}}
    )
    return {"status": "deleted"}
```

---

### 8. POST /api/carrier-profiles/me/packages

**Purpose:** Send document package to recipient

```python
@router.post("/me/packages")
async def send_package(data: dict, current_user = Depends(get_current_user)):
    profile = await db.carrier_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(404, "Profile not found")
    
    # Get selected documents
    doc_ids = [ObjectId(d) for d in data["document_ids"]]
    selected_docs = [d for d in profile["documents"] if d["_id"] in doc_ids]
    
    # Generate PDF (use your PDF library)
    pdf_url = await generate_package_pdf(
        company_info=profile["company_info"],
        documents=selected_docs,
        recipient=data
    )
    
    # Create package record
    package = {
        "carrier_profile_id": profile["_id"],
        "recipient_name": data["recipient_name"],
        "recipient_company": data["recipient_company"],
        "recipient_email": data["recipient_email"],
        "message": data.get("message", ""),
        "document_ids": doc_ids,
        "documents_included": [d["name"] for d in selected_docs],
        "pdf_url": pdf_url,
        "date_sent": datetime.utcnow(),
        "status": "sent",
        "created_at": datetime.utcnow()
    }
    
    result = await db.carrier_packages.insert_one(package)
    package["_id"] = result.inserted_id
    
    # Send email (use SendGrid or similar)
    await send_package_email(
        to_email=data["recipient_email"],
        to_name=data["recipient_name"],
        from_company=profile["company_info"]["legal_name"],
        pdf_url=pdf_url,
        message=data.get("message", "")
    )
    
    return package
```

---

### 9. GET /api/carrier-profiles/me/packages

```python
@router.get("/me/packages")
async def get_packages(current_user = Depends(get_current_user)):
    profile = await db.carrier_profiles.find_one({"user_id": current_user.id})
    if not profile:
        return []
    
    packages = await db.carrier_packages.find(
        {"carrier_profile_id": profile["_id"]}
    ).sort("date_sent", -1).to_list(100)
    
    return packages
```

---

## File Storage Setup

Use S3, Cloudinary, or similar. Example with S3:

```python
import boto3
from botocore.config import Config

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    region_name='us-east-1'
)

async def upload_to_storage(file: UploadFile, folder: str) -> str:
    key = f"{folder}/{uuid.uuid4()}-{file.filename}"
    
    s3_client.upload_fileobj(
        file.file,
        os.environ['S3_BUCKET'],
        key,
        ExtraArgs={'ContentType': file.content_type}
    )
    
    # Return signed URL or public URL
    return f"https://{os.environ['S3_BUCKET']}.s3.amazonaws.com/{key}"
```

---

## Encryption for Banking Fields

```python
from cryptography.fernet import Fernet

# Store this key securely in environment variables
ENCRYPTION_KEY = os.environ['ENCRYPTION_KEY']  # Generate with Fernet.generate_key()
cipher = Fernet(ENCRYPTION_KEY)

def encrypt(value: str) -> str:
    return cipher.encrypt(value.encode()).decode()

def decrypt(encrypted_value: str) -> str:
    return cipher.decrypt(encrypted_value.encode()).decode()
```

---

## Environment Variables Needed

```bash
# Add to your .env file
MONGO_URL=mongodb://...
DB_NAME=tms_db

# File Storage (S3 example)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=tms-carrier-docs

# Encryption
ENCRYPTION_KEY=your-32-byte-fernet-key

# Email (SendGrid example)
SENDGRID_API_KEY=...
EMAIL_FROM=noreply@yourtms.com
```

---

## Testing Your Implementation

### Quick Test Commands

```bash
# Set your token
export TOKEN="your_jwt_token"
export API="https://api.staging.integratedtech.ca"

# 1. Create/Get profile
curl -X GET "$API/api/carrier-profiles/me" -H "Authorization: Bearer $TOKEN"

# 2. Update company info
curl -X PATCH "$API/api/carrier-profiles/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"company_info": {"legal_name": "Test Trucking", "country": "Canada"}}'

# 3. Upload a document
curl -X POST "$API/api/carrier-profiles/me/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf" \
  -F "document_type=nsc_certificate"

# 4. Complete profile
curl -X POST "$API/api/carrier-profiles/me/complete" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Sync with Frontend

Once your endpoints are ready:

1. **Test locally** using the cURL commands above
2. **Deploy to staging** at `api.staging.integratedtech.ca`
3. **Notify frontend team** - they will update the React code to call your APIs instead of localStorage
4. **Test together** using the live frontend

The frontend expects these exact endpoint paths. Don't change the URL structure.

---

## Questions?

The frontend code is at: `/app/src/components/carrier-profile/`

Key files to reference:
- `CarrierProfileWizard.js` - Main logic, shows what data is saved at each step
- `steps/*.js` - Individual step forms showing field names
- `SendPackageModal.js` - Package sending flow

---

**Priority Order:**
1. `PATCH /me` - Most critical, handles all form saves
2. `GET /me` - Loads existing data
3. `POST /me/documents` - Document uploads
4. `POST /me/packages` - Package sending (can be phase 2)
