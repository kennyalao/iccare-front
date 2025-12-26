# Usage Examples

## Example 1: Basic Sample Registration

### Scenario
Register a blood sample in position B5 of box BOX_001.

### Steps
1. Set authentication token:
```javascript
localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
```

2. Open application (grid loads automatically)

3. Click position **B5** (row B, column 5)

4. Fill form:
   - Sample Serial No: `BLOOD-2025-001`
   - Sample Label: `Blood Sample - Patient 001`
   - Sample Category: `Blood`
   - Collection Date: `2025-12-26`
   - Collection Time: `14:30`
   - Researcher Info: `Dr. Jane Smith - Hematology Lab`
   - Field Collector Info: `Nurse John Doe - Collection Station 3`

5. Click "Register Sample"

6. Result:
   - Success message appears (green)
   - Grid refreshes (B5 turns gray)
   - Form resets to defaults

---

## Example 2: Programmatic Registration

### Use Case
Register samples via JavaScript (e.g., batch import, barcode scanner).

```javascript
import { registerSample } from '@/services/api'

async function registerFromBarcode(barcodeData) {
  try {
    const sample = await registerSample({
      site_id: 'SITE01',
      sample_category_id: 'CAT_BLOOD',
      sample_serial_no: barcodeData.serialNo,
      sample_label: barcodeData.label,
      storage_location: {
        site: 'SITE01',
        freezer: 'FRZ01',
        rack: 'RACK01',
        box: 'BOX_001',
        position: 42  // Pre-calculated position index
      },
      collection_date: barcodeData.collectionDate,
      collection_time: null,
      researcher_info: 'Dr. Smith',
      field_collector_info: 'Auto-scanner Station 1',
      free_fields: {
        barcode: barcodeData.barcode,
        batch_id: barcodeData.batchId
      }
    })

    console.log('Registered:', sample.uuid)
    return sample
  } catch (error) {
    console.error('Registration failed:', error.message)
    throw error
  }
}

// Usage
registerFromBarcode({
  serialNo: 'SCAN-001',
  label: 'Blood Sample',
  collectionDate: '2025-12-26',
  barcode: '1234567890',
  batchId: 'BATCH-001'
})
```

---

## Example 3: Batch Registration

### Use Case
Register multiple samples at once (e.g., CSV import).

```javascript
import { registerSample } from '@/services/api'

async function batchRegisterSamples(samples) {
  const results = []

  for (const sample of samples) {
    try {
      const result = await registerSample({
        site_id: sample.site_id,
        sample_category_id: sample.category_id,
        sample_serial_no: sample.serial_no,
        sample_label: sample.label,
        storage_location: {
          site: sample.site_id,
          freezer: sample.freezer_id,
          rack: sample.rack_id,
          box: sample.box_id,
          position: sample.position_index
        },
        collection_date: sample.collection_date,
        collection_time: sample.collection_time,
        researcher_info: sample.researcher,
        field_collector_info: sample.collector,
        free_fields: sample.metadata || {}
      })

      results.push({ success: true, sample: result })
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        serial_no: sample.serial_no
      })
    }
  }

  return results
}

// Usage
const samplesFromCSV = [
  {
    serial_no: 'CSV-001',
    label: 'Sample 1',
    category_id: 'CAT_BLOOD',
    site_id: 'SITE01',
    freezer_id: 'FRZ01',
    rack_id: 'RACK01',
    box_id: 'BOX_001',
    position_index: 0,  // A1
    collection_date: '2025-12-26',
    collection_time: '09:00:00',
    researcher: 'Dr. Smith',
    collector: 'Nurse Doe'
  },
  {
    serial_no: 'CSV-002',
    label: 'Sample 2',
    category_id: 'CAT_URINE',
    site_id: 'SITE01',
    freezer_id: 'FRZ01',
    rack_id: 'RACK01',
    box_id: 'BOX_001',
    position_index: 1,  // A2
    collection_date: '2025-12-26',
    collection_time: '09:15:00',
    researcher: 'Dr. Smith',
    collector: 'Nurse Doe'
  }
]

const results = await batchRegisterSamples(samplesFromCSV)
console.log('Success:', results.filter(r => r.success).length)
console.log('Failed:', results.filter(r => !r.success).length)
```

---

## Example 4: Custom Position Grid Component

### Use Case
Create a read-only position grid for viewing box occupancy.

```vue
<script setup>
import { toRef } from 'vue'
import { useBoxOccupancy } from '@/composables/useBoxOccupancy'

const props = defineProps({
  boxId: String
})

const { loading, gridRows, occupancy, columns, occupiedPositions } =
  useBoxOccupancy(toRef(props, 'boxId'))
</script>

<template>
  <div class="occupancy-viewer">
    <h3>Box {{ boxId }} Occupancy</h3>

    <div v-if="loading">Loading...</div>

    <div v-else class="grid-display">
      <div v-for="(row, rIdx) in gridRows" :key="rIdx" class="row">
        <div
          v-for="(pos, cIdx) in row"
          :key="pos"
          :class="['cell', { occupied: occupancy[rIdx * columns + cIdx] === 1 }]"
          :title="occupiedPositions[pos] ? `Sample: ${occupiedPositions[pos]}` : 'Available'"
        >
          {{ pos }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-display {
  display: inline-block;
  border: 1px solid #ccc;
  padding: 8px;
}

.row {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.cell {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  background: white;
  font-size: 12px;
  font-weight: bold;
}

.cell.occupied {
  background: #e0e0e0;
  color: #666;
}
</style>
```

