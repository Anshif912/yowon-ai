import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../api/api'

// Configure API to send cookies for HTTPOnly refresh tokens
api.defaults.withCredentials = true

export interface UserProfile {
  uuid: string
  email: string
  full_name: string
  role: string
  status: string
  avatar_url: string | null
  email_verified: boolean
  created_at: string
  last_login: string | null
  preferences: string | null
  timezone: string
  language: string
}

export type AuthPhase = 
  | 'NEW'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'WORKSPACE_LOADING'
  | 'PERMISSIONS_LOADING'
  | 'READY'
  | 'EXPIRED'
  | 'LOGGED_OUT'

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  loading: boolean
  authPhase: AuthPhase
  platformInitialized: boolean
  providers: string[]
  providersMetadata: Record<string, any>
  setAuthPhase: (phase: AuthPhase) => void
  login: (email: string, password: string, rememberMe: boolean) => Promise<UserProfile>
  setupOrganization: (orgName: string, adminName: string, email: string, password: string) => Promise<UserProfile>
  register: (fullName: string, email: string, password: string) => Promise<UserProfile>
  logout: () => Promise<void>
  updateProfile: (profile: Partial<UserProfile>) => Promise<UserProfile>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  checkSession: () => Promise<UserProfile | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// In-memory access token storage (OWASP Security standard)
let memoryAccessToken: string | null = null

// axios interceptor to inject bearer token
api.interceptors.request.use((config) => {
  if (memoryAccessToken) {
    config.headers.Authorization = `Bearer ${memoryAccessToken}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authPhase, setAuthPhase] = useState<AuthPhase>('AUTHENTICATING')
  const [platformInitialized, setPlatformInitialized] = useState(true)
  const [providers, setProviders] = useState<string[]>(['password'])
  const [providersMetadata, setProvidersMetadata] = useState<Record<string, any>>({})

  // Token refresh scheduler reference
  const refreshTimerRef = useRef<any>(null)
  const userRef = useRef<UserProfile | null>(null)

  useEffect(() => {
    userRef.current = user
  }, [user])

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  // Schedule silent refresh 1 minute before access token expiration (15m expiry -> refresh at 14m)
  const scheduleSilentRefresh = useCallback(() => {
    clearRefreshTimer()
    
    // Refresh every 14 minutes
    const intervalMs = 14 * 60 * 1000 
    refreshTimerRef.current = setTimeout(async () => {
      try {
        console.log('[Auth] Performing silent session refresh...')
        const res = await api.post('/auth/refresh')
        memoryAccessToken = res.data.access_token
        setUser(res.data.user)
        scheduleSilentRefresh()
      } catch (err) {
        console.warn('[Auth] Silent refresh failed, logging out user', err)
        memoryAccessToken = null
        setUser(null)
        setAuthPhase('EXPIRED')
      }
    }, intervalMs)
  }, [clearRefreshTimer])

  // Explicit checkSession to restore session on boot
  const checkSession = useCallback(async (): Promise<UserProfile | null> => {
    // If session is already active (e.g. from dynamic login/registration), do nothing
    if (memoryAccessToken) {
      setLoading(false)
      return userRef.current
    }
    
    try {
      // 1. Fetch bootstrap configuration (detect first startup / admin state)
      const bootstrapRes = await api.get(`/auth/bootstrap?t=${Date.now()}`)
      const isInitialized = bootstrapRes.data.platform_initialized
      setPlatformInitialized(isInitialized)
      setProviders(bootstrapRes.data.providers)
      setProvidersMetadata(bootstrapRes.data.providers_metadata)

      if (!isInitialized) {
        setAuthPhase('NEW')
        setUser(null)
        memoryAccessToken = null
        return null
      }

      // 2. Fetch fresh access token via refresh token cookie
      const res = await api.post('/auth/refresh')
      if (!memoryAccessToken) {
        memoryAccessToken = res.data.access_token
        setUser(res.data.user)
        setAuthPhase('READY')
        scheduleSilentRefresh()
      }
      return res.data.user
    } catch (err) {
      console.log('[Auth] No active persistent session found.')
      if (!memoryAccessToken) {
        memoryAccessToken = null
        setUser(null)
        setAuthPhase('LOGGED_OUT')
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [scheduleSilentRefresh])

  useEffect(() => {
    checkSession()
    return () => clearRefreshTimer()
  }, [checkSession, clearRefreshTimer])

  const login = async (email: string, password: string, rememberMe: boolean): Promise<UserProfile> => {
    setLoading(true)
    setAuthPhase('AUTHENTICATING')
    try {
      const res = await api.post('/auth/login', { email, password })
      memoryAccessToken = res.data.access_token
      setUser(res.data.user)
      setAuthPhase('READY')
      
      if (rememberMe) {
        localStorage.setItem('yowon_remember_me', 'true')
      } else {
        localStorage.removeItem('yowon_remember_me')
      }
      
      scheduleSilentRefresh()
      return res.data.user
    } catch (err: any) {
      setUser(null)
      memoryAccessToken = null
      setAuthPhase('LOGGED_OUT')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const setupOrganization = async (
    orgName: string,
    adminName: string,
    email: string,
    password: string
  ): Promise<UserProfile> => {
    setLoading(true)
    setAuthPhase('AUTHENTICATING')
    try {
      const res = await api.post('/auth/setup-organization', {
        organization_name: orgName,
        admin_name: adminName,
        email,
        password
      })
      memoryAccessToken = res.data.access_token
      setUser(res.data.user)
      setPlatformInitialized(true)
      setAuthPhase('READY')
      scheduleSilentRefresh()
      return res.data.user
    } catch (err) {
      setUser(null)
      memoryAccessToken = null
      setAuthPhase('NEW')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<UserProfile> => {
    setLoading(true)
    setAuthPhase('AUTHENTICATING')
    try {
      const res = await api.post('/auth/register', {
        full_name: fullName,
        email,
        password
      })
      memoryAccessToken = res.data.access_token
      setUser(res.data.user)
      setAuthPhase('READY')
      scheduleSilentRefresh()
      return res.data.user
    } catch (err) {
      setUser(null)
      memoryAccessToken = null
      setAuthPhase('LOGGED_OUT')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    clearRefreshTimer()
    setLoading(true)
    setAuthPhase('LOGGED_OUT')
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('[Auth] Logout endpoint call failed', err)
    } finally {
      memoryAccessToken = null
      setUser(null)
      setLoading(false)
      localStorage.removeItem('yowon_remember_me')
    }
  }

  const updateProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const res = await api.put('/auth/profile', profileData)
      setUser(res.data)
      return res.data
    } catch (err) {
      throw err
    }
  }

  const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      await api.put('/auth/change-password', { old_password: oldPassword, new_password: newPassword })
    } catch (err) {
      throw err
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    authPhase,
    platformInitialized,
    providers,
    providersMetadata,
    setAuthPhase,
    login,
    setupOrganization,
    register,
    logout,
    updateProfile,
    changePassword,
    checkSession
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
