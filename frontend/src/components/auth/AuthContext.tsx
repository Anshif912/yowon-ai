import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../../api/api'
import { authOrchestrator } from '../../services/auth/AuthOrchestrator'

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
  | 'INITIALIZING'
  | 'CHECKING_PLATFORM'
  | 'RESTORING_SESSION'
  | 'AUTHENTICATING'
  | 'LOADING_ORGANIZATION'
  | 'LOADING_WORKSPACE'
  | 'INITIALIZING_RBAC'
  | 'REDIRECTING'
  | 'READY'
  | 'NEW'
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [authPhase, setAuthPhase] = useState<AuthPhase>('INITIALIZING')
  const [platformInitialized, setPlatformInitialized] = useState(true)
  const [providers, setProviders] = useState<string[]>(['password'])
  const [providersMetadata, setProvidersMetadata] = useState<Record<string, any>>({})

  useEffect(() => {
    authOrchestrator.subscribe({
      onPhaseChange: (phase) => setAuthPhase(phase),
      onUserChange: (usr) => setUser(usr),
      onPlatformChange: (init) => setPlatformInitialized(init),
      onProvidersChange: (provs, meta) => {
        setProviders(provs)
        setProvidersMetadata(meta)
      }
    })

    authOrchestrator.initialize()

    return () => {
      authOrchestrator.clearRefreshTimer()
    }
  }, [])

  const login = async (email: string, password: string, rememberMe: boolean) => {
    return authOrchestrator.login(email, password, rememberMe)
  }

  const setupOrganization = async (orgName: string, adminName: string, email: string, password: string) => {
    return authOrchestrator.setupOrganization(orgName, adminName, email, password)
  }

  const register = async (fullName: string, email: string, password: string) => {
    return authOrchestrator.register(fullName, email, password)
  }

  const logout = async () => {
    return authOrchestrator.logout()
  }

  const checkSession = async () => {
    await authOrchestrator.initialize()
    return null
  }

  const updateProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await api.put('/auth/profile', profileData)
    setUser(res.data)
    return res.data
  }

  const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.put('/auth/change-password', { old_password: oldPassword, new_password: newPassword })
  }

  const loading = authPhase !== 'READY' && authPhase !== 'NEW' && authPhase !== 'LOGGED_OUT' && authPhase !== 'EXPIRED'

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
