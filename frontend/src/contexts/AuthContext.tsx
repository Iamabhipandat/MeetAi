import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../lib/types'

interface AuthContextType {
  user: User
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<{ requiresVerification: boolean }>
  logout: () => void
  setUserFromToken: (data: { access_token: string; user: User }) => void
  loading: boolean
}

// Default guest identity (like Google Meet where anyone can join immediately)
const defaultGuestUser: User = {
  id: 1,
  name: localStorage.getItem('meet_user_name') || 'Participant',
  email: 'guest@meetai.local',
  is_active: true,
  is_verified: true,
  created_at: new Date().toISOString()
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultGuestUser)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token') || 'guest-token')
  const [loading, setLoading] = useState(false)

  const login = async () => {}
  const register = async () => ({ requiresVerification: false })

  const setUserFromToken = (data: { access_token: string; user: User }) => {
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
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
