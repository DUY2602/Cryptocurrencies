/**
 * API service placeholder for Stage 2 integration.
 * Real HTTP requests will be implemented here later.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com'

export const api = {
  baseUrl: API_BASE_URL,

  async getCoins() {
    // Stage 2: replace with real fetch
    console.warn('[api] getCoins() not implemented — use local data for now')
    return []
  },

  async getNews() {
    // Stage 2: replace with real fetch
    console.warn('[api] getNews() not implemented — use local data for now')
    return []
  },
}

export default api
