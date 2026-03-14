# Carrier Profile Builder - Product Requirements Document

## Original Problem Statement

Build a Carrier Profile Builder inside the TMS SaaS application. The feature should:
- Be a clean step-by-step wizard guiding carriers through building their profile
- Allow document uploads and logo uploads
- Enable carriers to send PDF document packages to Shippers/Brokers
- Support company-to-company communication within the TMS
- Keep it simple, clean, and fully functional

## User Personas

1. **Carrier/Fleet Owner**: Primary user who needs to create and manage their company profile, upload compliance documents, and share credentials with shippers/brokers.

2. **Shipper/Broker**: Secondary user who receives document packages from carriers to verify credentials and compliance.

## Core Requirements

### Wizard Structure
- 5-step wizard with left sidebar navigation
- Progress bar showing completion percentage
- Save & Exit functionality with auto-save
- Brand colors: Deep Navy (#0A1628) and Electric Cyan (#00D4FF)

### Step 1 - Company Info & Logo
- Legal company name, DBA name
- Company type (Trucking Company / Owner-Operator / Both)
- Country (Canada / USA / Both)
- Province/State dropdown (dynamic based on country)
- Phone, Email, Website
- Logo upload with drag-drop, preview, and initials avatar fallback

### Step 2 - Document Upload
- Document cards with name, description, upload button, status badge
- Status tracking: Not Uploaded / Uploaded / Expired / Expiring Soon
- Expiry date picker for each document
- Country-specific document requirements (Canadian vs US)

### Step 3 - Regulatory Details
- Canadian: NSC, CVOR, CRA Business Number, GST/HST
- US: USDOT, MC Number, EIN, IFTA
- Cross-border capabilities toggle

### Step 4 - Fleet & Lanes
- Fleet size (trucks, trailers)
- Equipment types grid with icons
- Capabilities (Hazmat, Cross-border, 24/7 Dispatch)
- ELD provider selection
- Preferred lanes (up to 5)

### Step 5 - Payment Setup
- Payment method selection (EFT, Cheque, Wire, Factoring)
- Banking information (encrypted at rest)
- Payment terms

### Profile Complete Screen
- Summary of uploaded documents
- Expired/missing document flags
- "View My Profile" and "Send My Package" buttons

### Document Sharing (Send My Package)
- 3-step modal: Select Docs → Add Recipient → Send
- PDF generation with cover page
- Opens email client with pre-filled content
- Package tracking (Sent / Opened / Downloaded)

## What's Been Implemented

### March 2024 - Initial Implementation

**Frontend Components Created:**
- `/app/src/components/carrier-profile/CarrierProfileWizard.js` - Main wizard component
- `/app/src/components/carrier-profile/steps/CompanyInfoStep.js` - Step 1 form
- `/app/src/components/carrier-profile/steps/DocumentUploadStep.js` - Step 2 document management
- `/app/src/components/carrier-profile/steps/RegulatoryDetailsStep.js` - Step 3 regulatory info
- `/app/src/components/carrier-profile/steps/FleetLanesStep.js` - Step 4 fleet configuration
- `/app/src/components/carrier-profile/steps/PaymentSetupStep.js` - Step 5 payment setup
- `/app/src/components/carrier-profile/ProfileCompleteScreen.js` - Completion view
- `/app/src/components/carrier-profile/SendPackageModal.js` - Document package sending
- `/app/src/components/carrier-profile/pdfGenerator.js` - Client-side PDF generation

**Features Completed:**
- ✅ 5-step wizard with full navigation
- ✅ Left sidebar with step status indicators
- ✅ Progress bar showing completion percentage
- ✅ Save & Exit with localStorage persistence
- ✅ Company info form with all fields
- ✅ Logo upload with drag-drop and preview
- ✅ Initials avatar auto-generation
- ✅ Document upload cards with status badges
- ✅ Country-specific document filtering
- ✅ Expiry date tracking with calendar picker
- ✅ Regulatory details form (Canadian & US)
- ✅ Equipment types grid with icons
- ✅ Preferred lanes management
- ✅ Payment setup form
- ✅ Profile completion screen
- ✅ Send Package modal (3-step)
- ✅ PDF generation using jsPDF
- ✅ Email client integration (mailto:)
- ✅ Package tracking table
- ✅ Brand colors implemented (#0A1628, #00D4FF)
- ✅ Mobile responsive design
- ✅ All data-testid attributes for testing

**Documentation:**
- `/app/docs/CARRIER_PROFILE_BACKEND_API.md` - Complete backend API specification

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Backend API integration (replace localStorage)
- [ ] Server-side PDF generation
- [ ] Email service integration (SendGrid)
- [ ] File storage integration (S3/Cloudinary)

### P1 - High Priority
- [ ] Document preview in modal
- [ ] OCR for auto-filling regulatory numbers from documents
- [ ] Email tracking (open/download events)
- [ ] Bulk document upload

### P2 - Medium Priority
- [ ] Document templates/samples
- [ ] Profile completion reminders
- [ ] Document expiry notifications
- [ ] Carrier profile public link sharing
- [ ] Print profile option

### P3 - Nice to Have
- [ ] Multi-language support (French for Canadian carriers)
- [ ] Dark/Light theme toggle within wizard
- [ ] Profile analytics dashboard
- [ ] Integration with carrier lookup services

## Technical Constraints

- Frontend: React.js with Tailwind CSS
- Backend: External at api.staging.integratedtech.ca
- Storage: Currently localStorage (demo), needs backend integration
- PDF: Client-side jsPDF (needs server-side migration for attachments)
- Email: mailto: links (needs email service integration)

## Next Tasks

1. Backend developer to implement API endpoints per documentation
2. Integrate frontend with backend APIs
3. Set up file storage (S3 or Cloudinary)
4. Implement email service for package sending
5. Add email tracking for package status updates
