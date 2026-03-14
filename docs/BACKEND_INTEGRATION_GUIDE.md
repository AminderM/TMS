# Carrier Profile Builder - Backend Integration Guide

## Overview

The Carrier Profile Builder is a 5-step wizard that allows carriers to create and manage their company profile within the TMS. This document provides instructions for backend developers to implement the required API endpoints and sync with the deployed frontend.

**Frontend Location:** `https://1be480b8-f0dc-439f-83a6-3225cd134318.preview.emergentagent.com`
**Access Path:** Dashboard → Company dropdown → "Carrier Profile Builder"

---

## Current Frontend Implementation

### Data Storage (Temporary)
The frontend currently uses **localStorage** for demo purposes:
- `carrier_profile_data` - Stores all profile information
- `carrier_sent_packages` - Tracks sent document packages

### Files to Update for Backend Integration
```
/app/src/components/carrier-profile/
├── CarrierProfileWizard.js      # Main wizard - replace localStorage with API calls
├── steps/
│   ├── CompanyInfoStep.js       # Step 1 - Company info form
│   ├── DocumentUploadStep.js    # Step 2 - File uploads needed
│   ├── RegulatoryDetailsStep.js # Step 3 - Regulatory form
│   ├── FleetLanesStep.js        # Step 4 - Fleet configuration
│   └── PaymentSetupStep.js      # Step 5 - Payment info (encryption needed)
├── ProfileCompleteScreen.js     # Completion view
├── SendPackageModal.js          # Package sending - needs email service
└── pdfGenerator.js              # Move to server-side for attachments
```

---

## Required API Endpoints

### Base URL Configuration
The frontend expects the backend at: `process.env.REACT_APP_BACKEND_URL`
Currently set to: `https://api.staging.integratedtech.ca`

All endpoints should be prefixed with `/api/`

---

### 1. Carrier Profile CRUD

#### GET /api/carrier-profiles/me
Fetch the current user's carrier profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": "profile_123",
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
      {"origin": "Toronto", "destination": "Montreal", "service_type": "ftl"},
      {"origin": "Toronto", "destination": "Chicago", "service_type": "ftl"}
    ],
    "is_24x7_dispatch": true
  },
  "payment": {
    "payment_method": "eft",
    "factoring_company_name": null,
    "noa_document_url": null,
    "bank_name": "TD Bank",
    "transit_number": "12345",
    "institution_number": "004",
    "aba_routing_number": null,
    "account_number_masked": "****5678",
    "account_type": "chequing",
    "currency": "CAD",
    "payment_terms": "net_30"
  },
  "is_complete": true,
  "completed_at": "2024-01-15T12:00:00Z",
  "current_step": 5,
  "created_at": "2024-01-10T09:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

**Response (404):** Profile not found - frontend will show empty wizard

---

#### POST /api/carrier-profiles
Create a new carrier profile.

**Request Body:**
```json
{
  "company_info": {
    "legal_name": "Northern Express Trucking Inc."
  }
}
```

**Response (201):** Returns the created profile object

---

#### PATCH /api/carrier-profiles/me
Update carrier profile (partial update).

**Request Body (any fields):**
```json
{
  "company_info": {
    "legal_name": "Updated Company Name",
    "phone": "(416) 555-9999"
  },
  "regulatory": {
    "nsc_number": "NSC123456"
  },
  "current_step": 3
}
```

**Response (200):** Returns updated profile

---

#### POST /api/carrier-profiles/me/complete
Mark profile as complete.

**Response (200):**
```json
{
  "id": "profile_123",
  "is_complete": true,
  "completed_at": "2024-01-15T12:00:00Z"
}
```

---

### 2. File Uploads

#### POST /api/carrier-profiles/me/logo
Upload company logo.

**Request:** `multipart/form-data`
- `file`: Image file (PNG, JPG, SVG - max 5MB)

**Response (200):**
```json
{
  "logo_url": "https://storage.example.com/logos/company_789.png"
}
```

---

#### POST /api/carrier-profiles/me/documents
Upload a document.

**Request:** `multipart/form-data`
- `file`: Document file (PDF, PNG, JPG - max 10MB)
- `document_type`: String (e.g., "nsc_certificate", "cargo_insurance_ca")
- `expiry_date`: ISO date string (optional)

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

---

#### DELETE /api/carrier-profiles/me/documents/{document_id}
Delete a document.

**Response (204):** No content

---

#### PATCH /api/carrier-profiles/me/documents/{document_id}
Update document expiry date.

**Request Body:**
```json
{
  "expiry_date": "2025-06-15T00:00:00Z"
}
```

---

### 3. Document Packages

#### POST /api/carrier-profiles/me/packages
Generate and send a document package.

**Request Body:**
```json
{
  "recipient_name": "John Smith",
  "recipient_company": "ABC Logistics",
  "recipient_email": "john@abclogistics.com",
  "message": "Please find our carrier documents attached.",
  "document_ids": ["doc_1", "doc_2", "doc_3"]
}
```

