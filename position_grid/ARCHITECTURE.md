# Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vue 3)                        │
│                                                             │
│  ┌──────────────┐         ┌──────────────────────────┐     │
│  │   App.vue    │         │   PositionGrid.vue       │     │
│  │              │         │                          │     │
│  │ - Form State │────────▶│ - Grid Display          │     │
│  │ - Submit     │         │ - Click Handlers         │     │
│  │   Handler    │         │ - Visual States          │     │
│  └──────┬───────┘         └──────────┬───────────────┘     │
│         │                            │                     │
│         │ uses                       │ uses                │
│         ▼                            ▼                     │
│  ┌──────────────┐         ┌──────────────────────────┐     │
│  │  api.js      │         │  useBoxOccupancy.js      │     │
│  │              │         │                          │     │
│  │ - register   │         │ - fetch occupancy        │     │
│  │   Sample()   │         │ - auto-reload            │     │
│  │ - getBox     │         │ - computed gridRows      │     │
│  │   Occupancy()│         │                          │     │
│  └──────┬───────┘         └──────────┬───────────────┘     │
│         │                            │                     │
└─────────┼────────────────────────────┼─────────────────────┘
          │                            │
          │ HTTP                       │ HTTP
          │ POST /samples/             │ GET /boxes/:id/occupancy
          │                            │
┌─────────▼────────────────────────────▼─────────────────────┐
│              BACKEND (FastAPI + PostgreSQL)                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         routers/samples.py                          │   │
│  │                                                     │   │
│  │  POST /samples/                                     │   │
│  │  ├─ Validate position availability                  │   │
│  │  ├─ Create BioSampleDB record                       │   │
│  │  ├─ Occupy position in StoragePositionDB            │   │
│  │  └─ Emit BIOSAMPLE_REGISTERED event                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │      routers/attributes.py                          │   │
│  │                                                     │   │
│  │  GET /boxes/{box_id}/occupancy                      │   │
│  │  ├─ Fetch BoxDB record                              │   │
│  │  ├─ Get PositionTemplateDB (rows, columns)          │   │
│  │  ├─ Query StoragePositionDB for occupancy           │   │
│  │  └─ Return BoxOccupancy schema                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Database (PostgreSQL)                  │   │
│  │                                                     │   │
│  │  ┌────────────────┐  ┌──────────────────────────┐  │   │
│  │  │  BioSampleDB   │  │  StoragePositionDB       │  │   │
│  │  ├────────────────┤  ├──────────────────────────┤  │   │
│  │  │ uuid           │  │ site, freezer, rack, box │  │   │
│  │  │ serial_no      │  │ position (int)           │  │   │
│  │  │ label          │  │ is_occupied (bool)       │  │   │
│  │  │ storage_loc    │  │ occupied_by_sample_uuid  │  │   │
│  │  │ collection_... │  │ occupied_at              │  │   │
│  │  └────────────────┘  └──────────────────────────┘  │   │
│  │                                                     │   │
│  │  ┌────────────────┐  ┌──────────────────────────┐  │   │
│  │  │  BoxDB         │  │  PositionTemplateDB      │  │   │
│  │  ├────────────────┤  ├──────────────────────────┤  │   │
│  │  │ box_id         │  │ template_id              │  │   │
│  │  │ box_name       │  │ rows                     │  │   │
│  │  │ rack_id        │  │ columns                  │  │   │
│  │  │ template_id ───┼──▶ total_positions          │  │   │
│  │  │ site, freezer  │  │ label_format             │  │   │
│  │  └────────────────┘  └──────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Sample Registration

