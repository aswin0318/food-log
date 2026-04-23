import { createContext, useContext, useState, useEffect } from 'react'
import { authApi, macroApi } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [targets, setTargets] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const fetchUserData = async () => {
    try {
      const userData = await authApi.getMe()
      setUser(userData)
      const targetData = await macroApi.getTargets()
      setTargets(targetData)
    } catch (err) {
      console.error("Auth fetch failed:", err)
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout()
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchUserData()
    } else {
      setLoading(false)
    }
  }, [token])

  const login = (tokenValue, userData) => {
    localStorage.setItem('token', tokenValue)
    setToken(tokenValue)
    setUser(userData)
    // token change will trigger useEffect to fetch targets
  }

  const refreshTargets = async () => {
    try {
      const targetData = await macroApi.getTargets()
      setTargets(targetData)
    } catch (err) {
      console.error("Failed to refresh targets:", err)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setTargets(null)
  }

  if (loading) return null

  return (
    <AuthContext.Provider value={{ user, token, targets, setTargets, refreshTargets, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