**Usage:**
```vue
<OccupancyViewer boxId="BOX_001" />
```

---

## Example 5: Multi-Box Registration Workflow

### Use Case
Allow users to select box dynamically before choosing position.

```vue
<script setup>
import { ref, watch } from 'vue'
import PositionGrid from '@/components/PositionGrid.vue'
import { getBoxes } from '@/services/api'

const rackId = ref('RACK01')
const selectedBox = ref(null)
const selectedPosition = ref(null)
const boxes = ref([])

// Fetch boxes for selected rack
watch(rackId, async (newRackId) => {
  const response = await getBoxes(newRackId)
  boxes.value = response.boxes
  selectedBox.value = null
  selectedPosition.value = null
})

// Load initial boxes
getBoxes(rackId.value).then(res => boxes.value = res.boxes)
</script>

<template>
  <div class="multi-box-workflow">
    <!-- Step 1: Select Box -->
    <div class="step">
      <h3>Step 1: Select Box</h3>
      <select v-model="selectedBox">
        <option :value="null">-- Select a box --</option>
        <option v-for="box in boxes" :key="box.box_id" :value="box.box_id">
          {{ box.box_name }} ({{ box.box_id }})
        </option>
      </select>
    </div>

    <!-- Step 2: Select Position -->
    <div v-if="selectedBox" class="step">
      <h3>Step 2: Select Position</h3>
      <PositionGrid
        :boxId="selectedBox"
        @select="selectedPosition = $event"
      />
    </div>

    <!-- Step 3: Show Selection -->
    <div v-if="selectedPosition" class="step">
      <h3>Step 3: Confirm</h3>
      <p>Box: <strong>{{ selectedBox }}</strong></p>
      <p>Position: <strong>{{ selectedPosition }}</strong></p>
      <button @click="submitSample">Register Sample</button>
    </div>
  </div>
</template>
```

---

## Example 6: Position Validation Before Form

### Use Case
Prevent users from filling form until valid position is selected.

```vue
<script setup>
import { ref, computed } from 'vue'
import PositionGrid from '@/components/PositionGrid.vue'

const selectedPosition = ref(null)
const formData = ref({
  serialNo: '',
  label: ''
})

const canShowForm = computed(() => selectedPosition.value !== null)
const canSubmit = computed(() =>
  canShowForm.value &&
  formData.value.serialNo &&
  formData.value.label
)
</script>

<template>
  <div>
    <!-- Always show grid -->
    <PositionGrid boxId="BOX_001" @select="selectedPosition = $event" />

    <!-- Only show form after position selected -->
    <div v-if="!canShowForm" class="warning">
      ⚠️ Please select a position first
    </div>

    <form v-else @submit.prevent="submitSample">
      <h3>Position {{ selectedPosition }} Selected</h3>

      <input v-model="formData.serialNo" placeholder="Serial Number" required />
      <input v-model="formData.label" placeholder="Label" required />

      <button :disabled="!canSubmit">Register Sample</button>
    </form>
  </div>
</template>
```

---

## Example 7: Position Auto-Selection (Next Available)

### Use Case
Automatically select the next available position.

```javascript
import { ref } from 'vue'
import { useBoxOccupancy } from '@/composables/useBoxOccupancy'

const boxId = ref('BOX_001')
const { positions, occupancy } = useBoxOccupancy(boxId)

// Find next available position
const getNextAvailablePosition = () => {
  for (let i = 0; i < occupancy.value.length; i++) {
    if (occupancy.value[i] === 0) {
      return positions.value[i]  // e.g., "A1", "A2", etc.
    }
  }
  return null  // Box is full
}

// Usage
const nextPos = getNextAvailablePosition()
if (nextPos) {
  console.log('Next available:', nextPos)
} else {
  alert('Box is full!')
}
```

**With Component:**
```vue
<script setup>
import { ref, watchEffect } from 'vue'
import { useBoxOccupancy } from '@/composables/useBoxOccupancy'

const boxId = ref('BOX_001')
const autoPosition = ref(null)
const { positions, occupancy } = useBoxOccupancy(boxId)

// Auto-select next available whenever occupancy changes
watchEffect(() => {
  for (let i = 0; i < occupancy.value.length; i++) {
    if (occupancy.value[i] === 0) {
      autoPosition.value = positions.value[i]
      return
    }
  }
  autoPosition.value = null
})
</script>

<template>
  <div>
    <div v-if="autoPosition">
      Auto-selected position: <strong>{{ autoPosition }}</strong>
      <button @click="registerAtPosition(autoPosition)">
        Register Here
      </button>
    </div>
    <div v-else class="error">
      ⚠️ Box is full! No available positions.
    </div>
  </div>
</template>
```

