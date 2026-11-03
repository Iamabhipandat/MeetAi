import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi } from '../lib/api'
import type { User } from '../lib/types'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<{ requiresVerification: boolean }>
  logout: () => void
  setUserFromToken: (data: { access_token: string; user: User }) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authApi.me()
        .then(r => setUser(r.data))
        .catch(() => { setToken(null); localStorage.removeItem('token') })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const r = await authApi.login(email, password)
    const { access_token, user: u } = r.data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    setUser(u)
  }

  const register = async (name: string, email: string, password: string) => {
    const r = await authApi.register(name, email, password)
    // Dev mode: backend returns access_token directly → auto login
    if (r.data.access_token) {
      localStorage.setItem('token', r.data.access_token)
      setToken(r.data.access_token)
      setUser(r.data.user)
      return { requiresVerification: false }
    }
    // Production: backend returns { message, email } → show check-email screen
    return { requiresVerification: true }
  }

  const setUserFromToken = (data: { access_token: string; user: User }) => {
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, setUserFromToken, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
