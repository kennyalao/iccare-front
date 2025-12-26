# Position Grid - Backend Integration Guide

## Overview

This application provides a complete sample registration system with visual position grid selection for the iCCaRE biospecimen management platform.

## Features

✅ **Interactive Position Grid**
- Visual grid display with real-time occupancy status
- Occupied positions are disabled (gray)
- Available positions are clickable (white with blue hover)
- Automatic grid refresh after sample registration

✅ **Sample Registration Form**
- Complete form with validation
- Real-time error handling
- Success/failure feedback
- Auto-reset after successful submission

✅ **Backend Integration**
- RESTful API communication
- JWT authentication
- Automatic position index calculation
- Storage location hierarchy (Site → Freezer → Rack → Box → Position)

---

## Project Structure

```
position_grid/
├── src/
│   ├── components/
│   │   ├── PositionGrid.vue       # Grid UI component
│   │   └── StoreSample.vue        # Alternative implementation example
│   ├── composables/
│   │   └── useBoxOccupancy.js     # Occupancy data fetching
│   ├── services/
│   │   └── api.js                 # Backend API service
│   └── App.vue                     # Main application with form
```

---

## API Endpoints Used

### 1. Get Box Occupancy (Read)
```
GET /biospecimen/attributes/boxes/{box_id}/occupancy
Authorization: Bearer <token>

Response:
{
  "box_id": "BOX_001",
  "box_name": "Storage Box 1",
  "template": {
    "rows": 10,
    "columns": 10,
    "total_positions": 100
  },
  "occupancy": [1, 0, 1, 0, ...],  // Array of 0/1
  "positions": ["A1", "A2", ...],   // Position labels
  "occupied_positions": {
    "A1": "sample-uuid-123"
  },
  "statistics": {
    "occupied": 23,
    "available": 77
  }
}
```

### 2. Register Sample (Create)
```
POST /biospecimen/samples/
Authorization: Bearer <token>
Content-Type: application/json

Payload:
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
    "position": 5  // Calculated index (not label)
  },
  "collection_date": "2025-12-26",
  "collection_time": "14:30:00",
  "researcher_info": "Dr. Smith - Lab A",
  "field_collector_info": "Jane Doe - Station 3",
  "free_fields": {}
}

Response (201 Created):
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "sample_serial_no": "SMPL-2025-001",
  ...
}
```

---

## Position Index Calculation

The backend expects a **numeric index** for positions, not the label (e.g., "A5").

### Formula

For position label `"A5"` in a 10-column grid:

```javascript
// Extract row and column
const rowChar = "A"           // First character
const colNumber = 5           // Remaining digits

// Convert to zero-based indices
const rowIndex = rowChar.charCodeAt(0) - 65  // A=0, B=1, C=2...
const colIndex = colNumber - 1                // 1-indexed → 0-indexed

// Calculate flat index
const positionIndex = (rowIndex * columns) + colIndex
// A5 → (0 * 10) + 4 = 4
```

### Implementation

See `App.vue:34-39`:
```javascript
const getPositionIndex = (positionLabel, cols) => {
  const rowChar = positionLabel.charAt(0)
  const colNumber = parseInt(positionLabel.slice(1), 10)
  const rowIndex = rowChar.charCodeAt(0) - 65
  return (rowIndex * cols) + (colIndex)
}
```

---

## Authentication

The API uses **JWT Bearer tokens**. Store the token in `localStorage`:

```javascript
localStorage.setItem('access_token', 'your-jwt-token')
```

The API service automatically includes it in headers:
```javascript
Authorization: Bearer ${localStorage.getItem('access_token')}
```

---

## How to Use

### 1. Set Authentication Token

Before using the app, set your JWT token:
```javascript
localStorage.setItem('access_token', 'your-actual-jwt-token')
```

### 2. Configure Storage IDs

Update `App.vue:10-12` with your actual IDs:
```javascript
const siteId = ref('SITE01')     // Your site ID
const freezerId = ref('FRZ01')   // Your freezer ID
const rackId = ref('RACK01')     // Your rack ID
const boxId = ref('BOX_001')     // Your box ID
```

### 3. Run the Application