---

## Example 8: Real-time Occupancy Updates

### Use Case
Poll for occupancy updates every 30 seconds.

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useBoxOccupancy } from '@/composables/useBoxOccupancy'

const boxId = ref('BOX_001')
const { reload, statistics } = useBoxOccupancy(boxId)

let intervalId = null

onMounted(() => {
  // Refresh every 30 seconds
  intervalId = setInterval(() => {
    reload()
    console.log('Refreshed occupancy')
  }, 30000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<template>
  <div>
    <h3>Live Occupancy Monitor</h3>
    <p>Occupied: {{ statistics.occupied }} / {{ statistics.total_positions }}</p>
    <p>Utilization: {{ statistics.utilization_percentage }}%</p>
    <button @click="reload">Refresh Now</button>
  </div>
</template>
```

---

## Example 9: Error Recovery

### Use Case
Handle common errors gracefully.

```javascript
import { registerSample } from '@/services/api'

async function registerWithRetry(payload, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await registerSample(payload)
      return { success: true, data: result }
    } catch (error) {
      const errorMsg = error.message.toLowerCase()

      // Position occupied - don't retry
      if (errorMsg.includes('not available') || errorMsg.includes('occupied')) {
        return {
          success: false,
          error: 'Position already occupied',
          retryable: false
        }
      }

      // Duplicate serial number - don't retry
      if (errorMsg.includes('already exists')) {
        return {
          success: false,
          error: 'Serial number already exists',
          retryable: false
        }
      }

      // Network error - retry
      if (errorMsg.includes('failed to fetch') || errorMsg.includes('network')) {
        if (attempt < maxRetries) {
          console.log(`Network error, retrying (${attempt}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
      }

      // Other errors
      return {
        success: false,
        error: error.message,
        retryable: true
      }
    }
  }

  return {
    success: false,
    error: 'Max retries exceeded',
    retryable: false
  }
}

// Usage
const result = await registerWithRetry(payload)
if (!result.success) {
  if (result.retryable) {
    console.log('Retryable error:', result.error)
  } else {
    console.log('Permanent error:', result.error)
  }
}
```

---

## Example 10: Custom Metadata Fields

### Use Case
Add study-specific metadata to samples.

```vue
<script setup>
import { ref } from 'vue'
import { registerSample } from '@/services/api'

const metadata = ref({
  patientId: '',
  studyArm: 'Control',
  visitNumber: 1,
  timepoint: 'Baseline',
  processedBy: 'Lab Tech A',
  storageTemp: '-80C',
  notes: ''
})

const submitWithMetadata = async () => {
  await registerSample({
    // ... standard fields ...
    free_fields: {
      patient_id: metadata.value.patientId,
      study_arm: metadata.value.studyArm,
      visit_number: metadata.value.visitNumber,
      timepoint: metadata.value.timepoint,
      processed_by: metadata.value.processedBy,
      storage_temperature: metadata.value.storageTemp,
      notes: metadata.value.notes
    }
  })
}
</script>

<template>
  <form @submit.prevent="submitWithMetadata">
    <h3>Study Metadata</h3>

    <input v-model="metadata.patientId" placeholder="Patient ID" required />

    <select v-model="metadata.studyArm">
      <option value="Control">Control</option>
      <option value="Treatment A">Treatment A</option>
      <option value="Treatment B">Treatment B</option>
    </select>

    <input v-model.number="metadata.visitNumber" type="number" min="1" />

    <select v-model="metadata.timepoint">
      <option value="Baseline">Baseline</option>
      <option value="Week 4">Week 4</option>
      <option value="Week 8">Week 8</option>
      <option value="Final">Final</option>
    </select>

    <textarea v-model="metadata.notes" placeholder="Notes"></textarea>

    <button type="submit">Register Sample</button>
  </form>
</template>
```

---

## Testing Examples

### Unit Test (Vitest)

```javascript
import { describe, it, expect, vi } from 'vitest'
import { registerSample } from '@/services/api'

// Mock fetch
global.fetch = vi.fn()

describe('registerSample', () => {
  it('should register sample successfully', async () => {
    const mockResponse = {
      uuid: 'test-uuid',
      sample_serial_no: 'TEST-001'
    }

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const result = await registerSample({
      sample_serial_no: 'TEST-001',
      // ... other fields
    })

    expect(result.uuid).toBe('test-uuid')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/samples/'),
      expect.objectContaining({
        method: 'POST'
      })
    )
  })

  it('should handle errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Position not available' })
    })

    await expect(registerSample({})).rejects.toThrow('Position not available')
  })
})
```

---

For more details, see:
- [README_INTEGRATION.md](README_INTEGRATION.md) - Full documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [QUICK_START.md](QUICK_START.md) - Getting started
