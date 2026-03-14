# Carrier Profile Builder - Backend API Documentation

This document provides the API specifications for the backend developer to implement the server-side integration for the Carrier Profile Builder feature.

## Overview

The Carrier Profile Builder is a multi-step wizard that allows carriers to:
1. Enter company information and upload a logo
2. Upload compliance documents
3. Enter regulatory details (NSC, CVOR, USDOT, MC numbers, etc.)
4. Configure fleet and preferred lanes
5. Set up payment information
6. Generate and send document packages to shippers/brokers

## Data Models

### CarrierProfile Schema

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class CompanyType(str, Enum):
    TRUCKING_COMPANY = "trucking_company"
    OWNER_OPERATOR = "owner_operator"
    BOTH = "both"

class Country(str, Enum):
    CANADA = "Canada"
    USA = "USA"
    BOTH = "Both"

class PaymentMethod(str, Enum):
    EFT = "eft"
    CHEQUE = "cheque"
    WIRE = "wire"
    FACTORING = "factoring"

class PaymentTerms(str, Enum):
    QUICK_PAY = "quick_pay"
    NET_15 = "net_15"
    NET_30 = "net_30"
    NET_45 = "net_45"

class AccountType(str, Enum):
    CHEQUING = "chequing"
    SAVINGS = "savings"

class Currency(str, Enum):
    CAD = "CAD"
    USD = "USD"
    BOTH = "Both"

class ServiceType(str, Enum):
    FTL = "ftl"
    LTL = "ltl"
    BOTH = "both"

class EquipmentType(str, Enum):
    DRY_VAN = "dry_van"
    FLATBED = "flatbed"
    REEFER = "reefer"
    TANKER = "tanker"
    STEP_DECK = "step_deck"
    HOTSHOT = "hotshot"
    SPRINTER = "sprinter"
    OTHER = "other"

class DocumentStatus(str, Enum):
    NOT_UPLOADED = "not_uploaded"
    UPLOADED = "uploaded"
    EXPIRED = "expired"
    EXPIRING_SOON = "expiring_soon"

# Sub-models
class CompanyInfo(BaseModel):
    legal_name: str
    dba_name: Optional[str] = None
    company_type: CompanyType
    country: Country
    province: str
    phone: str
    email: str
    website: Optional[str] = None
    logo_url: Optional[str] = None

class Document(BaseModel):
    id: str
    name: str
    file_url: str
    file_name: str
    uploaded_at: datetime
    expiry_date: Optional[datetime] = None
    status: DocumentStatus

class RegulatoryDetails(BaseModel):
    # Canadian
    nsc_number: Optional[str] = None
    nsc_safety_rating: Optional[str] = None
    cvor_number: Optional[str] = None
    cvor_safety_rating: Optional[str] = None
    cra_business_number: Optional[str] = None
    gst_hst_number: Optional[str] = None
    # US
    usdot_number: Optional[str] = None
    mc_number: Optional[str] = None
    ein: Optional[str] = None
    ifta_account_number: Optional[str] = None
    ifta_base_jurisdiction: Optional[str] = None
    # Cross-Border
    cross_border_capable: bool = False
    fast_card_enrolled: bool = False

class PreferredLane(BaseModel):
    origin: str
    destination: str
    service_type: ServiceType

class FleetInfo(BaseModel):
    number_of_trucks: int
    number_of_trailers: int
    equipment_types: List[EquipmentType]
    hazmat_capable: bool = False
    cross_border_capable: bool = False
    eld_provider: Optional[str] = None
    preferred_lanes: List[PreferredLane] = []
    is_24x7_dispatch: bool = False

class PaymentInfo(BaseModel):
    payment_method: PaymentMethod
    factoring_company_name: Optional[str] = None
    noa_document_url: Optional[str] = None
    bank_name: str
    transit_number: Optional[str] = None  # Canada
    aba_routing_number: Optional[str] = None  # US
    institution_number: Optional[str] = None  # Canada
    account_number_encrypted: str  # Store encrypted
    account_type: AccountType
    currency: Currency
    payment_terms: PaymentTerms

# Main Carrier Profile Model
class CarrierProfile(BaseModel):
    id: str
    user_id: str
    company_id: str
    company_info: CompanyInfo
    documents: List[Document] = []
    regulatory: RegulatoryDetails
    fleet: FleetInfo
    payment: PaymentInfo
    is_complete: bool = False
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

# Sent Package Tracking
class PackageStatus(str, Enum):
    SENT = "sent"
    OPENED = "opened"
    DOWNLOADED = "downloaded"