```bash
npm install
npm run dev
```

### 4. Register a Sample

1. Grid loads automatically with current occupancy
2. Click an available (white) position
3. Fill in sample information form
4. Click "Register Sample"
5. On success:
   - Grid refreshes automatically
   - Form resets
   - Success message appears for 3 seconds

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Position is not available` | Position already occupied | Grid may be stale - refresh page |
| `HTTP 401` | Missing or invalid token | Check `localStorage.getItem('access_token')` |
| `HTTP 400` | Validation error | Check payload matches backend schema |
| `Sample serial number already exists` | Duplicate serial number | Use unique serial number |

### Error Display

Errors are shown in a red alert box above the submit button ([App.vue:254-259](src/App.vue#L254-L259)).

---

## Customization

### Change Grid Box

Update the `boxId` ref in [App.vue:8](src/App.vue#L8):
```javascript
const boxId = ref('BOX_002')  // Different box
```

### Add Custom Fields

Extend `free_fields` in [App.vue:90](src/App.vue#L90):
```javascript
free_fields: {
  patient_id: '12345',
  study_arm: 'Control'
}
```

### Change Sample Categories

Update options in [App.vue:192-197](src/App.vue#L192-L197):
```html
<option value="CAT_CUSTOM">Custom Type</option>
```

---

## Component API

### PositionGrid Component

**Props:**
- `boxId` (String, required) - The box ID to display

**Events:**
- `@select(position)` - Emits when user clicks available position
  - `position`: String (e.g., "A5", "B12")

**Usage:**
```vue
<PositionGrid
  :boxId="boxId"
  @select="handleSelect"
/>
```

### useBoxOccupancy Composable

**Parameters:**
- `boxIdRef` (Ref<string>) - Reactive box ID reference

**Returns:**
```javascript
{
  loading: Ref<boolean>,
  error: Ref<string | null>,
  rows: Ref<number>,
  columns: Ref<number>,
  occupancy: Ref<number[]>,
  positions: Ref<string[]>,
  occupiedPositions: Ref<object>,
  gridRows: ComputedRef<string[][]>,
  reload: Function
}
```

**Usage:**
```javascript
const { reload, columns, gridRows } = useBoxOccupancy(boxId)
```

---

## Development

### Run Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## Testing

### Manual Testing Checklist

- [ ] Grid loads with correct occupancy
- [ ] Occupied positions are disabled (gray)
- [ ] Available positions are clickable (white)
- [ ] Clicking position updates "Selected Position"
- [ ] Form validation prevents empty submission
- [ ] Submit button disabled when form incomplete
- [ ] Error messages display correctly
- [ ] Success message shows after registration
- [ ] Grid refreshes after successful registration
- [ ] Form resets after successful registration
- [ ] Newly registered position becomes occupied

### API Testing

Use `curl` or Postman to test endpoints independently:

```bash
# Get occupancy
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://iccare.desmarttrader.com/biospecimen/attributes/boxes/BOX_001/occupancy

# Register sample
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}' \
  https://iccare.desmarttrader.com/biospecimen/samples/
```

---

## Troubleshooting

### Grid not loading
- Check browser console for errors
- Verify JWT token is set
- Check network tab for API response
- Verify box ID exists in backend

### Position index mismatch
- Ensure column count matches backend template
- Check `getPositionIndex` calculation
- Backend uses 0-based indexing

### CORS errors
- Backend must allow frontend origin
- Check CORS headers in API response

### Occupied position clickable
- Grid occupancy may be stale
- Call `reload()` to refresh
- Check backend storage validation

---

## API Service Reference

See [src/services/api.js](src/services/api.js) for all available functions:

```javascript
import {
  registerSample,
  getBoxOccupancy,
  getSites,
  getFreezers,
  getRacks,
  getBoxes,
  getSampleCategories
} from '@/services/api'
```

---

## License

Part of the iCCaRE Biospecimen Management System

---

## Support

For backend API documentation, see:
- `C:\workbench\projects\iCCaRE-backend\README.md`
- API Testing Guide: `C:\workbench\projects\iCCaRE-backend\API_TESTING_GUIDE_REMOTE.html`
