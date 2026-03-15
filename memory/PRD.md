# Carrier Profile Builder - Product Requirements Document

## Problem Statement
Build a Carrier Profile Builder within an existing Transportation Management System (TMS) application. The feature guides carriers through creating their profile via a multi-step wizard.

## Core Requirements

### 5-Step Wizard
1. **Company Info & Logo** - Company details, logo upload (with auto-generated initials avatar fallback)
2. **Document Upload** - Country-specific documents (Canada/USA/Both), status tracking (Uploaded/Expired)
3. **Regulatory Details** - NSC, CVOR, USDOT, MC numbers, etc.
4. **Fleet & Lanes** - Trucks, trailers, equipment types, preferred shipping lanes
5. **Payment Setup** - Banking info with encryption for sensitive fields

### Additional Features
- **Profile Completion Screen** - Summary after final step
- **Document Sharing** - Modal flow to select documents, generate PDF, email to recipient
- **Package Tracking** - Table showing sent package statuses (NOT STARTED)
- **Auto-save** - Progress saved on step navigation
- **Responsive Design** - Works on various screen sizes
- **Theme Support** - Light/dark mode using existing TMS theme

## Architecture
- **Frontend:** React app at `/app` (no separate backend in this project)
- **Backend:** To be built by separate backend developer (see `/app/docs/BACKEND_DEV_INSTRUCTIONS.md`)
- **Data Storage:** Currently using `localStorage` as temporary fallback (flag `USE_BACKEND_API = false` in `carrierProfileAPI.js`)

## What's Been Implemented

### Frontend (COMPLETE)
- [x] 5-step wizard with all forms and components
- [x] Left sidebar navigation with step status indicators
- [x] Company info form with logo upload/initials avatar
- [x] Document upload with country-based filtering and expiry tracking
- [x] Regulatory details form with Canada/US/cross-border fields
- [x] Fleet & lanes form with equipment grid and lane management
- [x] Payment setup form with masked sensitive fields
- [x] Profile completion summary screen
- [x] Send Package modal (3-step: select docs -> recipient info -> review & send)
- [x] PDF generation with jsPDF (cover page + document list)
- [x] Light/dark theme support matching TMS app
- [x] localStorage fallback for all API functions
- [x] Integration with main TMS dashboard (Company dropdown -> Carrier Profile Builder)

### Backend Instructions (COMPLETE)
- [x] Consolidated backend developer guide at `/app/docs/BACKEND_DEV_INSTRUCTIONS.md`
- [x] Database schema (MongoDB)
- [x] All API endpoint specifications
- [x] Encryption requirements for banking fields
- [x] File storage guidelines
- [x] Testing commands (cURL)
- [x] Frontend integration checklist

## Pending / Not Started

### P0 - Blocked on Backend
- [ ] Backend API implementation (separate developer)
- [ ] End-to-end integration (flip `USE_BACKEND_API` flag when backend is ready)

### P1 - After Backend Ready
- [ ] Verify PDF generation and email flow end-to-end
- [ ] File upload progress indicators

### P2 - Future
- [ ] Package Tracking UI (table showing sent package statuses)
- [ ] Document expiry notification system

## Test Credentials
- Email: `aminderpro@gmail.com`
- Password: `Admin@123!`
- Access: Admin Console -> Products -> Launch TMS -> Company dropdown -> Carrier Profile Builder

## Key Files
- `/app/src/components/carrier-profile/carrierProfileAPI.js` - API service layer (localStorage fallback)
- `/app/src/components/carrier-profile/CarrierProfileWizard.js` - Main wizard component
- `/app/src/components/carrier-profile/steps/` - Individual step components
- `/app/src/components/carrier-profile/SendPackageModal.js` - Package sending flow
- `/app/src/components/carrier-profile/pdfGenerator.js` - Client-side PDF generation
- `/app/docs/BACKEND_DEV_INSTRUCTIONS.md` - Backend developer instructions
