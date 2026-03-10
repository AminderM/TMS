# Admin Portal - Product Requirements Document

## Overview
Admin Portal for the Integrated Tech TMS platform - manages users, subscriptions, products, CRM, and integrations.

## Architecture
- **Frontend**: React.js with Tailwind CSS, located at `/app/frontend`
- **Backend**: External API at `https://api.staging.integratedtech.ca`

## Repository
- **GitHub**: https://github.com/AminderM/Admin-Portal
- **Commit**: 6aab550 (ADMIN CODE)

## Current Setup (March 9-10, 2026)
- Frontend connected to staging backend: `https://api.staging.integratedtech.ca`
- Preview URL: `https://59e63a5e-ded1-4048-ae67-e39099890f2a.preview.emergentagent.com`

## Test Credentials
- **Email**: aminderpro@gmail.com
- **Password**: Admin@123!

## Backend Bug Identified & Frontend Workaround Applied

### Issue: `/api/bookings/my` Returns 500 Error
- **Root Cause**: Platform Admin user has `fleet_owner_id: null`, causing backend to crash
- **Status**: Backend team needs to fix null handling
- **Frontend Workaround**: Applied - now uses `/api/bookings/requests` for platform_admin users

### Files Modified:
- `/app/frontend/src/components/BookingManagement.js` - Added platform_admin check

## API Verification Results

### Working Endpoints (Frontend Paths):
| Endpoint | Status |
|----------|--------|
| `/api/admin/users` | ✅ 200 |
| `/api/admin/plans` | ✅ 200 |
| `/api/bundles/products` | ✅ 200 |
| `/api/drivers/all` | ✅ 200 |
| `/api/equipment/my` | ✅ 200 |
| `/api/accounting/receivables` | ✅ 200 |
| `/api/accounting/payables` | ✅ 200 |
| `/api/bookings/requests` | ✅ 200 |

### Bug (Backend Fix Needed):
| Endpoint | Status |
|----------|--------|
| `/api/bookings/my` | ⚠️ 500 |

### Not Yet Implemented (Future Features):
| Endpoint | Status |
|----------|--------|
| `/api/operations/orders` | ❌ 404 |
| `/api/fleet/vehicles` | ❌ 404 |
| `/api/billing/invoices` | ❌ 404 |
| `/api/auth/workspaces` | ❌ 404 |
| `/api/master-data/tax/*` | ❌ 404 |
| `/api/pricing/*` | ❌ 404 |

## Features Status

### ✅ Working
- Authentication & Login
- Admin Dashboard (Tenants, Subscriptions, Revenue, Plans)
- User Management
- Products (11 products)
- Subscription Manager
- CRM (Company, Contacts, Deals, Activities)
- Carrier Lookup (FMCSA)
- Integrations Management
- TMS Dashboard
- Order Management (with workaround)
- Equipment Management
- Driver Management
- Accounting (AR/AP)

## Pending Backend Fixes
1. Fix `/api/bookings/my` - null fleet_owner_id handling

## Future Features (After Backend Implements)
1. Workspace-based navigation
2. Tax calculator
3. Rate cards & accessorials
4. New API structure migration
