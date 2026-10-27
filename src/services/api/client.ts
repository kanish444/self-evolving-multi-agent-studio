const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options
  
  // Build target request URL
  let url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== 'ALL') {
        searchParams.append(key, String(val))
      }
    })
    const queryStr = searchParams.toString()
    if (queryStr) {
      url += `?${queryStr}`
    }
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('se_maestro_auth_token') : null
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(headers as Record<string, string> || {})
  }

  try {
    const response = await fetch(url, {
      headers: defaultHeaders,
      ...rest
    })

    if (!response.ok) {
      let errorDetail = `HTTP Error ${response.status}`
      try {
        const errJson = await response.json()
        errorDetail = errJson.detail || errJson.message || errorDetail
      } catch {
        // Fallback to text if JSON parsing fails
        try {
          const errText = await response.text()
          if (errText) errorDetail = errText
        } catch {}
      }
      throw new Error(errorDetail)
    }

    if (response.status === 204) {
      return {} as T
    }

    return await response.json() as T
  } catch (error: any) {
    // Wrap network errors clearly so pages don't crash
    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error('Backend service unavailable.')
    }
    throw error
  }
}