class SentPackage(BaseModel):
    id: str
    carrier_profile_id: str
    recipient_name: str
    recipient_company: str
    recipient_email: str
    message: Optional[str] = None
    documents_included: List[str]  # List of document IDs
    pdf_url: str
    date_sent: datetime
    status: PackageStatus = PackageStatus.SENT
    last_opened: Optional[datetime] = None
    reminder_sent_at: Optional[datetime] = None
```

## API Endpoints

### 1. Carrier Profile CRUD

#### Create/Initialize Profile
```
POST /api/carrier-profiles
Authorization: Bearer <token>

Request Body:
{
  "company_info": {
    "legal_name": "Northern Express Trucking Inc.",
    "dba_name": "Northern Express",
    "company_type": "trucking_company",
    "country": "Canada",
    "province": "Ontario",
    "phone": "(416) 555-1234",
    "email": "dispatch@northernexpress.ca",
    "website": "https://northernexpress.ca"
  }
}

Response: 201 Created
{
  "id": "profile_123",
  "user_id": "user_456",
  "company_id": "company_789",
  "company_info": { ... },
  "documents": [],
  "regulatory": {},
  "fleet": {},
  "payment": {},
  "is_complete": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Get Current User's Profile
```
GET /api/carrier-profiles/me
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "profile_123",
  "company_info": { ... },
  "documents": [ ... ],
  "regulatory": { ... },
  "fleet": { ... },
  "payment": { ... },
  "is_complete": true,
  "completed_at": "2024-01-15T12:00:00Z",
  ...
}
```

#### Update Profile (Partial Update)
```
PATCH /api/carrier-profiles/me
Authorization: Bearer <token>

Request Body (any combination of fields):
{
  "company_info": { "legal_name": "Updated Name" },
  "regulatory": { "nsc_number": "NSC123456" },
  "fleet": { "number_of_trucks": 10 }
}

Response: 200 OK
{ ... updated profile ... }
```

#### Complete Profile
```
POST /api/carrier-profiles/me/complete
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "profile_123",
  "is_complete": true,
  "completed_at": "2024-01-15T12:00:00Z",
  ...
}
```

### 2. Document Management

#### Upload Document
```
POST /api/carrier-profiles/me/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Fields:
- file: <binary file data>
- document_type: "nsc_certificate" | "cvor_abstract" | "cargo_insurance_ca" | etc.
- expiry_date: "2025-01-15" (optional)

Response: 201 Created
{
  "id": "doc_123",
  "name": "NSC Certificate",
  "file_url": "https://storage.example.com/docs/nsc_123.pdf",
  "file_name": "nsc_certificate.pdf",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "expiry_date": "2025-01-15T00:00:00Z",
  "status": "uploaded"
}
```

#### Get All Documents
```
GET /api/carrier-profiles/me/documents
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "doc_123",
    "name": "NSC Certificate",
    "file_url": "...",
    "status": "uploaded",
    ...
  },
  ...
]
```

#### Delete Document
```
DELETE /api/carrier-profiles/me/documents/{document_id}
Authorization: Bearer <token>

Response: 204 No Content
```

#### Update Document Expiry
```
PATCH /api/carrier-profiles/me/documents/{document_id}
Authorization: Bearer <token>

Request Body:
{
  "expiry_date": "2025-06-15"
}

Response: 200 OK
{ ... updated document ... }
```

### 3. Logo Upload

#### Upload Company Logo
```
POST /api/carrier-profiles/me/logo
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Fields:
- file: <binary image data>

Validations:
- Max file size: 5MB
- Allowed types: PNG, JPG, JPEG, SVG

Response: 200 OK
{
  "logo_url": "https://storage.example.com/logos/company_789.png"
}
```

#### Delete Logo
```
DELETE /api/carrier-profiles/me/logo
Authorization: Bearer <token>

Response: 204 No Content
```

### 4. Document Package Sending

#### Generate and Send Package
```
POST /api/carrier-profiles/me/packages
Authorization: Bearer <token>

Request Body:
{
  "recipient_name": "John Smith",
  "recipient_company": "ABC Logistics",
  "recipient_email": "john@abclogistics.com",
  "message": "Please find our carrier documents attached.",
  "document_ids": ["doc_123", "doc_456", "doc_789"]
}

Response: 201 Created
{
  "id": "package_123",
  "pdf_url": "https://storage.example.com/packages/package_123.pdf",
  "date_sent": "2024-01-15T14:00:00Z",
  "status": "sent",
  "recipient_name": "John Smith",
  "recipient_company": "ABC Logistics",
  "recipient_email": "john@abclogistics.com"
}
```

#### Get Sent Packages
```
GET /api/carrier-profiles/me/packages
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "package_123",
    "recipient_name": "John Smith",
    "recipient_company": "ABC Logistics",
    "recipient_email": "john@abclogistics.com",
    "documents_included": ["NSC Certificate", "Cargo Insurance"],
    "date_sent": "2024-01-15T14:00:00Z",
    "status": "opened",
    "last_opened": "2024-01-16T09:00:00Z"
  },
  ...
]
```

#### Send Reminder
```
POST /api/carrier-profiles/me/packages/{package_id}/reminder
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Reminder sent successfully",
  "reminder_sent_at": "2024-01-18T10:00:00Z"
}
```

#### Package Tracking Webhook (for email tracking)
```
POST /api/webhooks/package-tracking
X-Webhook-Secret: <secret>

Request Body:
{
  "package_id": "package_123",
  "event": "opened" | "downloaded",
  "timestamp": "2024-01-16T09:00:00Z"
}

Response: 200 OK
```

### 5. Document Types Reference

#### Canadian Documents
| ID | Name | Required |
|----|------|----------|
| nsc_certificate | NSC Certificate | Yes |
| cvor_abstract | CVOR Abstract | Yes |
| cargo_insurance_ca | Cargo Insurance Certificate (CA) | Yes |
| auto_liability_ca | Auto Liability Certificate (CA) | Yes |
| wsib_clearance | WSIB Clearance Certificate | Yes |
| gst_hst_registration | GST/HST Registration | Yes |
| void_cheque | Void Cheque or Bank Letter | Yes |

#### US Documents
| ID | Name | Required |
|----|------|----------|
| usdot_mc_authority | USDOT / MC Authority Letter | Yes |
| boc3_filing | BOC-3 Filing Confirmation | Yes |
| ucr_receipt | UCR Receipt | Yes |
| ifta_licence | IFTA Licence | Yes |
| cargo_insurance_us | Cargo Insurance Certificate (US) | Yes |
| auto_liability_us | Auto Liability Certificate (US) | Yes |
| w9_w8ben | W-9 or W-8BEN | Yes |

## Security Considerations

1. **Banking Information**: All banking fields (account_number, transit_number, etc.) must be encrypted at rest using AES-256 encryption.

2. **File Storage**: Use signed URLs with expiration for document access. Never expose direct storage URLs.

3. **Authentication**: All endpoints require valid JWT Bearer token.

4. **Rate Limiting**: Apply rate limits to file upload endpoints (10 uploads per minute per user).

5. **File Validation**: 
   - Documents: PDF, PNG, JPG - Max 10MB
   - Logo: PNG, JPG, SVG - Max 5MB
   - Scan all uploaded files for malware

6. **Audit Logging**: Log all profile updates and document access for compliance.

## Integration Notes

1. **Email Service**: Use SendGrid or similar for sending package emails with tracking pixels.

2. **PDF Generation**: Generate PDF packages server-side using a library like ReportLab (Python) or puppeteer.

3. **File Storage**: Use S3, GCS, or Azure Blob Storage for document storage.

4. **Document Expiry**: Run a daily cron job to update document statuses based on expiry dates.

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Invalid request body |
| 401 | Unauthorized - Invalid or expired token |
| 403 | Forbidden - Access denied |
| 404 | Profile or document not found |
| 409 | Conflict - Profile already exists |
| 413 | File too large |
| 415 | Unsupported media type |
| 429 | Too many requests |
| 500 | Internal server error |

## Frontend Integration

The frontend currently uses localStorage for demo purposes. When connecting to the backend:

1. Replace localStorage calls with API calls to the endpoints above
2. Update the `REACT_APP_BACKEND_URL` environment variable
3. Add proper error handling for API responses
4. Implement file upload progress indicators

### Files to Update
- `/app/src/components/carrier-profile/CarrierProfileWizard.js` - Main wizard logic
- `/app/src/components/carrier-profile/steps/*.js` - Individual step components
- `/app/src/components/carrier-profile/SendPackageModal.js` - Package sending
- `/app/src/components/carrier-profile/pdfGenerator.js` - Replace with server-side PDF

---

**Contact**: For questions about this API specification, contact the frontend developer.

**Version**: 1.0  
**Last Updated**: March 2024
