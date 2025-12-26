<script setup>
import { ref } from 'vue'
import PositionGrid from '@/components/PositionGrid.vue'
import { useBoxOccupancy } from '@/composables/useBoxOccupancy'

const boxId = ref('BOX_001')
const selectedPosition = ref(null)

const { reload } = useBoxOccupancy(boxId)

/**
 * Convert A1 → index
 */
const computePositionIndex = (pos, columns) => {
  const rowChar = pos.charAt(0)
  const colNumber = parseInt(pos.slice(1), 10)
  const rowIndex = rowChar.charCodeAt(0) - 65
  return (rowIndex * columns) + (colNumber - 1)
}

/**
 * Submit sample to backend
 */
const submitSample = async () => {
  if (!selectedPosition.value) return alert('Select a position')

  const columns = 10 // from template TMPL_5x10
  const positionIndex = computePositionIndex(
    selectedPosition.value,
    columns
  )

  const payload = {
    sample_id: crypto.randomUUID(),
    box_id: boxId.value,
    position_label: selectedPosition.value,
    position_index: positionIndex,
    sample_category_id: 'CAT_BLOOD'
  }

  const res = await fetch(
    'https://iccare.desmarttrader.com/biospecimen/samples/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(payload)
    }
  )

  if (!res.ok) {
    throw new Error('Failed to store sample')
  }

  // 🔄 Refresh grid after successful insert
  reload()
  selectedPosition.value = null
}
</script>

<template>
  <PositionGrid
    :boxId="boxId"
    @select="selectedPosition = $event"
  />

  <div class="mt-4 flex items-center gap-4">
    <span class="text-sm">
      Selected:
      <strong>{{ selectedPosition || 'None' }}</strong>
    </span>

    <button
      class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      :disabled="!selectedPosition"
      @click="submitSample"
    >
      Store Sample
    </button>
  </div>
</template>
