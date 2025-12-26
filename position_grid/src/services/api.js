// src/services/api.js
const API_BASE = 'https://iccare.desmarttrader.com/biospecimen'

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    console.error('❌ Authentication token not found!')
    console.log('💡 Set token: localStorage.setItem("access_token", "your-token-here")')
    throw new Error('Authentication token not found. Please login first.')
  }
  return token
}

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Register a new biosample with storage position
 */
export const registerSample = async (sampleData) => {
  return apiRequest('/samples/', {
    method: 'POST',
    body: JSON.stringify(sampleData)
  })
}

/**
 * Get box occupancy data
 */
export const getBoxOccupancy = async (boxId) => {
  return apiRequest(`/attributes/boxes/${boxId}/occupancy`)
}

/**
 * List available sites
 */
export const getSites = async () => {
  return apiRequest('/attributes/sites/')
}

/**
 * List freezers by site
 */
export const getFreezers = async (siteId) => {
  return apiRequest(`/attributes/freezers/?site_id=${siteId}`)
}

/**
 * List racks by freezer
 */
export const getRacks = async (freezerId) => {
  return apiRequest(`/attributes/racks/?freezer_id=${freezerId}`)
}

/**
 * List boxes by rack
 */
export const getBoxes = async (rackId) => {
  return apiRequest(`/attributes/boxes/?rack_id=${rackId}`)
}

/**
 * List sample categories
 */
export const getSampleCategories = async () => {
  return apiRequest('/attributes/sample-categories/')
}
