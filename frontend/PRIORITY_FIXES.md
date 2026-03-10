# Admin Portal - Critical Fixes Prioritized List

## 🔴 P0 - CRITICAL (Breaks Core Functionality)

### 1. API Path Mismatches - Orders/Bookings
| Frontend Path | Backend Doc Path | Files Affected |
|---------------|------------------|----------------|
| `/api/bookings/my` | `/api/operations/orders` | Dashboard.js, OrderManagement.js |
| `/api/bookings` (POST) | `/api/operations/orders` | OrderManagement.js |
| `/api/bookings/{id}/status` | `/api/operations/shipments/{id}/status` | OrderManagement.js |
| `/api/bookings/{id}/dispatch` | `/api/operations/shipments/{id}/dispatch` | OrderManagement.js |

**Impact**: Orders won't load if backend only supports new paths

---

### 2. API Path Mismatches - Fleet/Equipment
| Frontend Path | Backend Doc Path | Files Affected |
|---------------|------------------|----------------|
| `/api/equipment/my` | `/api/fleet/vehicles` | FleetManagement.js, Dashboard.js |
| `/api/equipment` (POST) | `/api/fleet/vehicles` | FleetManagement.js |
| `/api/equipment/my/locations` | `/api/fleet/vehicles/fleet-tracking` | FleetManagement.js |

**Impact**: Fleet management completely broken

---

### 3. API Path Mismatches - Accounting/Billing
| Frontend Path | Backend Doc Path | Files Affected |
|---------------|------------------|----------------|
| `/api/accounting/receivables` | `/api/billing/invoices` | AccountingDepartment.js |
| `/api/accounting/payables` | Not in doc (AP separate?) | AccountingDepartment.js |
| `/api/accounting/expenses` | Not in doc | AccountingDepartment.js |

**Impact**: Accounting module broken

---

### 4. User Roles Mismatch
| Frontend Role | Backend Role | Action |
|---------------|--------------|--------|
| `company_admin` | `admin` | Rename |
| `accountant` | `billing` | Rename |
| `hr_manager` | ❌ Not in backend | Remove or add to backend |
| `sales_manager` | ❌ Not in backend | Remove or add to backend |
| `fleet_manager` | ❌ Not in backend | Remove or add to backend |
| ❌ Missing | `viewer` | Add to frontend |

**File**: `PlatformUserManagement.js` lines 49-59

---

## 🟠 P1 - HIGH (Missing Important Features)

### 5. Missing Workspace Navigation
**Backend Provides**: `GET /api/auth/workspaces` returns `allowed_workspaces[]`
**Frontend Missing**: No workspace fetch, no navigation filtering
**File**: `AuthContext.js`
**Required Changes**:
```javascript
// After login success, add:
const workspacesRes = await fetch(`${BACKEND_URL}/api/auth/workspaces`, {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
const workspaces = await workspacesRes.json();
setAllowedWorkspaces(workspaces.allowed_workspaces);
```

---

### 6. Missing Worker Types (Canadian Tax)
**Backend Provides**: `t4_employee`, `t4a_contractor`, `corp_contractor`
**Frontend Has**: `user_type` with carrier, broker, shipper, etc.
**Impact**: Tax calculations won't work for Canadian payroll
**File**: `PlatformUserManagement.js`

---

### 7. Missing Tax Calculator
**Backend Provides**:
- `GET /api/master-data/tax/rates` - All provincial rates
- `POST /api/master-data/tax/calculate` - Calculate tax

**Frontend**: No tax calculation UI
**Impact**: Canadian GST/PST/HST not calculated on invoices

---

### 8. Missing Rate Cards Module
**Backend Provides**:
- `/api/pricing/rate-cards` - CRUD rate cards
- `/api/pricing/rate-cards/quote` - Get rate quotes
- `/api/pricing/accessorials` - Accessorial charges

**Frontend**: Only has `/api/sales/rate-quotes` (simplified)
**Impact**: Cannot manage complex pricing, lane rates, accessorials

---

### 9. Missing Invoice PDF Generation
**Backend Provides**:
- `GET /api/billing/invoices/{id}/pdf` - Download PDF
- `GET /api/billing/invoices/{id}/pdf/preview` - Preview PDF

**Frontend**: No PDF download buttons
**Impact**: Cannot generate professional invoices

---

## 🟡 P2 - MEDIUM (Missing Secondary Features)

### 10. Missing CVIP Inspections UI
**Backend Provides**:
- `POST /api/fleet/vehicles/{id}/inspections`
- `GET /api/fleet/vehicles/{id}/inspections`

**Frontend**: No inspection management
**Impact**: Canadian CVIP compliance tracking not available

---

### 11. Missing Maintenance Records UI
**Backend Provides**:
- `POST /api/fleet/vehicles/{id}/maintenance`
- `GET /api/fleet/vehicles/{id}/maintenance`

**Frontend**: No maintenance tracking
**Impact**: PM scheduling, repair history not tracked

---

### 12. Missing Shippers/Consignees Master Data
**Backend Provides**:
- `GET/POST /api/master-data/shippers`
- `GET/POST /api/master-data/consignees`

**Frontend**: Not implemented
**Impact**: Cannot manage pickup/delivery parties

---

### 13. Missing WebSocket Real-time Tracking
**Backend Provides**: `ws://api/ws/vehicle/{vehicle_id}`
**Frontend**: Polling-based updates only
**Impact**: No live GPS tracking

---

## 🟢 P3 - LOW (Nice to Have)

### 14. Missing Driver Assignment UI
**Backend**: `POST /api/fleet/vehicles/{id}/assign-driver`
**Frontend**: Basic assignment only

### 15. Missing AR Aging Reports
**Backend**: `GET /api/billing/invoices/reports/ar-aging`
**Frontend**: Basic AR summary only

### 16. Missing Fleet Summary Dashboard
**Backend**: `GET /api/fleet/vehicles/summary`
**Frontend**: No compliance alerts dashboard

---

## SUMMARY TABLE

| Priority | Count | Category |
|----------|-------|----------|
| 🔴 P0 | 4 | API paths, User roles |
| 🟠 P1 | 5 | Auth, Tax, Pricing, PDF |
| 🟡 P2 | 4 | Inspections, Maintenance, Master Data |
| 🟢 P3 | 3 | Nice-to-have features |

---

## RECOMMENDED FIX ORDER

1. **First** - Verify which endpoints backend actually supports (old vs new paths)
2. **If backend supports both** - No frontend changes needed for P0
3. **If backend only supports new paths** - Update frontend API calls
4. **Then** - Add missing features (P1, P2) incrementally