**Backend Should:**
1. Generate PDF with cover page (carrier logo, company name, date, recipient, document list)
2. Attach selected documents to PDF
3. Store PDF in cloud storage
4. Send email to recipient with download link
5. Create tracking record

**Response (201):**
```json
{
  "id": "package_123",
  "recipient_name": "John Smith",
  "recipient_company": "ABC Logistics",
  "recipient_email": "john@abclogistics.com",
  "documents_included": ["NSC Certificate", "Cargo Insurance"],
  "pdf_url": "https://storage.example.com/packages/package_123.pdf",
  "date_sent": "2024-01-15T14:00:00Z",
  "status": "sent"
}
```

---

#### GET /api/carrier-profiles/me/packages
Get all sent packages for tracking.

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

#### POST /api/carrier-profiles/me/packages/{package_id}/reminder
Send a reminder email for unopened package.

**Response (200):**
```json
{
  "message": "Reminder sent successfully",
  "reminder_sent_at": "2024-01-18T10:00:00Z"
}
```

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

---

## Security Requirements

### 1. Banking Information Encryption
All banking fields must be encrypted at rest:
- `account_number` - AES-256 encryption
- `transit_number` - AES-256 encryption
- `institution_number` - AES-256 encryption
- `aba_routing_number` - AES-256 encryption

Return masked values in GET responses (e.g., `****5678`)

### 2. File Storage
- Use signed URLs with expiration (1 hour recommended)
- Scan uploaded files for malware
- Store in private S3/GCS bucket

### 3. Authentication
All endpoints require valid JWT Bearer token in Authorization header.

---

## Testing the Deployed Feature

### Step 1: Access the Feature
1. Go to: `https://1be480b8-f0dc-439f-83a6-3225cd134318.preview.emergentagent.com`
2. Login with valid credentials
3. Navigate to Dashboard → Company dropdown → "Carrier Profile Builder"

### Step 2: Test Each Step
| Step | Test Actions | Expected Result |
|------|-------------|-----------------|
| 1 | Fill company info, upload logo | Logo preview shows, form saves |
| 2 | Upload documents, set expiry dates | Documents show with status badges |
| 3 | Enter regulatory numbers | Form saves, cross-border toggles work |
| 4 | Select equipment, add lanes | Equipment grid highlights, lanes list |
| 5 | Enter payment info | Masked account number shows |

### Step 3: Test Navigation
- Click "Save & Exit" → Progress should persist on return
- Navigate between steps using sidebar → Data should persist
- Theme toggle (sun/moon button) → UI should switch light/dark

### Step 4: Test Package Sending
1. Complete all 5 steps
2. Click "Send My Package"
3. Select documents
4. Enter recipient info
5. Click "Generate & Send"
6. Verify PDF downloads and email client opens

### Step 5: API Testing with cURL

```bash
# Get profile
curl -X GET "https://api.staging.integratedtech.ca/api/carrier-profiles/me" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update profile
curl -X PATCH "https://api.staging.integratedtech.ca/api/carrier-profiles/me" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"company_info": {"legal_name": "Test Company"}}'

# Upload document
curl -X POST "https://api.staging.integratedtech.ca/api/carrier-profiles/me/documents" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "document_type=nsc_certificate" \
  -F "expiry_date=2025-12-31"

# Send package
curl -X POST "https://api.staging.integratedtech.ca/api/carrier-profiles/me/packages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_name": "Test User",
    "recipient_company": "Test Co",
    "recipient_email": "test@example.com",
    "document_ids": ["doc_1", "doc_2"]
  }'
```

---

## Frontend Integration Checklist

Once backend endpoints are ready, the frontend developer needs to:

- [ ] Replace localStorage with API calls in `CarrierProfileWizard.js`
- [ ] Add file upload progress indicators
- [ ] Handle API errors gracefully
- [ ] Implement retry logic for failed uploads
- [ ] Move PDF generation to server-side
- [ ] Update `SendPackageModal.js` to call package endpoint
- [ ] Add loading states during API calls

---

## Environment Variables

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://api.staging.integratedtech.ca
```

### Backend (required)
```
# Database
MONGO_URL=mongodb://...
DB_NAME=tms_db

# File Storage
AWS_S3_BUCKET=tms-carrier-documents
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Email Service
SENDGRID_API_KEY=...
EMAIL_FROM=noreply@yourtms.com

# Encryption
ENCRYPTION_KEY=... (32-byte key for AES-256)

# JWT
JWT_SECRET=...
```

---

## Contact

For questions about this integration:
- **Frontend Code Location:** `/app/src/components/carrier-profile/`
- **API Documentation:** `/app/docs/CARRIER_PROFILE_BACKEND_API.md`
- **PRD:** `/app/memory/PRD.md`

---

*Last Updated: March 2024*