```
┌──────────┐
│  USER    │
│  CLICKS  │
│ Position │
│   "A5"   │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────┐
│  PositionGrid.vue                   │
│  @click="emit('select', 'A5')"      │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  App.vue                            │
│  handleSelect('A5')                 │
│  → selectedPosition.value = 'A5'    │
└─────────────────────────────────────┘
     │
     │ USER FILLS FORM & CLICKS SUBMIT
     ▼
┌─────────────────────────────────────┐
│  App.vue - submitSample()           │
│                                     │
│  1. Validate form                   │
│  2. Convert "A5" → index (5)        │
│  3. Build payload:                  │
│     {                               │
│       sample_serial_no: "...",      │
│       storage_location: {           │
│         box: "BOX_001",             │
│         position: 5                 │
│       },                            │
│       ...                           │
│     }                               │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  api.js - registerSample()          │
│                                     │
│  fetch(POST /samples/, {            │
│    headers: {                       │
│      Authorization: Bearer <token>  │
│    },                               │
│    body: JSON.stringify(payload)    │
│  })                                 │
└────┬────────────────────────────────┘
     │
     │ HTTP REQUEST
     ▼
┌─────────────────────────────────────┐
│  Backend - routers/samples.py       │
│  register_sample(...)               │
│                                     │
│  1. Validate auth token             │
│  2. Check position available        │
│     storage_manager.validate_...()  │
│  3. Create BioSampleDB record       │
│  4. Commit to database              │
│  5. Occupy position                 │
│     storage_manager.occupy_...()    │
│  6. Emit audit event                │
│  7. Return BioSample response       │
└────┬────────────────────────────────┘
     │
     │ 201 CREATED
     ▼
┌─────────────────────────────────────┐
│  App.vue - Success Handler          │
│                                     │
│  1. Set submitSuccess = true        │
│  2. Reset form                      │
│  3. Clear selected position         │
│  4. Call reload() to refresh grid   │
│  5. Show success message 3s         │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  useBoxOccupancy - reload()         │
│                                     │
│  GET /boxes/BOX_001/occupancy       │
│  → Updates occupancy array          │
│  → Position "A5" now shows gray     │
└─────────────────────────────────────┘
```

---

## Position Index Calculation

### Visual Example: 10×10 Grid

```
     1   2   3   4   5   6   7   8   9  10
   ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
 A │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 B │10 │11 │12 │13 │14 │15 │16 │17 │18 │19 │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 C │20 │21 │22 │23 │24 │25 │26 │27 │28 │29 │
   ├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
 D │30 │31 │32 │33 │34 │35 │36 │37 │38 │39 │
   └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
```

**Examples:**
- `A1` → `(0 × 10) + 0 = 0`
- `A5` → `(0 × 10) + 4 = 4`
- `B1` → `(1 × 10) + 0 = 10`
- `B5` → `(1 × 10) + 4 = 14`
- `C3` → `(2 × 10) + 2 = 22`

**Code:**
```javascript
const getPositionIndex = (label, cols) => {
  const row = label.charCodeAt(0) - 65  // A=0, B=1, C=2...
  const col = parseInt(label.slice(1)) - 1  // 1→0, 2→1, 3→2...
  return (row * cols) + col
}
```

---

## Component Communication

```
App.vue
  │
  ├─ props ──────────▶ PositionGrid
  │   boxId="BOX_001"
  │
  ├─ @select ◀─────── PositionGrid
  │   emit('select', 'A5')
  │
  ├─ uses ──────────▶ useBoxOccupancy
  │   const { reload, columns } = useBoxOccupancy(boxId)
  │
  └─ uses ──────────▶ api.registerSample()
      await registerSample(payload)
```

---

## State Management

### App.vue State

| State | Type | Purpose |
|-------|------|---------|
| `boxId` | Ref<string> | Current box ID |
| `selectedPosition` | Ref<string?> | User-selected position (e.g., "A5") |
| `siteId`, `freezerId`, `rackId` | Ref<string> | Storage hierarchy IDs |
| `sampleForm` | Ref<object> | Form field values |
| `submitting` | Ref<boolean> | Submit loading state |
| `submitError` | Ref<string?> | Error message |
| `submitSuccess` | Ref<boolean> | Success flag |

