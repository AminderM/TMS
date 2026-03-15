# Carrier Profile Builder - Backend API Implementation Guide

**For:** Backend Developer  
**Priority:** High  
**Estimated Effort:** 2-3 days  
**Last Updated:** February 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Stack](#architecture--stack)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [File Storage](#file-storage)
6. [Encryption](#encryption)
7. [Document Types Reference](#document-types-reference)
8. [Security Requirements](#security-requirements)
9. [Environment Variables](#environment-variables)
10. [Testing](#testing)
11. [Frontend Integration Checklist](#frontend-integration-checklist)

---

## Overview

The Carrier Profile Builder is a 5-step wizard in the TMS frontend that allows carriers to:

1. **Company Info & Logo** - Enter company details and upload a logo
2. **Document Upload** - Upload compliance documents (country-specific for Canada/USA/Both)
3. **Regulatory Details** - Enter regulatory numbers (NSC, CVOR, USDOT, MC, etc.)
4. **Fleet & Lanes** - Configure fleet size, equipment types, and preferred shipping lanes
5. **Payment Setup** - Enter banking information (must be encrypted at rest)
6. **Send Packages** - Select documents, generate a PDF cover page, and email to a recipient

The frontend is **already built and functional** using `localStorage` for demo purposes. Your job is to implement the backend API so data persists in MongoDB.

### Live Frontend
- **URL:** `https://onboard-carrier-tms.preview.emergentagent.com`
- **Access:** Login -> Dashboard -> Company dropdown -> "Carrier Profile Builder"
- **Test Credentials:** `aminderpro@gmail.com` / `Admin@123!`

### Frontend Code Location
```
/app/src/components/carrier-profile/
  CarrierProfileWizard.js      # Main wizard logic (orchestrates all steps)
  carrierProfileAPI.js          # API service layer (replace localStorage here)
  steps/
    CompanyInfoStep.js          # Step 1 form
    DocumentUploadStep.js       # Step 2 file uploads
    RegulatoryDetailsStep.js    # Step 3 regulatory form
    FleetLanesStep.js           # Step 4 fleet config
    PaymentSetupStep.js         # Step 5 payment form
  ProfileCompleteScreen.js      # Completion summary view
  SendPackageModal.js           # Document package sending flow
  pdfGenerator.js               # Client-side PDF generation (move to server-side)
```

---

## Architecture & Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | FastAPI (Python) |
| Database | MongoDB |
| File Storage | S3 / Cloudinary (your choice) |
| Email Service | SendGrid / SES (your choice) |
| Encryption | Fernet (AES-128-CBC) via `cryptography` library |
| Authentication | JWT Bearer tokens (existing TMS auth system) |

---

## Database Schema

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
    logo_url: String           // Storage URL
  },
  
  documents: [{
    _id: ObjectId,
    document_type: String,     // e.g., "nsc_certificate", "usdot_mc_authority"
    name: String,              // Display name (see Document Types Reference)
    file_url: String,          // Storage URL (use signed URLs)
    file_name: String,         // Original filename
    uploaded_at: Date,
    expiry_date: Date,         // Optional
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
    equipment_types: [String], // ["dry_van", "reefer", "flatbed", "tanker", "step_deck", "hotshot", "sprinter", "other"]
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
    transit_number_encrypted: String,      // ENCRYPT - Canadian bank transit
    institution_number_encrypted: String,  // ENCRYPT - Canadian bank institution
    aba_routing_number_encrypted: String,  // ENCRYPT - US routing number
    account_number_encrypted: String,      // ENCRYPT - Bank account number
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
  document_ids: [ObjectId],        // References to documents in carrier_profiles
  documents_included: [String],    // Document display names for quick reference
  pdf_url: String,                 // Generated PDF storage URL
  date_sent: Date,
  status: String,                  // "sent" | "opened" | "downloaded"
  last_opened: Date,
  reminder_sent_at: Date,
  created_at: Date
}
```

---

## API Endpoints

### Base Path: `/api/carrier-profiles`

All endpoints require JWT authentication: `Authorization: Bearer <token>`

---

### 1. GET /api/carrier-profiles/me

**Purpose:** Load the current user's carrier profile.

**Response (200):**
```json
{
  "id": "profile_abc123",
  "user_id": "user_456",
  "company_id": "company_789",
  "company_info": {
    "legal_name": "Northern Express Trucking Inc.",
    "dba_name": "Northern Express",
    "company_type": "trucking_company",
    "country": "Canada",
    "province": "Ontario",
    "phone": "(416) 555-1234",
    "email": "dispatch@northernexpress.ca",
    "website": "https://northernexpress.ca",
    "logo_url": "https://storage.example.com/logos/company_789.png"
  },
  "documents": [
    {
      "id": "doc_1",
      "document_type": "nsc_certificate",
      "name": "NSC Certificate",
      "file_url": "https://storage.example.com/docs/nsc.pdf",
      "file_name": "nsc_certificate.pdf",
      "uploaded_at": "2024-01-15T10:30:00Z",
      "expiry_date": "2025-01-15T00:00:00Z",
      "status": "uploaded"
    }
  ],
  "regulatory": {
    "nsc_number": "NSC123456",
    "nsc_safety_rating": "Satisfactory",
    "cvor_number": "CVOR789",
    "cvor_safety_rating": "Satisfactory",
    "cra_business_number": "123456789RC0001",
    "gst_hst_number": "123456789RT0001",
    "usdot_number": null,
    "mc_number": null,
    "ein": null,
    "ifta_account_number": null,
    "ifta_base_jurisdiction": null,
    "cross_border_capable": true,
    "fast_card_enrolled": false
  },
  "fleet": {
    "number_of_trucks": 12,
    "number_of_trailers": 18,
    "equipment_types": ["dry_van", "reefer", "flatbed"],
    "hazmat_capable": false,
    "cross_border_capable": true,
    "eld_provider": "Samsara",
    "preferred_lanes": [
      { "origin": "Toronto", "destination": "Montreal", "service_type": "ftl" }
    ],
    "is_24x7_dispatch": true
  },
  "payment": {
    "payment_method": "eft",
    "factoring_company_name": null,
    "bank_name": "TD Bank",
    "account_number_masked": "****5678",
    "has_transit_number": true,
    "has_institution_number": true,
    "has_aba_routing_number": false,
    "account_type": "chequing",
    "currency": "CAD",
    "payment_terms": "net_30"
  },
  "current_step": 5,
  "is_complete": true,
  "completed_at": "2024-01-15T12:00:00Z",
  "created_at": "2024-01-10T09:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

**Response (404):** Profile not found - frontend shows empty wizard.

**Important Notes on Payment Response:**
- **Never return** raw encrypted fields in the response
- Return `account_number_masked` as `"****" + last_4_digits`
- Return boolean flags `has_transit_number`, `has_institution_number`, `has_aba_routing_number` so the frontend knows which fields are set
- Remove all `*_encrypted` fields before responding

---

### 2. POST /api/carrier-profiles

**Purpose:** Create a new carrier profile (called once when wizard starts for the first time).

**Request:**
```json
{
  "company_info": {
    "legal_name": "Northern Express Trucking Inc."
  }
}
```

**Response (201):** Returns the created profile object (same shape as GET /me).

**Response (409):** Profile already exists for this user.

---

### 3. PATCH /api/carrier-profiles/me  *(Most Critical Endpoint)*

**Purpose:** Partial update of the carrier profile. Called every time the user navigates between wizard steps (auto-save).

**Request (any combination of fields):**
```json
{
  "company_info": {
    "legal_name": "Updated Name",
    "phone": "(416) 555-9999"
  },
  "regulatory": {
    "nsc_number": "NSC123456"
  },
  "fleet": {
    "number_of_trucks": 10,
    "equipment_types": ["dry_van", "reefer"]
  },
  "payment": {
    "payment_method": "eft",
    "bank_name": "TD Bank",
    "transit_number": "12345",
    "account_number": "9876543210"
  },
  "current_step": 3
}
```

**Implementation Notes:**
- Use MongoDB dot notation for nested updates (e.g., `company_info.legal_name`)
- **Encrypt** payment fields: `transit_number`, `institution_number`, `aba_routing_number`, `account_number` before storing (store as `*_encrypted`)
- If the profile doesn't exist yet, auto-create it

**Response (200):** Returns the full updated profile (same shape as GET /me).

---

### 4. POST /api/carrier-profiles/me/complete

**Purpose:** Mark the profile as complete (called when user finishes step 5).

**Response (200):**
```json
{
  "id": "profile_abc123",
  "is_complete": true,
  "completed_at": "2024-01-15T12:00:00Z"
}
```

---

### 5. POST /api/carrier-profiles/me/logo

**Purpose:** Upload company logo image.

**Request:** `multipart/form-data`
- `file`: Image file

**Validations:**
- Allowed types: `image/png`, `image/jpeg`, `image/svg+xml`
- Max file size: 5MB

**Response (200):**
```json
{
  "logo_url": "https://storage.example.com/logos/company_789.png"
}
```

**Side effect:** Also updates `company_info.logo_url` in the carrier profile.

---

### 6. POST /api/carrier-profiles/me/documents

**Purpose:** Upload a compliance document.

**Request:** `multipart/form-data`
- `file`: Document file
- `document_type`: String (see Document Types Reference below)
- `expiry_date`: ISO date string (optional, e.g., `"2025-12-31"`)

**Validations:**
- Allowed types: `application/pdf`, `image/png`, `image/jpeg`
- Max file size: 10MB

**Status Calculation Logic:**
```python
if expiry_date and expiry_date < now:
    status = "expired"
elif expiry_date and (expiry_date - now).days <= 30:
    status = "expiring_soon"
else:
    status = "uploaded"
```

**Response (201):**
```json
{
  "id": "doc_123",
  "document_type": "nsc_certificate",
  "name": "NSC Certificate",
  "file_url": "https://storage.example.com/docs/doc_123.pdf",
  "file_name": "nsc_certificate.pdf",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "expiry_date": "2025-01-15T00:00:00Z",
  "status": "uploaded"
}
```

**Side effect:** Pushes the document into the `documents` array in the carrier profile.

---

### 7. DELETE /api/carrier-profiles/me/documents/{document_id}

**Purpose:** Remove a document from the profile.

**Response (204):** No content.

**Side effect:** Pulls the document from the `documents` array using `$pull`.

---

### 8. POST /api/carrier-profiles/me/packages

**Purpose:** Generate and send a document package to a recipient.

**Request:**
```json
{
  "recipient_name": "John Smith",
  "recipient_company": "ABC Logistics",
  "recipient_email": "john@abclogistics.com",
  "message": "Please find our carrier documents attached.",
  "document_ids": ["doc_123", "doc_456"]
}
```

**Backend Should:**
1. Fetch the carrier profile and selected documents
2. Generate a PDF cover page (carrier logo, company name, date, recipient info, document list)
3. Store the PDF in cloud storage
4. Send email to the recipient with the PDF download link
5. Create a tracking record in `carrier_packages` collection

**Response (201):**
```json
{
  "id": "package_123",
  "recipient_name": "John Smith",
  "recipient_company": "ABC Logistics",
  "recipient_email": "john@abclogistics.com",
  "documents_included": ["NSC Certificate", "Cargo Insurance Certificate (CA)"],
  "pdf_url": "https://storage.example.com/packages/package_123.pdf",
  "date_sent": "2024-01-15T14:00:00Z",
  "status": "sent"
}
```

---

### 9. GET /api/carrier-profiles/me/packages

**Purpose:** List all sent packages for tracking.

**Response (200):**
```json
[
  {
    "id": "package_123",
    "recipient_name": "John Smith",
    "recipient_company": "ABC Logistics",
    "recipient_email": "john@abclogistics.com",
    "documents_included": ["NSC Certificate", "Cargo Insurance"],
    "date_sent": "2024-01-15T14:00:00Z",
    "status": "opened",
    "last_opened": "2024-01-16T09:30:00Z",
    "reminder_sent_at": null
  }
]
```

---

### 10. POST /api/carrier-profiles/me/packages/{package_id}/reminder

**Purpose:** Send a follow-up reminder email for an unopened package.

**Response (200):**
```json
{
  "message": "Reminder sent successfully",
  "reminder_sent_at": "2024-01-18T10:00:00Z"
}
```

---

## File Storage

Use S3, Cloudinary, or similar. Example with S3:

```python
import boto3
import uuid
import os

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
    
    # Return the URL (use signed URLs for documents, public for logos)
    return f"https://{os.environ['S3_BUCKET']}.s3.amazonaws.com/{key}"
```

**Best practices:**
- Use signed URLs with 1-hour expiration for document access
- Logos can be public
- Scan uploaded files for malware before storing

---

## Encryption

All sensitive banking fields must be encrypted at rest using Fernet (AES symmetric encryption).

```python
from cryptography.fernet import Fernet
import os

# Generate key once: Fernet.generate_key()
# Store in env var ENCRYPTION_KEY
ENCRYPTION_KEY = os.environ['ENCRYPTION_KEY']
cipher = Fernet(ENCRYPTION_KEY)

def encrypt(value: str) -> str:
    return cipher.encrypt(value.encode()).decode()

def decrypt(encrypted_value: str) -> str:
    return cipher.decrypt(encrypted_value.encode()).decode()
```

**Fields to encrypt before storing:**
- `transit_number` -> stored as `transit_number_encrypted`
- `institution_number` -> stored as `institution_number_encrypted`
- `aba_routing_number` -> stored as `aba_routing_number_encrypted`
- `account_number` -> stored as `account_number_encrypted`

**In GET responses:**
- Return `account_number_masked` as `"****" + decrypt(account_number_encrypted)[-4:]`
- Return boolean flags: `has_transit_number`, `has_institution_number`, `has_aba_routing_number`
- **Never return** the `*_encrypted` fields in API responses

---

## Document Types Reference

### Canadian Documents

| Type ID | Display Name | Required |
|---------|-------------|----------|
| `nsc_certificate` | NSC Certificate | Yes |
| `cvor_abstract` | CVOR Abstract | Yes |
| `cargo_insurance_ca` | Cargo Insurance Certificate (CA) | Yes |
| `auto_liability_ca` | Auto Liability Certificate (CA) | Yes |
| `wsib_clearance` | WSIB Clearance Certificate | Yes |
| `gst_hst_registration` | GST/HST Registration | Yes |
| `void_cheque` | Void Cheque or Bank Letter | Yes |

### US Documents

| Type ID | Display Name | Required |
|---------|-------------|----------|
| `usdot_mc_authority` | USDOT / MC Authority Letter | Yes |
| `boc3_filing` | BOC-3 Filing Confirmation | Yes |
| `ucr_receipt` | UCR Receipt | Yes |
| `ifta_licence` | IFTA Licence | Yes |
| `cargo_insurance_us` | Cargo Insurance Certificate (US) | Yes |
| `auto_liability_us` | Auto Liability Certificate (US) | Yes |
| `w9_w8ben` | W-9 or W-8BEN | Yes |

**Note:** Documents shown to the user depend on their `company_info.country` selection:
- `"Canada"` -> show Canadian docs only
- `"USA"` -> show US docs only
- `"Both"` -> show all docs

---

## Security Requirements

1. **Authentication:** All endpoints require a valid JWT Bearer token. Use the existing TMS auth system.

2. **Banking Encryption:** All banking fields encrypted at rest with AES (see Encryption section).

3. **File Validation:**
   - Documents: PDF, PNG, JPG - Max 10MB
   - Logo: PNG, JPG, SVG - Max 5MB
   - Scan uploaded files for malware

4. **Signed URLs:** Use signed URLs with 1-hour expiration for document downloads. Never expose raw storage URLs.

5. **Rate Limiting:** 10 file uploads per minute per user.

6. **Audit Logging:** Log all profile updates and document access for compliance.

---

## Environment Variables

Add these to your backend `.env` file:

```bash
# Database (existing)
MONGO_URL=mongodb://...
DB_NAME=tms_db

# File Storage (S3 example)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=tms-carrier-documents

# Encryption (generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
ENCRYPTION_KEY=your-fernet-key-here

# Email Service (SendGrid example)
SENDGRID_API_KEY=...
EMAIL_FROM=noreply@yourtms.com

# JWT (existing)
JWT_SECRET=...
```

---

## Testing

### Quick Test with cURL

```bash
# Set your variables
export TOKEN="your_jwt_token_here"
export API="https://your-api-domain.com"

# 1. Get profile (expect 404 first time)
curl -X GET "$API/api/carrier-profiles/me" \
  -H "Authorization: Bearer $TOKEN"

# 2. Create profile
curl -X POST "$API/api/carrier-profiles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"company_info": {"legal_name": "Test Trucking Inc.", "country": "Canada"}}'

# 3. Update profile (partial update)
curl -X PATCH "$API/api/carrier-profiles/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_info": {"phone": "(416) 555-1234", "email": "test@test.com"},
    "regulatory": {"nsc_number": "NSC123456"},
    "current_step": 3
  }'

# 4. Upload a document
curl -X POST "$API/api/carrier-profiles/me/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_document.pdf" \
  -F "document_type=nsc_certificate" \
  -F "expiry_date=2025-12-31"

# 5. Upload logo
curl -X POST "$API/api/carrier-profiles/me/logo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@logo.png"

# 6. Complete profile
curl -X POST "$API/api/carrier-profiles/me/complete" \
  -H "Authorization: Bearer $TOKEN"

# 7. Send a package
curl -X POST "$API/api/carrier-profiles/me/packages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_name": "Test User",
    "recipient_company": "Test Co",
    "recipient_email": "test@example.com",
    "document_ids": ["doc_id_here"]
  }'

# 8. Get sent packages
curl -X GET "$API/api/carrier-profiles/me/packages" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Frontend Integration Checklist

Once the backend is deployed and all endpoints return correct responses:

1. Open `/app/src/components/carrier-profile/carrierProfileAPI.js`
2. Change `const USE_BACKEND_API = false;` to `const USE_BACKEND_API = true;`
3. Update the `REACT_APP_BACKEND_URL` in `/app/.env` if the API domain changed
4. Test the full wizard flow end-to-end
5. Verify: profile load, save on each step, logo upload, document upload/delete, profile completion, package sending

**The frontend is already coded to call these exact endpoints.** No frontend code changes are needed beyond flipping the flag.

---

## Error Codes

| Code | When |
|------|------|
| 400 | Invalid request body or file type |
| 401 | Missing or invalid JWT token |
| 403 | Access denied (wrong user) |
| 404 | Profile or document not found |
| 409 | Profile already exists (on POST create) |
| 413 | File too large |
| 415 | Unsupported media type |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## Implementation Priority

| Priority | Endpoint | Why |
|----------|----------|-----|
| 1 | `PATCH /me` | Called on every step navigation (auto-save) |
| 2 | `GET /me` | Called on wizard load |
| 3 | `POST /me/documents` | Document upload flow |
| 4 | `POST /me/logo` | Logo upload |
| 5 | `POST /me/complete` | Profile completion |
| 6 | `POST /me/packages` | Package sending (can be phase 2) |
| 7 | `GET /me/packages` | Package tracking (can be phase 2) |

---

## Questions?

- **Frontend code:** `/app/src/components/carrier-profile/`
- **API service layer:** `/app/src/components/carrier-profile/carrierProfileAPI.js` (shows exactly what the frontend sends/expects)
- **Key file:** `CarrierProfileWizard.js` - shows what data is saved at each wizard step
