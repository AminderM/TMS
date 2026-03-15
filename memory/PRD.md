# TMS Frontend - Product Requirements Document

## Problem Statement
Review the TMS (Transportation Management System) Frontend codebase and get it running in preview.

## Architecture
- **Type:** React frontend-only application
- **Tech Stack:** React 19, Tailwind CSS, React Router v7, ShadcnUI/Radix UI components
- **Build Tool:** Create React App with CRACO customization
- **Map Integration:** Leaflet + React-Leaflet for location tracking
- **Charts:** Recharts for analytics
- **PDF Generation:** jsPDF for document generation

## What's Been Implemented

### Jan 2026 - Code Review & Preview Setup
- [x] Analyzed existing TMS codebase structure
- [x] Set up symlinks for supervisor compatibility (/app/frontend -> /app)
- [x] Created minimal backend stub for supervisor
- [x] Configured environment variables
- [x] Started frontend successfully on port 3000
- [x] Verified all pages load correctly (Landing, Auth, Driver Portal)

### Existing Features (Pre-built)
- Landing page with 6 management systems showcase
- Authentication pages (login/register)
- Driver Portal with separate auth flow
- Mobile Driver App (self-contained at /driver-app)
- Admin Console with platform management
- Carrier Profile Builder (5-step wizard with localStorage)
- Full ShadcnUI component library
- Light/dark theme support
- Map integrations (Leaflet)

## Core Requirements (Static)
- React-based SPA for fleet management
- Multi-tenant architecture support
- Driver-facing mobile-optimized views
- Admin console for platform management
- Carrier onboarding workflow

## User Personas
1. **Platform Admin**: Manages users, subscriptions, CRM
2. **Fleet Owner/Manufacturer**: Manages fleet, bookings, equipment
3. **Driver**: Accepts loads, navigation, document upload
4. **Carrier**: Profile setup, document management

## Prioritized Backlog

### P0 - Blocked
- [ ] Backend API implementation (auth, data persistence)
- [ ] Database integration (MongoDB)

### P1 - After Backend
- [ ] End-to-end auth flow testing
- [ ] Real-time WebSocket integration
- [ ] File upload to cloud storage

### P2 - Future
- [ ] Package tracking UI
- [ ] Document expiry notifications
- [ ] Route optimization features

## Key Files
- `/app/src/App.js` - Main routing
- `/app/src/components/` - All UI components
- `/app/src/contexts/` - Auth, Theme, Features contexts
- `/app/src/components/carrier-profile/` - Carrier onboarding
- `/app/src/components/driver-app/` - Mobile driver app

## Preview URL
https://f585a360-175e-4e6b-984a-cac95d5e33fd.preview.emergentagent.com

## Test Credentials
- Email: `aminderpro@gmail.com`
- Password: `Admin@123!`
