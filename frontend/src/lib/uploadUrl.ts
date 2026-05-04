// Converts a stored path like /uploads/file.jpg to the full backend URL
// This is needed because files are served by the backend (port 3001), not the frontend (5173)
const API_BASE = (import.meta as any).env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'

export const uploadUrl = (path: string | null | undefined): string | null => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}
