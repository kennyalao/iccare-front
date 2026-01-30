// src/composables/useBoxOccupancy.js
import { ref, computed, watch, onUnmounted } from 'vue'

export function useBoxOccupancy(boxIdRef, siteIdRef, freezerIdRef, rackIdRef, autoRefreshInterval = 600000) {
  const loading = ref(true)
  const error = ref(null)

  const rows = ref(0)
  const columns = ref(0)
  const occupancy = ref([])
  const positions = ref([])
  const occupiedPositions = ref({})

  const API_BASE = 'https://iccare.desmarttrader.com/biospecimen/attributes'

  let refreshTimer = null

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
  const load = async (isBackgroundRefresh = false) => {
    if (!boxIdRef.value) return

    try {
      // Only show loading spinner on initial load, not background refreshes
      if (!isBackgroundRefresh) {
        loading.value = true
      }
      error.value = null

      // Build query parameters
      const params = new URLSearchParams()
      if (siteIdRef?.value) params.append('site_id', siteIdRef.value)
      if (freezerIdRef?.value) params.append('freezer_id', freezerIdRef.value)
      if (rackIdRef?.value) params.append('rack_id', rackIdRef.value)

      const queryString = params.toString()
      const url = `${API_BASE}/boxes/${boxIdRef.value}/occupancy${queryString ? `?${queryString}` : ''}`

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        }
      })

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
      if (!isBackgroundRefresh) {
        loading.value = false
      }
    }
  }

  /**
   * Start auto-refresh
   */
  const startAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }
    if (autoRefreshInterval > 0) {
      refreshTimer = setInterval(() => {
        load(true) // Background refresh - won't show loading spinner
      }, autoRefreshInterval)
    }
  }

  /**
   * Stop auto-refresh
   */
  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  /**
   * Auto-refresh when boxId or storage location changes
   */
  watch([boxIdRef, siteIdRef, freezerIdRef, rackIdRef], async () => {
    stopAutoRefresh()
    await load()
    startAutoRefresh()
  }, { immediate: true })

  /**
   * Cleanup on unmount
   */
  onUnmounted(() => {
    stopAutoRefresh()
  })

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
    reload: load,
    startAutoRefresh,
    stopAutoRefresh
  }
}
