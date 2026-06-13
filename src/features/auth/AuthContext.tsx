import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User } from '@/shared/types/api'
import { authApi, meApi } from '@/shared/api/services'
import { authStorage } from '@/shared/api/authStorage'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const me = await meApi.get()
      setUser(me)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (authStorage.getAccess()) {
      refreshUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    authStorage.set(res.token.access_token, res.token.refresh_token)
    setUser(res.user)
  }

  const register = async (email: string, username: string, password: string) => {
    const res = await authApi.register(email, username, password)
    authStorage.set(res.token.access_token, res.token.refresh_token)
    setUser(res.user)
  }

  const logout = async () => {
    const refresh = authStorage.getRefresh()
    if (refresh) {
      try { await authApi.logout(refresh) } catch { /* ignore */ }
    }
    authStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
