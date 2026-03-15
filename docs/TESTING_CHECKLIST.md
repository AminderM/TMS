# Carrier Profile Builder - Quick Testing Checklist

## Pre-Testing Setup

### Access URLs
- **Frontend:** https://onboard-carrier-tms.preview.emergentagent.com
- **Backend API:** https://api.staging.integratedtech.ca

### How to Access the Feature
1. Login to the TMS Dashboard
2. Hover over "Company" in the top navigation
3. Click "Carrier Profile Builder" (highlighted in red)

---

## Manual Testing Checklist

### ✅ Step 1: Company Info & Logo
| Test Case | Steps | Expected Result | Pass/Fail |
|-----------|-------|-----------------|-----------|
| Form loads | Open wizard | Empty form with initials avatar "CP" | |
| Logo upload | Drag/drop or click to upload image | Preview shows uploaded logo | |
| Logo remove | Click X on logo | Returns to initials avatar | |
| Company name | Enter company name | Initials avatar updates (e.g., "NE" for Northern Express) | |
| Country selection | Select Canada/USA/Both | Province dropdown updates accordingly | |
| Required fields | Leave required fields empty, click Next | Should still allow navigation (validation on complete) | |

### ✅ Step 2: Document Upload
| Test Case | Steps | Expected Result | Pass/Fail |
|-----------|-------|-----------------|-----------|
| Document list | Select country in Step 1, go to Step 2 | Shows correct docs (CA/US/Both) | |
| Upload document | Click Upload on any doc card | File picker opens, uploads file | |
| View document | Click eye icon on uploaded doc | Preview modal opens | |
| Remove document | Click trash icon | Document removed, status returns to "Not Uploaded" | |
| Set expiry | Click calendar on uploaded doc | Date picker works, status may change | |
| Expired status | Set expiry to past date | Shows "Expired" badge in red | |
| Expiring soon | Set expiry within 30 days | Shows "Expiring Soon" badge in amber | |

### ✅ Step 3: Regulatory Details
| Test Case | Steps | Expected Result | Pass/Fail |
|-----------|-------|-----------------|-----------|
| Canadian section | Country = Canada | Shows NSC, CVOR, CRA, GST fields | |
| US section | Country = USA | Shows USDOT, MC, EIN, IFTA fields | |
| Both sections | Country = Both | Shows all fields | |
| Cross-border toggle | Toggle switches | Value changes (persists) | |
| FAST card toggle | Toggle switch | Value changes (persists) | |

### ✅ Step 4: Fleet & Lanes
| Test Case | Steps | Expected Result | Pass/Fail |
|-----------|-------|-----------------|-----------|
| Fleet size | Enter truck/trailer counts | Values save | |
| Equipment types | Click equipment cards | Selected items highlight with checkmark | |
| Multiple equipment | Select several types | All selections persist | |
| Add lane | Enter origin/destination, click Add | Lane appears in list | |
| Remove lane | Click X on lane | Lane removed | |
| Max 5 lanes | Add 5 lanes | Add button disabled/hidden | |
| Capabilities | Toggle Hazmat/Cross-border/24x7 | Values persist | |
| ELD provider | Select from dropdown | Selection persists | |

### ✅ Step 5: Payment Setup
| Test Case | Steps | Expected Result | Pass/Fail |
|-----------|-------|-----------------|-----------|
| Payment method | Select EFT/Cheque/Wire | Selection persists | |
| Factoring option | Select Factoring | Shows additional fields for company name + NOA upload | |
| Bank fields | Enter bank name, numbers | Values persist | |
| Account masking | Enter account number, click eye | Toggles between masked/visible | |
| Country-specific | Canada selected | Shows Transit + Institution Number | |
| Country-specific | USA selected | Shows ABA Routing Number | |

### ✅ Navigation & Persistence
| Test Case | Steps | Expected Result | Pass/Fail |
|-----------|-------|-----------------|-----------|
| Step navigation | Click steps in sidebar | Navigates to completed/current steps only | |
| Progress bar | Complete steps | Progress % increases | |
| Save & Exit | Click button | Toast confirms save, wizard closes | |
| Resume | Reopen wizard | Previous data loaded, correct step shown | |
| Theme toggle | Click sun/moon button | UI switches between light/dark mode | |

### ✅ Profile Complete Screen
| Test Case | Steps | Expected Result | Pass/Fail |
|-----------|-------|-----------------|-----------|
| Complete profile | Finish Step 5, click Complete | Shows completion screen | |
| Document stats | View stats cards | Shows uploaded/expiring/expired counts | |
| View Profile | Click button | Returns to wizard for editing | |
| Send Package | Click button | Opens send package modal | |

### ✅ Send Package Modal
| Test Case | Steps | Expected Result | Pass/Fail |
|-----------|-------|-----------------|-----------|
| Select documents | Toggle document checkboxes | Selected count updates | |
| Select all | Click "Select All" | All valid docs selected | |
| Expired disabled | Check expired doc | Cannot be selected (greyed out) | |
| Recipient form | Fill name, company, email | Required validation works | |
| Message limit | Enter 200+ chars | Limited to 200 characters | |
| Generate PDF | Click "Generate & Send" | PDF downloads, email client opens | |

---

## API Testing Commands

### Test Authentication
```bash
# Replace YOUR_TOKEN with actual JWT token
export TOKEN="YOUR_JWT_TOKEN"
export API_URL="https://api.staging.integratedtech.ca"
```

### Test Profile Endpoints
```bash
# Get current profile
curl -s -X GET "$API_URL/api/carrier-profiles/me" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Create/Update profile
curl -s -X PATCH "$API_URL/api/carrier-profiles/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_info": {
      "legal_name": "Test Trucking Co",
      "country": "Canada",
      "province": "Ontario"
    }
  }' | jq .
```

### Test Document Upload
```bash
# Upload a document
curl -s -X POST "$API_URL/api/carrier-profiles/me/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_document.pdf" \
  -F "document_type=nsc_certificate" \
  -F "expiry_date=2025-12-31" | jq .

# List documents
curl -s -X GET "$API_URL/api/carrier-profiles/me/documents" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Test Package Sending
```bash
# Send a package (replace doc IDs with actual IDs)
curl -s -X POST "$API_URL/api/carrier-profiles/me/packages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_name": "Test Recipient",
    "recipient_company": "Test Logistics",
    "recipient_email": "test@example.com",
    "document_ids": ["doc_id_1", "doc_id_2"]
  }' | jq .

# List sent packages
curl -s -X GET "$API_URL/api/carrier-profiles/me/packages" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Common Issues & Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Wizard won't open | Auth token expired | Re-login to refresh token |
| Documents not showing | Country not selected | Go to Step 1, select country |
| Theme not changing | localStorage blocked | Check browser privacy settings |
| PDF not downloading | Popup blocker | Allow popups for the site |
| Email client not opening | No email app configured | Check default email handler |
| Data not persisting | localStorage full | Clear browser storage |

---

## Browser Compatibility

| Browser | Minimum Version | Tested |
|---------|----------------|--------|
| Chrome | 90+ | ✅ |
| Firefox | 88+ | |
| Safari | 14+ | |
| Edge | 90+ | |

---

## Mobile Responsiveness

Test on:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

*Use this checklist to verify all features work correctly after backend integration.*
