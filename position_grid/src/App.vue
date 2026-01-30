<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import PositionGrid from '@/components/PositionGrid.vue'
import LoginPrompt from '@/components/LoginPrompt.vue'
import NotificationBell from '@/components/NotificationBell.vue'
import { useBoxOccupancy } from '@/composables/useBoxOccupancy'
import { registerSample, getSites, getFreezers, getRacks, getBoxes } from '@/services/api'

// Storage hierarchy state
const sites = ref([])
const freezers = ref([])
const racks = ref([])
const boxes = ref([])

// Form state
const boxId = ref('BOX_001')
const selectedPosition = ref(null)
const siteId = ref('SITE_001')
const freezerId = ref('FRZ_001')
const rackId = ref('RACK_001')

// Loading states
const loadingSites = ref(false)
const loadingFreezers = ref(false)
const loadingRacks = ref(false)
const loadingBoxes = ref(false)

// Sample form fields
const sampleForm = ref({
  sampleSerialNo: '',
  sampleLabel: '',
  sampleCategoryId: 'CAT_BLOOD',
  collectionDate: new Date().toISOString().split('T')[0],
  collectionTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
  researcherInfo: '',
  fieldCollectorInfo: ''
})

// UI state
const submitting = ref(false)
const submitError = ref(null)
const submitSuccess = ref(false)

// Reference to PositionGrid component
const positionGridRef = ref(null)

// Authentication token for notifications
const accessToken = ref('')

// Get columns from composable for position calculation
const { columns } = useBoxOccupancy(boxId, siteId, freezerId, rackId)

// Load storage hierarchy data
const loadSites = async () => {
  try {
    loadingSites.value = true
    const data = await getSites()
    console.log('Sites API response:', data)
    // Handle both array and object with 'sites' property
    sites.value = Array.isArray(data) ? data : (data.sites || [])
  } catch (error) {
    console.error('Failed to load sites:', error)
  } finally {
    loadingSites.value = false
  }
}

const loadFreezers = async () => {
  if (!siteId.value) {
    freezers.value = []
    return
  }
  try {
    loadingFreezers.value = true
    const data = await getFreezers(siteId.value)
    console.log('Freezers API response:', data)
    freezers.value = Array.isArray(data) ? data : (data.freezers || [])
  } catch (error) {
    console.error('Failed to load freezers:', error)
    freezers.value = []
  } finally {
    loadingFreezers.value = false
  }
}

const loadRacks = async () => {
  if (!freezerId.value) {
    racks.value = []
    return
  }
  try {
    loadingRacks.value = true
    const data = await getRacks(freezerId.value)
    console.log('Racks API response:', data)
    racks.value = Array.isArray(data) ? data : (data.racks || [])
  } catch (error) {
    console.error('Failed to load racks:', error)
    racks.value = []
  } finally {
    loadingRacks.value = false
  }
}

const loadBoxes = async () => {
  if (!rackId.value) {
    boxes.value = []
    return
  }
  try {
    loadingBoxes.value = true
    const data = await getBoxes(rackId.value)
    console.log('Boxes API response:', data)
    boxes.value = Array.isArray(data) ? data : (data.boxes || [])
  } catch (error) {
    console.error('Failed to load boxes:', error)
    boxes.value = []
  } finally {
    loadingBoxes.value = false
  }
}

// Watch for changes in the hierarchy and cascade down
watch(siteId, async (newSiteId) => {
  freezerId.value = ''
  rackId.value = ''
  boxId.value = ''
  if (newSiteId) {
    await loadFreezers()
  }
})

watch(freezerId, async (newFreezerId) => {
  rackId.value = ''
  boxId.value = ''
  if (newFreezerId) {
    await loadRacks()
  }
})

watch(rackId, async (newRackId) => {
  boxId.value = ''
  if (newRackId) {
    await loadBoxes()
  }
})

// Load initial sites on mount
onMounted(async () => {
  // Get authentication token from localStorage
  accessToken.value = localStorage.getItem('access_token') || ''

  await loadSites()
  // Load the rest of the hierarchy based on initial values
  if (siteId.value) {
    await loadFreezers()
    if (freezerId.value) {
      await loadRacks()
      if (rackId.value) {
        await loadBoxes()
      }
    }
  }
})

// Convert position label (e.g., "A5") to index
const getPositionIndex = (positionLabel, cols) => {
  const rowChar = positionLabel.charAt(0)
  const colNumber = parseInt(positionLabel.slice(1), 10)
  const rowIndex = rowChar.charCodeAt(0) - 65
  return (rowIndex * cols) + (colNumber - 1)
}

// Form validation
const isFormValid = computed(() => {
  return (
    selectedPosition.value &&
    sampleForm.value.sampleSerialNo &&
    sampleForm.value.sampleLabel &&
    sampleForm.value.collectionDate &&
    sampleForm.value.researcherInfo &&
    sampleForm.value.fieldCollectorInfo
  )
})

// Handle position selection
const handleSelect = (pos) => {
  selectedPosition.value = pos
  submitSuccess.value = false
  submitError.value = null
}

