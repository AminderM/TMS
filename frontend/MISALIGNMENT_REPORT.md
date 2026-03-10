# Frontend-Backend API Misalignment Report

## Analysis Date: March 9, 2026
## Repositories: Admin-Portal Frontend vs api.staging.integratedtech.ca Backend

---

## 1. AUTHENTICATION MISALIGNMENTS

### 1.1 Missing Workspace Support
**Backend Documentation**: After login, frontend should call `GET /api/auth/workspaces` to get `allowed_workspaces` array
**Frontend Current**: Does NOT fetch workspaces after login
**Impact**: HIGH - Cannot implement role-based navigation filtering
**Fix Required**: Add workspace fetch in AuthContext.js after successful login

### 1.2 Missing Auth Endpoints
| Endpoint | Backend Doc | Frontend Uses |
|----------|-------------|---------------|
| `GET /api/auth/workspaces` | Required | ❌ Missing |
| `POST /api/auth/register` | Available | ✅ Used |

---

## 2. USER MANAGEMENT MISALIGNMENTS

### 2.1 User Roles Mismatch
**Backend Documentation Roles**:
- `platform_admin`, `admin`, `manager`, `dispatcher`, `driver`, `billing`, `viewer`

**Frontend Defines (PlatformUserManagement.js line 49-59)**:
- `platform_admin`, `company_admin`, `manager`, `dispatcher`, `accountant`, `hr_manager`, `sales_manager`, `fleet_manager`, `driver`

**Mismatches**:
| Backend Role | Frontend Role | Status |
|--------------|---------------|--------|
| `admin` | `company_admin` | ⚠️ Name mismatch |
| `billing` | `accountant` | ⚠️ Name mismatch |
| `viewer` | ❌ Missing | ❌ Not in frontend |
| ❌ Missing | `hr_manager` | ⚠️ Extra in frontend |
| ❌ Missing | `sales_manager` | ⚠️ Extra in frontend |
| ❌ Missing | `fleet_manager` | ⚠️ Extra in frontend |

### 2.2 Worker Types
**Backend Documentation**:
- `t4_employee`, `t4a_contractor`, `corp_contractor`

**Frontend**: NOT implemented - uses `user_type` instead with different values:
- `carrier`, `broker`, `shipper`, `driver`, `dispatcher`, `owner_operator`, `other`

**Impact**: MEDIUM - Tax calculation functionality may not work correctly

### 2.3 User API Endpoints
| Endpoint | Backend Doc | Frontend Uses | Status |
|----------|-------------|---------------|--------|
| `GET /api/users` | ✅ | `/api/admin/users` | ⚠️ Different path |
| `POST /api/users` | ✅ | `/api/admin/users` | ⚠️ Different path |
| `PUT /api/users/{id}` | ✅ | `/api/admin/users/{id}` | ⚠️ Different path |

---

## 3. ORDERS & SHIPMENTS MISALIGNMENTS

### 3.1 Endpoint Path Differences
**Backend Documentation**:
- `POST /api/operations/orders`
- `GET /api/operations/orders`
- `POST /api/operations/shipments`
- `POST /api/operations/shipments/{id}/dispatch`
- `POST /api/operations/shipments/{id}/status`

**Frontend Uses (Legacy)**:
- `GET /api/bookings/my`
- `GET /api/bookings/requests`
- `POST /api/bookings`
- `PATCH /api/bookings/{id}/status`
- `PATCH /api/bookings/{id}/dispatch`
- `POST /api/bookings/{id}/push-to-driver`

**Impact**: HIGH - Different API paths, need backend to support legacy OR update frontend

### 3.2 Missing Shipment Tracking
**Backend Doc**: `POST /api/operations/shipments/{id}/tracking` - Add tracking events
**Frontend**: Not implemented

---

## 4. FLEET MANAGEMENT MISALIGNMENTS

### 4.1 Endpoint Path Differences
**Backend Documentation**:
- `POST /api/fleet/vehicles`
- `GET /api/fleet/vehicles`
- `GET /api/fleet/vehicles/summary`
- `GET /api/fleet/vehicles/fleet-tracking`
- `POST /api/fleet/vehicles/{id}/inspections`
- `POST /api/fleet/vehicles/{id}/maintenance`
- `POST /api/fleet/vehicles/{id}/assign-driver`
- `POST /api/fleet/vehicles/{id}/location`

**Frontend Uses**:
- `GET /api/equipment/my`
- `GET /api/equipment`
- `POST /api/equipment`
- `GET /api/equipment/my/locations`

**Impact**: HIGH - Completely different API structure

### 4.2 Missing Fleet Features
| Feature | Backend Doc | Frontend | Status |
|---------|-------------|----------|--------|
| CVIP Inspections | ✅ | ❌ | Missing |
| Maintenance Records | ✅ | ❌ | Missing |
| Driver Assignment | ✅ | ❌ | Missing |
| Fleet Summary | ✅ | ❌ | Missing |

---

## 5. BILLING/INVOICING MISALIGNMENTS

