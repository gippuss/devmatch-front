import { authStorage } from './authStorage'
import { ApiException } from './error'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

let refreshPromise: Promise<void> | null = null

async function refreshTokens(): Promise<void> {
  const refresh = authStorage.getRefresh()
  if (!refresh) throw new Error('No refresh token')

  const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  })

  if (!res.ok) {
    authStorage.clear()
    window.location.href = '/login'
    throw new Error('Refresh failed')
  }

  const data = await res.json()
  authStorage.set(data.token.access_token, data.token.refresh_token)
}

async function request<T>(path: string, options: RequestInit = {}, retry = true, skipContentType = false): Promise<T> {
  const access = authStorage.getAccess()
  const headers: Record<string, string> = {
    ...(skipContentType ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }
  if (access) headers['Authorization'] = `Bearer ${access}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401 && retry) {
    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => {
        refreshPromise = null
      })
    }
    await refreshPromise
    return request<T>(path, options, false, skipContentType)
  }

  if (res.status === 204) return undefined as T

  const body = await res.json()

  if (!res.ok) {
    const code = body?.error?.code ?? 'unknown_error'
    const message = body?.error?.message ?? 'Unknown error'
    throw new ApiException(code, message, res.status)
  }

  return body as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', body: form }, true, true),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