// Submit sample to backend
const submitSample = async () => {
  if (!isFormValid.value) {
    submitError.value = 'Please fill in all required fields'
    return
  }

  submitting.value = true
  submitError.value = null
  submitSuccess.value = false

  try {
    const positionIndex = getPositionIndex(selectedPosition.value, columns.value)

    const payload = {
      site_id: siteId.value,
      sample_category_id: sampleForm.value.sampleCategoryId,
      sample_serial_no: sampleForm.value.sampleSerialNo,
      sample_label: sampleForm.value.sampleLabel,
      storage_location: {
        site: siteId.value,
        freezer: freezerId.value,
        rack: rackId.value,
        box: boxId.value,
        position: positionIndex
      },
      collection_date: sampleForm.value.collectionDate,
      collection_time: sampleForm.value.collectionTime || null,
      researcher_info: sampleForm.value.researcherInfo,
      field_collector_info: sampleForm.value.fieldCollectorInfo,
      free_fields: {}
    }

    await registerSample(payload)

    // Success! Refresh grid and reset form
    submitSuccess.value = true
    selectedPosition.value = null

    // Reset form
    sampleForm.value = {
      sampleSerialNo: '',
      sampleLabel: '',
      sampleCategoryId: 'CAT_BLOOD',
      collectionDate: new Date().toISOString().split('T')[0],
      collectionTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
      researcherInfo: '',
      fieldCollectorInfo: ''
    }

    // Reload grid to show updated occupancy
    if (positionGridRef.value?.reload) {
      await positionGridRef.value.reload(false)
    }

    // Clear success message after 3 seconds
    setTimeout(() => {
      submitSuccess.value = false
    }, 3000)

  } catch (error) {
    submitError.value = error.message || 'Failed to register sample'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-4 md:p-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header with Notification Bell -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-lg font-semibold text-gray-900">Sample Box Selection</h1>
        <NotificationBell v-if="accessToken" :token="accessToken" />
      </div>

      <!-- Authentication Status -->
      <LoginPrompt />

      <!-- Storage Hierarchy Selectors -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Select Storage Location</h2>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Site Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Site *</label>
            <select
              v-model="siteId"
              :disabled="loadingSites"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">{{ loadingSites ? 'Loading...' : 'Select Site' }}</option>
              <option v-for="site in sites" :key="site.site_id" :value="site.site_id">
                {{ site.site_name }}
              </option>
            </select>
          </div>

          <!-- Freezer Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Freezer *</label>
            <select
              v-model="freezerId"
              :disabled="!siteId || loadingFreezers"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">{{ loadingFreezers ? 'Loading...' : 'Select Freezer' }}</option>
              <option v-for="freezer in freezers" :key="freezer.freezer_id" :value="freezer.freezer_id">
                {{ freezer.freezer_name }}
              </option>
            </select>
          </div>

          <!-- Rack Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rack *</label>
            <select
              v-model="rackId"
              :disabled="!freezerId || loadingRacks"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">{{ loadingRacks ? 'Loading...' : 'Select Rack' }}</option>
              <option v-for="rack in racks" :key="rack.rack_id" :value="rack.rack_id">
                {{ rack.rack_name }}
              </option>
            </select>
          </div>

          <!-- Box Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Box *</label>
            <select
              v-model="boxId"
              :disabled="!rackId || loadingBoxes"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">{{ loadingBoxes ? 'Loading...' : 'Select Box' }}</option>
              <option v-for="box in boxes" :key="box.box_id" :value="box.box_id">
                {{ box.box_name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Position Grid -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Select Storage Position</h2>

          <PositionGrid
            ref="positionGridRef"
            :boxId="boxId"
            :siteId="siteId"
            :freezerId="freezerId"
            :rackId="rackId"
            @select="handleSelect"
          />

          <div class="mt-4 text-sm">
            <span class="text-gray-600">Selected Position:</span>
            <strong class="text-blue-600 ml-2">
              {{ selectedPosition || 'None' }}
            </strong>
          </div>
        </div>

        <!-- Sample Registration Form -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Sample Information</h2>

          <form @submit.prevent="submitSample" class="space-y-4">
            <!-- Sample Serial Number -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Sample Serial No *
              </label>
              <input
                v-model="sampleForm.sampleSerialNo"
                type="text"
                required
                placeholder="e.g., SMPL-2025-001"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Sample Label -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Sample Label *
              </label>
              <input
                v-model="sampleForm.sampleLabel"
                type="text"
                required
                placeholder="e.g., Blood Sample - Patient A"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Sample Category -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Sample Category *
              </label>
              <select
                v-model="sampleForm.sampleCategoryId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CAT_BLOOD">Blood</option>
                <option value="CAT_URINE">Urine</option>
                <option value="CAT_TISSUE">Tissue</option>
                <option value="CAT_DNA">DNA</option>
                <option value="CAT_RNA">RNA</option>
              </select>
            </div>

            <!-- Collection Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Collection Date *
              </label>
              <input
                v-model="sampleForm.collectionDate"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Collection Time -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Collection Time
              </label>
              <input
                v-model="sampleForm.collectionTime"
                type="time"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Researcher Info -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Researcher Info *
              </label>
              <input
                v-model="sampleForm.researcherInfo"
                type="text"
                required
                placeholder="e.g., Dr. Smith - Lab A"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Field Collector Info -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Field Collector Info *
              </label>
              <input
                v-model="sampleForm.fieldCollectorInfo"
                type="text"
                required
                placeholder="e.g., Jane Doe - Station 3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Error Message -->
            <div
              v-if="submitError"
              class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
            >
              {{ submitError }}
            </div>

            <!-- Success Message -->
            <div
              v-if="submitSuccess"
              class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"
            >
              Sample registered successfully!
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="!isFormValid || submitting"
              class="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="submitting">Submitting...</span>
              <span v-else>Register Sample</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
