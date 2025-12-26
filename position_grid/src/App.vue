<script setup>
import { ref, computed } from 'vue'
import PositionGrid from '@/components/PositionGrid.vue'
import LoginPrompt from '@/components/LoginPrompt.vue'
import { useBoxOccupancy } from '@/composables/useBoxOccupancy'
import { registerSample } from '@/services/api'

// Form state
const boxId = ref('BOX_001')
const selectedPosition = ref(null)
const siteId = ref('SITE01')
const freezerId = ref('FRZ01')
const rackId = ref('RACK01')

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

// Get reload function from composable
const { reload, columns } = useBoxOccupancy(boxId)

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
    await reload()

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
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Sample Registration</h1>

      <!-- Authentication Status -->
      <LoginPrompt />

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Position Grid -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Select Storage Position</h2>

          <PositionGrid
            :boxId="boxId"
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
