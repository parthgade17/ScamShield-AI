export const API_BASE_URL: string =
  typeof import.meta.env.VITE_API_BASE_URL === 'string' && import.meta.env.VITE_API_BASE_URL !== ''
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
    : (import.meta.env.PROD ? '' : 'http://127.0.0.1:5000')
