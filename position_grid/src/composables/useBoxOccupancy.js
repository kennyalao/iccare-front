// src/composables/useBoxOccupancy.js
import { ref, computed, watch } from 'vue'

export function useBoxOccupancy(boxIdRef) {
  const loading = ref(true)
  const error = ref(null)

  const rows = ref(0)
  const columns = ref(0)
  const occupancy = ref([])
  const positions = ref([])
  const occupiedPositions = ref({})

  const API_BASE = 'https://iccare.desmarttrader.com/biospecimen/attributes'

  /**
   * Helpers
   */
  const generatePositions = (rows, cols) => {
    const list = []
    for (let r = 0; r < rows; r++) {
      const rowLabel = String.fromCharCode(65 + r)
      for (let c = 1; c <= cols; c++) {
        list.push(`${rowLabel}${c}`)
      }
    }
    return list
  }

  /**
   * Computed grid rows
   */
  const gridRows = computed(() => {
    const result = []
    for (let r = 0; r < rows.value; r++) {
      result.push(
        positions.value.slice(r * columns.value, (r + 1) * columns.value)
      )
    }
    return result
  })

  /**
   * Fetch occupancy
   */
  const load = async () => {
    if (!boxIdRef.value) return

    try {
      loading.value = true
      error.value = null

      const res = await fetch(
        `${API_BASE}/boxes/${boxIdRef.value}/occupancy`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
          }
        }
      )

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()

      rows.value = data.template.rows
      columns.value = data.template.columns
      occupancy.value = data.occupancy
      occupiedPositions.value = data.occupied_positions || {}

      positions.value = generatePositions(rows.value, columns.value)
    } catch (e) {
      console.error(e)
      error.value = 'Failed to load box occupancy'
    } finally {
      loading.value = false
    }
  }

  /**
   * Auto-refresh when boxId changes
   */
  watch(boxIdRef, load, { immediate: true })

  return {
    // state
    loading,
    error,
    rows,
    columns,
    occupancy,
    positions,
    occupiedPositions,

    // computed
    gridRows,

    // actions
    reload: load
  }
}
