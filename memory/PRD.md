# Admin Portal - Product Requirements Document

## Overview
Admin Portal for the Integrated Tech TMS platform - manages users, subscriptions, products, CRM, and integrations.

## Architecture
- **Frontend**: React.js with Tailwind CSS, located at `/app/frontend`
- **Backend**: External API at `https://api.staging.integratedtech.ca`

## Repository
- **GitHub**: https://github.com/AminderM/Admin-Portal
- **Commit**: 6aab550 (ADMIN CODE)

## Current Setup (March 9, 2026)
- Frontend connected to staging backend: `https://api.staging.integratedtech.ca`
- Preview URL: `https://59e63a5e-ded1-4048-ae67-e39099890f2a.preview.emergentagent.com`

## Test Credentials
- **Email**: aminderpro@gmail.com
- **Password**: Admin@123!

## Features Status

### ✅ Working
- **Authentication** - Login/logout with JWT
- **Dashboard Overview** - Stats display (Tenants, Subscriptions, Revenue, Plans)
- **User Management** - List users, create user, edit user, status toggle
- **Products** - 11 products displaying (TMS Basic/Pro/Enterprise, Heavy TMS, etc.)
- **Subscription Manager** - Product Bundles, Subscriptions, Available Products tabs
- **CRM** - Dashboard, Company, Contacts, Deals, Activity Log
- **Carrier Lookup** - FMCSA search by DOT# or company name
- **Integrations** - List integrations, add/remove, toggle active status
- **Sales Analytics** - Analytics dashboard

### API Endpoints Used
- `/api/auth/login` - Authentication
- `/api/admin/plans` - Get subscription plans
- `/api/admin/users` - User management
- `/api/admin/integrations` - Integrations management
- `/api/admin/crm/*` - CRM endpoints
- `/api/bundles/*` - Bundle management
- `/api/fmcsa/carrier/*` - FMCSA carrier lookup

## Backend API (api.staging.integratedtech.ca)
- 11 subscription plans available
- 2 active users
- OpenAI GPT-4o integration configured
- FMCSA QCMobile API integration configured

## Next Tasks
1. Monitor for any specific issues user identifies
2. Test all CRUD operations thoroughly
3. Verify data syncs correctly between frontend and backend