### useBoxOccupancy State

| State | Type | Purpose |
|-------|------|---------|
| `loading` | Ref<boolean> | Fetch loading state |
| `error` | Ref<string?> | Fetch error message |
| `rows` | Ref<number> | Grid row count |
| `columns` | Ref<number> | Grid column count |
| `occupancy` | Ref<number[]> | Array of 0/1 (available/occupied) |
| `positions` | Ref<string[]> | Position labels ["A1", "A2", ...] |
| `occupiedPositions` | Ref<object> | Map: position → sample UUID |
| `gridRows` | ComputedRef | 2D array of positions by row |

---

## API Response Schemas

### BoxOccupancy Response
```typescript
{
  box_id: string
  box_name: string
  site_id: string
  freezer_id: string
  rack_id: string
  template: {
    template_id: string
    rows: number
    columns: number
    total_positions: number
  }
  statistics: {
    total_positions: number
    occupied: number
    available: number
    utilization_percentage: number
  }
  positions: string[]              // ["A1", "A2", ...]
  occupancy: number[]              // [1, 0, 1, ...] parallel to positions
  occupied_positions: {
    [position: string]: string     // position → sample UUID
  }
}
```

### BioSample Response
```typescript
{
  uuid: string
  site_id: string
  sample_category_id: string
  sample_serial_no: string
  sample_label: string
  storage_location: {
    site: string
    freezer: string
    rack: string
    box: string
    position: number
  }
  collection_date: string          // YYYY-MM-DD
  collection_time: string | null   // HH:MM:SS
  researcher_info: string
  field_collector_info: string
  barcode_qr_code: string | null
  system_date_time: string         // ISO 8601
  status: string
  free_fields: object | null
}
```

---

## Error Handling Flow

```
User Action
    │
    ▼
Form Validation ──────────────▶ Error Display
    │ invalid                   (Red alert box)
    │
    ▼ valid
API Request
    │
    ├─▶ Network Error ─────────▶ Error Display
    │                            "Failed to connect"
    │
    ├─▶ 401 Unauthorized ──────▶ Error Display
    │                            "Invalid token"
    │
    ├─▶ 400 Bad Request ───────▶ Error Display
    │                            "Position not available"
    │
    └─▶ 201 Created ───────────▶ Success Display
                                 (Green alert box)
                                 + Grid Refresh
                                 + Form Reset
```

---

## Security Considerations

1. **JWT Authentication**: All API requests require valid Bearer token
2. **Position Validation**: Backend validates position availability before storage
3. **Database Constraints**: Unique constraints on serial numbers and barcodes
4. **Audit Trail**: BIOSAMPLE_REGISTERED events logged for compliance
5. **Input Sanitization**: Form inputs validated on both client and server

---

## Performance Optimizations

1. **Auto-reload**: Grid refreshes only after successful registration
2. **Computed Properties**: `gridRows` computed once per occupancy change
3. **Reactive Watchers**: `useBoxOccupancy` auto-fetches on boxId change
4. **Parallel API Calls**: Can fetch multiple boxes simultaneously
5. **Local State**: Form state kept in component (no global store needed)

---

## Extension Points

### Add More Storage Hierarchy Selectors

```vue
<!-- In App.vue -->
<select v-model="siteId">
  <option v-for="site in sites" :value="site.site_id">
    {{ site.site_name }}
  </option>
</select>
```

### Add Barcode Scanner

```vue
<!-- In App.vue -->
<input
  v-model="sampleForm.barcodeQrCode"
  @input="handleBarcodeInput"
  placeholder="Scan barcode..."
/>
```

### Add Sample Search

```javascript
// In api.js
export const searchSamples = async (query) => {
  return apiRequest(`/samples/?search=${query}`)
}
```

---

For implementation details, see:
- [README_INTEGRATION.md](README_INTEGRATION.md) - Full documentation
- [QUICK_START.md](QUICK_START.md) - Quick setup guide
