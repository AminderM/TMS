# Bug Report: /api/bookings/my Returns 500 Error

## Issue Summary
**Endpoint**: `GET /api/bookings/my`
**Error**: HTTP 500 Internal Server Error
**Affected User**: Platform Admin (aminderpro@gmail.com)

---

## Root Cause Analysis

### User Context
```json
{
    "email": "aminderpro@gmail.com",
    "role": "platform_admin",
    "fleet_owner_id": null,    // <-- THIS IS THE PROBLEM
    "id": "59488fd7-31fd-4318-9089-84e571a1b0ec"
}
```

### Problem
The `/api/bookings/my` endpoint attempts to filter bookings by `fleet_owner_id`, but:
1. The Platform Admin user has `fleet_owner_id: null`
2. No company/tenant is associated with this user
3. The backend code likely does: `WHERE fleet_owner_id = {user.fleet_owner_id}` without null check
4. This causes a database error or null pointer exception

### Evidence
| Endpoint | Result | Explanation |
|----------|--------|-------------|
| `/api/bookings/my` | ❌ 500 | Crashes on null fleet_owner_id |
| `/api/bookings/requests` | ✅ 200 | Uses `created_by` instead (works) |
| `/api/companies/my` | ❌ 404 | "No company found" |
| `/api/companies/current` | ❌ 404 | "No company found" |
| `/api/admin/tenants` | ✅ 200 | Returns empty array [] |

---

## Workaround Found

**`/api/bookings/requests` works correctly** and returns the same booking data:
```json
[{
    "id": "e2a141a4-55da-4aab-8d84-feacd27ba31c",
    "order_number": "LD-436C2612",
    "status": "at_delivery",
    "confirmed_rate": 4387.08,
    ...
}]
```

---

## Recommended Backend Fixes

### Option 1: Add Null Check (Quick Fix)
```python
# In /api/bookings/my endpoint
def get_my_bookings(user):
    if user.fleet_owner_id is None:
        # For platform_admin, return all bookings or filter by created_by
        return db.bookings.find({"created_by": user.id})
    else:
        return db.bookings.find({"fleet_owner_id": user.fleet_owner_id})
```

### Option 2: Platform Admin Gets All Bookings
```python
def get_my_bookings(user):
    if user.role == "platform_admin":
        return db.bookings.find({})  # Return all
    elif user.fleet_owner_id:
        return db.bookings.find({"fleet_owner_id": user.fleet_owner_id})
    else:
        return db.bookings.find({"created_by": user.id})
```

### Option 3: Require Company Setup
- Platform admin must create a company/tenant first
- Associate user with company
- Then /api/bookings/my will work

---

## Frontend Workaround (Temporary)

Until backend is fixed, frontend can use `/api/bookings/requests` instead:

**File**: `/app/frontend/src/components/Dashboard.js` or wherever bookings are fetched

```javascript
// Change from:
const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings/my`);

// To:
const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings/requests`);
```

---

## Priority
**P0 - Critical**: This breaks the Orders/Loads functionality for platform admins

## Assignee
Backend Team

## Status
🔴 Open - Awaiting backend fix