### 5.1 Endpoint Path Differences
**Backend Documentation**:
- `POST /api/billing/invoices`
- `GET /api/billing/invoices`
- `POST /api/billing/invoices/{id}/payments`
- `GET /api/billing/invoices/{id}/pdf`
- `GET /api/billing/invoices/reports/ar-summary`

**Frontend Uses**:
- `GET /api/accounting/receivables`
- `GET /api/accounting/payables`
- `POST /api/accounting/receivables`
- `POST /api/accounting/payables`
- `GET /api/accounting/expenses`
- `GET /api/accounting/alerts`

**Impact**: HIGH - Completely different structure (AR/AP vs Invoices)

### 5.2 Missing Billing Features
| Feature | Backend Doc | Frontend | Status |
|---------|-------------|----------|--------|
| Invoice PDF Download | ✅ | ❌ | Missing |
| Invoice from Orders | ✅ | ❌ | Missing |
| AR Aging Reports | ✅ | ❌ | Missing |
| Payment Methods (Interac, Factoring) | ✅ | ❌ | Missing |

---

## 6. RATE CARDS & PRICING MISALIGNMENTS

### 6.1 Completely Missing in Frontend
**Backend Documentation Endpoints**:
- `GET /api/pricing/accessorials/codes`
- `GET /api/pricing/accessorials/defaults`
- `POST /api/pricing/accessorials`
- `POST /api/pricing/rate-cards`
- `GET /api/pricing/rate-cards`
- `POST /api/pricing/rate-cards/{id}/lanes`
- `POST /api/pricing/rate-cards/quote`

**Frontend**: Uses `/api/sales/rate-quotes` - much simpler implementation

**Impact**: HIGH - Major pricing functionality missing

---

## 7. MASTER DATA MISALIGNMENTS

### 7.1 Tax Calculator
**Backend Documentation**:
- `GET /api/master-data/tax/rates`
- `POST /api/master-data/tax/calculate`

**Frontend**: NOT implemented
**Impact**: HIGH - Canadian tax calculations not working

### 7.2 Carriers/Brokers
**Backend Documentation**:
- `GET/POST /api/master-data/carriers-brokers`

**Frontend**: Uses FMCSA lookup but not master-data carriers
**Impact**: MEDIUM

### 7.3 Shippers/Consignees
**Backend Documentation**:
- `GET/POST /api/master-data/shippers`
- `GET/POST /api/master-data/consignees`

**Frontend**: NOT implemented
**Impact**: MEDIUM

---

## 8. ROUTE-MATE MODULE

### 8.1 Status: Partially Aligned
**Backend Doc** vs **Frontend** - Routes similar but may need verification:
- `/api/route-mate/routes`
- `/api/route-mate/territories`
- `/api/route-mate/drivers`
- `/api/route-mate/vehicles`
- `/api/route-mate/customers`
- `/api/route-mate/optimize`

---

## 9. ADMIN CONSOLE ENDPOINTS

### 9.1 Extra Frontend Endpoints (Not in Doc)
These endpoints are used by frontend but not documented:
- `/api/admin/analytics`
- `/api/admin/crm/*` (contacts, deals, companies, activities)
- `/api/admin/tenants/*`
- `/api/admin/integrations/*`
- `/api/bundles/*`
- `/api/marketing/admin/*`

**Action**: Verify these exist in backend or document them

---

## 10. WEBSOCKET MISALIGNMENT

**Backend Documentation**: `ws://api/ws/vehicle/{vehicle_id}` for live tracking
**Frontend**: Not implemented
**Impact**: MEDIUM - Real-time tracking not available

---

## PRIORITY FIXES SUMMARY

### P0 - Critical (Blocking Core Functionality)
1. ❌ User roles mismatch - may cause permission issues
2. ❌ Orders use `/api/bookings` instead of `/api/operations/orders`
3. ❌ Fleet uses `/api/equipment` instead of `/api/fleet/vehicles`
4. ❌ Billing uses `/api/accounting` instead of `/api/billing/invoices`

### P1 - High (Missing Important Features)
1. ❌ Worker types (t4_employee, t4a_contractor) not implemented
2. ❌ Workspace-based navigation not implemented
3. ❌ Tax calculator not implemented
4. ❌ Rate cards/accessorials not implemented
5. ❌ Invoice PDF generation not implemented

### P2 - Medium (Enhancement)
1. ⚠️ CVIP inspections UI missing
2. ⚠️ Maintenance records UI missing
3. ⚠️ Shippers/Consignees master data missing
4. ⚠️ WebSocket real-time tracking missing

---

## RECOMMENDED ACTION PLAN

### Option A: Update Frontend to Match Backend API (Recommended)
- Rename `/api/bookings` → `/api/operations/orders`
- Rename `/api/equipment` → `/api/fleet/vehicles`
- Rename `/api/accounting/*` → `/api/billing/invoices/*`
- Add missing pricing/rate-cards module
- Update user roles to match documentation

### Option B: Update Backend to Support Legacy Frontend Paths
- Add alias routes for backward compatibility
- Keep both old and new paths working

### Option C: Hybrid Approach
- Backend provides both paths
- Frontend gradually migrates to new paths
