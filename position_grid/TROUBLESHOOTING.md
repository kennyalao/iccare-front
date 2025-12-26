# Troubleshooting Guide

## Common Issues & Solutions

---

## ❌ Error: "Not authenticated" or 401 Unauthorized

### Problem
```json
{"detail": "Not authenticated"}
```

Or in network tab:
```
Authorization: Bearer
```
(Token is missing after "Bearer")

### Solution

**Step 1: Check if token exists**
```javascript
// Open browser console (F12)
console.log(localStorage.getItem('access_token'))
```

If it returns `null` or empty string, you need to set it.

**Step 2: Get a valid JWT token**

You need to authenticate with the backend first. Use one of these methods:

#### Method A: Via Login Endpoint
```bash
curl -X POST https://iccare.desmarttrader.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Method B: From Existing Session
If you have a token from another system/session, just copy it.

**Step 3: Set the token in localStorage**
```javascript
// In browser console
localStorage.setItem('access_token', 'paste-your-actual-token-here')
```

**Step 4: Refresh the page**
```javascript
location.reload()
```

### Using the Built-in Login Prompt

The application now includes a visual login prompt at the top of the page:

1. If token is not set, you'll see a **yellow warning box**
2. Paste your JWT token into the input field
3. Click "Set Token & Continue"
4. Page will reload automatically

---

## ❌ Error: "Position is not available"

### Problem
```json
{"detail": "Storage position is not available"}
```

### Causes
1. Position is already occupied by another sample
2. Grid occupancy data is stale (not refreshed)

### Solution

**Option 1: Refresh the grid**
```javascript
// The grid should auto-refresh after each registration
// If not, manually reload the page:
location.reload()
```

**Option 2: Check backend occupancy**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://iccare.desmarttrader.com/biospecimen/attributes/boxes/BOX_001/occupancy
```

Look at the `occupancy` array - positions with `1` are occupied.

**Option 3: Select a different position**
- Gray positions are occupied
- White positions are available
- Only click white positions

---

## ❌ Error: "Sample with serial number already exists"

### Problem
```json
{"detail": "Sample with serial number 'SMPL-001' already exists"}
```

### Cause
Serial numbers must be unique in the database.

### Solution
Use a different serial number:
```javascript
// Use timestamp to ensure uniqueness
const serialNo = `SMPL-${Date.now()}`

// Or use UUID
const serialNo = `SMPL-${crypto.randomUUID()}`

// Or increment manually
const serialNo = 'SMPL-2025-002'  // Instead of SMPL-2025-001
```

---

## ❌ Grid Not Loading / Blank Grid

### Problem
Grid shows "Loading..." forever or doesn't display.

### Causes
1. Invalid box ID
2. Box doesn't exist in backend
3. Network error
4. Missing authentication

### Solution

**Step 1: Check browser console (F12)**
Look for errors in the Console tab.

**Step 2: Check Network tab**
Look for failed requests (red).

**Step 3: Verify box exists**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://iccare.desmarttrader.com/biospecimen/attributes/boxes/
```

**Step 4: Update box ID in App.vue**
```javascript
// In src/App.vue line 9
const boxId = ref('BOX_001')  // Change to your actual box ID
```

---

## ❌ CORS Error

### Problem
```
Access to fetch at 'https://iccare.desmarttrader.com/...' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

### Cause
Backend needs to allow requests from your frontend origin.

### Solution
This must be fixed on the backend. Contact your backend administrator to add your origin to the CORS allowed origins.

**Temporary workaround (development only):**
Use a CORS proxy or browser extension like "CORS Unblock" (not recommended for production).

---

## ❌ Position Index Mismatch

### Problem
Selected position "A5" registers sample at wrong position.

### Cause
Column count mismatch between frontend and backend template.

### Solution

