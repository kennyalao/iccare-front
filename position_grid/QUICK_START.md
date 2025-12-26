# Quick Start Guide

## Setup (3 steps)

### 1. Install Dependencies
```bash
cd C:\workbench\projects\iCCaRE-frontend\position_grid\position_grid
npm install
```

### 2. Set Authentication Token
Open browser console and run:
```javascript
localStorage.setItem('access_token', 'your-jwt-token-here')
```

### 3. Run Application
```bash
npm run dev
```

Visit: `http://localhost:5173`

---

## Usage

1. **Select Position**: Click any white (available) position in the grid
2. **Fill Form**: Enter sample information in the right panel
3. **Submit**: Click "Register Sample" button
4. **Success**: Grid refreshes automatically, form resets

---

## Configuration

Edit [src/App.vue](src/App.vue) lines 10-12:

```javascript
const siteId = ref('YOUR_SITE_ID')
const freezerId = ref('YOUR_FREEZER_ID')
const rackId = ref('YOUR_RACK_ID')
const boxId = ref('YOUR_BOX_ID')
```

---

## What Gets Submitted

When you click "Register Sample", this payload is sent to:
`POST https://iccare.desmarttrader.com/biospecimen/samples/`

```json
{
  "site_id": "SITE01",
  "sample_category_id": "CAT_BLOOD",
  "sample_serial_no": "SMPL-2025-001",
  "sample_label": "Blood Sample - Patient A",
  "storage_location": {
    "site": "SITE01",
    "freezer": "FRZ01",
    "rack": "RACK01",
    "box": "BOX_001",
    "position": 5  // Auto-calculated from grid selection (e.g., "A5" → 5)
  },
  "collection_date": "2025-12-26",
  "collection_time": "14:30:00",
  "researcher_info": "Dr. Smith",
  "field_collector_info": "Jane Doe",
  "free_fields": {}
}
```

---

## Files Created/Updated

| File | Purpose |
|------|---------|
| [src/services/api.js](src/services/api.js) | **NEW** - Backend API service |
| [src/App.vue](src/App.vue) | **UPDATED** - Added registration form |
| [README_INTEGRATION.md](README_INTEGRATION.md) | **NEW** - Full documentation |

Existing files (unchanged):
- `src/components/PositionGrid.vue` - Grid component
- `src/composables/useBoxOccupancy.js` - Occupancy data fetching

---

## Troubleshooting

**Grid not loading?**
- Check JWT token: `localStorage.getItem('access_token')`
- Verify box ID exists: Check `boxId` in App.vue

**Submit fails?**
- Open browser DevTools → Network tab
- Look for red failed requests
- Check error message in UI

**Position already occupied?**
- Backend validates positions
- Refresh grid: `location.reload()`

---

For complete documentation, see [README_INTEGRATION.md](README_INTEGRATION.md)
