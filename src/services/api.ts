/**
 * Centralized API client for CampusConnect
 * Seamlessly handles JWT tokens, offline cache fallback, and server communication
 */

const BASE_URL = '' // Uses Vite /api proxy or relative path on Vercel

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export function getToken(): string | null {
  return localStorage.getItem('campusconnect_jwt')
}

export function setToken(token: string) {
  localStorage.setItem('campusconnect_jwt', token)
}

export function clearToken() {
  localStorage.removeItem('campusconnect_jwt')
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers || {})

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Only set application/json if not uploading FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const url = `${BASE_URL}${endpoint}`

  try {
    const res = await fetch(url, { ...options, headers })

    if (res.status === 401) {
      // If unauthorized and not on login page, optional redirect or notify
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/verify')) {
        console.warn('Session expired or unauthorized request to:', endpoint)
      }
    }

    if (!res.ok) {
      let errMessage = 'Request failed'
      try {
        const errorData = await res.json()
        errMessage = errorData.error || errorData.message || errMessage
      } catch {
        errMessage = res.statusText || errMessage
      }
      throw new ApiError(errMessage, res.status)
    }

    // Try parsing JSON, otherwise return null or text
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return (await res.json()) as T
    }
    return {} as T
  } catch (err: any) {
    if (err instanceof ApiError) throw err
    // Network offline / connection failed
    console.warn(`[API] Network request to ${endpoint} failed, offline mode active.`, err)
    throw new ApiError('Unable to connect to server. Check your connection or offline cache.', 0)
  }
}