**Step 1: Check backend template**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://iccare.desmarttrader.com/biospecimen/attributes/boxes/BOX_001/occupancy
```

Look at:
```json
{
  "template": {
    "rows": 10,
    "columns": 10  // ← This is critical
  }
}
```

**Step 2: Verify calculation**
The `getPositionIndex` function in App.vue should match backend logic.

Formula: `(rowIndex × columns) + columnIndex`

Example for "B5" in 10-column grid:
- Row B = index 1 (A=0, B=1, C=2...)
- Column 5 = index 4 (1→0, 2→1, 3→2, 4→3, 5→4)
- Position = (1 × 10) + 4 = **14**

---

## ❌ Form Validation Errors

### Problem
Submit button stays disabled even after filling form.

### Causes
1. Position not selected
2. Required field empty
3. Invalid date format

### Solution

**Check required fields:**
- ✅ Position selected (click a white cell in grid)
- ✅ Sample Serial No
- ✅ Sample Label
- ✅ Collection Date
- ✅ Researcher Info
- ✅ Field Collector Info

**Open browser console:**
```javascript
// Check form validity
console.log({
  selectedPosition: selectedPosition.value,
  formData: sampleForm.value
})
```

---

## ❌ Token Expired

### Problem
```json
{"detail": "Token has expired"}
```

### Cause
JWT tokens have an expiration time (typically 24 hours).

### Solution
Get a new token by logging in again:

```bash
curl -X POST https://iccare.desmarttrader.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your-username", "password": "your-password"}'
```

Then update localStorage:
```javascript
localStorage.setItem('access_token', 'new-token-here')
location.reload()
```

---

## ❌ Network Errors

### Problem
```
Failed to fetch
TypeError: Failed to fetch
```

### Causes
1. Backend is down
2. No internet connection
3. Firewall blocking requests
4. Wrong API URL

### Solution

**Step 1: Check if backend is reachable**
```bash
curl https://iccare.desmarttrader.com/biospecimen/attributes/boxes/
```

**Step 2: Verify API URL**
Check `src/services/api.js`:
```javascript
const API_BASE = 'https://iccare.desmarttrader.com/biospecimen'
```

**Step 3: Check your internet connection**

**Step 4: Try in different browser**

---

## 🔍 Debugging Tips

### Enable Detailed Logging

Add this to browser console:
```javascript
// Log all fetch requests
const originalFetch = window.fetch
window.fetch = async (...args) => {
  console.log('🌐 FETCH:', args[0], args[1])
  const response = await originalFetch(...args)
  console.log('✅ RESPONSE:', response.status, response.statusText)
  return response
}
```

### Check localStorage

```javascript
// View all stored data
console.log('Access Token:', localStorage.getItem('access_token'))
console.log('All Storage:', {...localStorage})
```

### Inspect API Response

In Network tab (F12):
1. Click on failed request
2. Go to "Response" tab
3. Check error details
4. Go to "Headers" tab
5. Verify Authorization header

### Test API Independently

Use Postman or curl to verify backend is working:

```bash
# Test occupancy endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://iccare.desmarttrader.com/biospecimen/attributes/boxes/BOX_001/occupancy

# Test sample registration
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_id": "SITE01",
    "sample_category_id": "CAT_BLOOD",
    "sample_serial_no": "TEST-001",
    "sample_label": "Test Sample",
    "storage_location": {
      "site": "SITE01",
      "freezer": "FRZ01",
      "rack": "RACK01",
      "box": "BOX_001",
      "position": 0
    },
    "collection_date": "2025-12-26",
    "collection_time": null,
    "researcher_info": "Test Researcher",
    "field_collector_info": "Test Collector",
    "free_fields": {}
  }' \
  https://iccare.desmarttrader.com/biospecimen/samples/
```

---

## 📞 Getting Help

If you're still stuck:

1. **Check browser console** (F12) for error messages
2. **Check Network tab** for failed requests
3. **Copy error message** and search documentation
4. **Test backend directly** with curl
5. **Check backend logs** (if you have access)

### Useful Console Commands

```javascript
// Check if app is loaded
console.log(window.location.href)

// Check Vue app state (if using Vue DevTools)
console.log('Token exists:', !!localStorage.getItem('access_token'))

// Test API manually
await fetch('https://iccare.desmarttrader.com/biospecimen/attributes/boxes/BOX_001/occupancy', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
}).then(r => r.json()).then(console.log)
```

---

## Quick Checklist

Before submitting a sample, verify:

- [ ] JWT token is set in localStorage
- [ ] Token is not expired
- [ ] Box ID exists in backend
- [ ] Grid has loaded successfully
- [ ] Position is selected (white cell clicked)
- [ ] All required form fields filled
- [ ] Serial number is unique
- [ ] Backend is reachable
- [ ] No CORS errors in console

---

For more help, see:
- [QUICK_START.md](QUICK_START.md) - Setup guide
- [README_INTEGRATION.md](README_INTEGRATION.md) - Full documentation
- [EXAMPLES.md](EXAMPLES.md) - Code examples
