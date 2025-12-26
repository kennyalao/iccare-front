<script setup>
import { ref, toRef } from 'vue'
import { useBoxOccupancy } from '@/composables/useBoxOccupancy'

const emit = defineEmits(['select'])

const props = defineProps({
  boxId: {
    type: String,
    required: true
  }
})

const selectedPosition = ref(null)

// 🔗 composable
const {
  loading,
  error,
  gridRows,
  occupancy,
  columns,
  occupiedPositions
} = useBoxOccupancy(toRef(props, 'boxId'))
</script>


<template>
  <div class="space-y-4">
    <!-- Breadcrumb -->
    <div class="text-xs text-gray-600 flex items-center gap-1 flex-wrap">
      <span>Site</span><span>›</span>
      <span>Freezer</span><span>›</span>
      <span>Rack</span><span>›</span>
      <span>Box</span><span>›</span>
      <span class="font-semibold text-blue-600">Position</span>
    </div>

    <!-- Status -->
    <div v-if="loading" class="text-sm text-gray-500">Loading positions…</div>
    <div v-if="error" class="text-sm text-red-500">{{ error }}</div>

    <!-- Grid -->
    <div v-if="!loading && !error" class="overflow-x-auto bg-gray-25 p-3 rounded-lg">
      <div class="grid gap-2">
        <div
          v-for="(row, rIndex) in gridRows"
          :key="rIndex"
          class="flex gap-2"
        >
      <button
          v-for="(pos, cIndex) in row"
          :key="pos"
          :disabled="occupancy[rIndex * columns + cIndex] === 1"
          @click="
            selectedPosition = pos;
            emit('select', pos)
          "
          :title="
            occupiedPositions[pos]
              ? `Sample ID: ${occupiedPositions[pos]}`
              : ''
          "
          class="w-10 h-10 md:w-12 md:h-12 text-xs font-semibold rounded-lg border transition-all"
          :class="[
            occupancy[rIndex * columns + cIndex] === 1
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:shadow-md',
            selectedPosition === pos ? 'ring-2 ring-blue-500' : ''
          ]"
        >
          {{ pos }}
        </button>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex gap-6 text-xs">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 bg-white border rounded"></div>
        <span>Available</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 bg-gray-300 border rounded"></div>
        <span>Occupied</span>
      </div>
    </div>
  </div>
</template>
