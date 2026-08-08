import { api } from '../../api/api'
import type { UserProfile, AuthPhase } from '../../components/auth/AuthContext'

let memoryAccessToken: string | null = null

// axios request interceptor to inject bearer token
api.interceptors.request.use((config) => {
  if (memoryAccessToken) {
    config.headers.Authorization = `Bearer ${memoryAccessToken}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export function getMemoryAccessToken(): string | null {
  return memoryAccessToken
}

export function setMemoryAccessToken(token: string | null) {
  memoryAccessToken = token
}

class AuthOrchestrator {
  private onPhaseChange: (phase: AuthPhase) => void = () => {}
  private onUserChange: (user: UserProfile | null) => void = () => {}
  private onPlatformChange: (initialized: boolean) => void = () => {}
  private onProvidersChange: (providers: string[], metadata: Record<string, any>) => void = () => {}
  
  private refreshTimer: any = null

  public subscribe(callbacks: {
    onPhaseChange: (phase: AuthPhase) => void
    onUserChange: (user: UserProfile | null) => void
    onPlatformChange: (initialized: boolean) => void
    onProvidersChange: (providers: string[], metadata: Record<string, any>) => void
  }) {
    this.onPhaseChange = callbacks.onPhaseChange
    this.onUserChange = callbacks.onUserChange
    this.onPlatformChange = callbacks.onPlatformChange
    this.onProvidersChange = callbacks.onProvidersChange
  }

  public clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  public scheduleSilentRefresh() {
    this.clearRefreshTimer()
    // Refresh every 14 minutes (tokens expire in 15m)
    const intervalMs = 14 * 60 * 1000 
    this.refreshTimer = setTimeout(async () => {
      try {
        if (import.meta.env.DEV) {
          console.log('[AuthOrchestrator] Performing silent session refresh...')
        }
        const res = await api.post('/auth/refresh')
        memoryAccessToken = res.data.access_token
        this.onUserChange(res.data.user)
        this.scheduleSilentRefresh()
      } catch (err) {
        console.warn('[AuthOrchestrator] Silent refresh failed, session expired', err)
        memoryAccessToken = null
        this.onUserChange(null)
        this.onPhaseChange('EXPIRED')
      }
    }, intervalMs)
  }

  private async runPostAuthSequence(user: UserProfile) {
    try {
      // 1. Loading Organization
      this.onPhaseChange('LOADING_ORGANIZATION')
      await api.get('/organizations')

      // 2. Loading Workspace
      this.onPhaseChange('LOADING_WORKSPACE')
      await api.get('/workspaces')

      // 3. Initializing RBAC
      this.onPhaseChange('INITIALIZING_RBAC')
      try {
        await api.get('/admin/roles')
      } catch (err) {
        console.warn('[AuthOrchestrator] Optional admin roles check failed:', err)
      }

      // 4. Redirecting
      this.onPhaseChange('REDIRECTING')
      
      // Allow minor rendering breath room before setting READY state
      await new Promise(r => setTimeout(r, 100))
      
      this.onPhaseChange('READY')

      // 5. Preload core dashboard resources asynchronously after reaching READY
      setTimeout(async () => {
        try {
          await Promise.allSettled([
            api.get('/auth/me'),
            api.get('/git/repositories'),
            api.get('/projects?page=1&size=100'),
            api.get('/notifications')
          ])
        } catch (err) {
          // ignore background preload failures
        }
      }, 500)
    } catch (err) {
      console.error('[AuthOrchestrator] Core post-auth sequence failed, forcing READY:', err)
      // Attempt fallback transition to READY so the app isn't bricked
      this.onPhaseChange('READY')
    }
  }

  public async initialize(): Promise<void> {
    this.onPhaseChange('INITIALIZING')
    try {
      // 1. Check Platform bootstrap
      this.onPhaseChange('CHECKING_PLATFORM')
      const bootstrapRes = await api.get(`/auth/bootstrap?t=${Date.now()}`)
      const isInitialized = bootstrapRes.data.platform_initialized
      this.onPlatformChange(isInitialized)
      this.onProvidersChange(bootstrapRes.data.providers, bootstrapRes.data.providers_metadata)

      if (!isInitialized) {
        memoryAccessToken = null
        this.onUserChange(null)
        this.onPhaseChange('NEW')
        return
      }

      // 2. Restore Session
      this.onPhaseChange('RESTORING_SESSION')
      const res = await api.post('/auth/refresh')
      memoryAccessToken = res.data.access_token
      this.onUserChange(res.data.user)
      this.scheduleSilentRefresh()

      // Run post-auth load sequences
      await this.runPostAuthSequence(res.data.user)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.log('[AuthOrchestrator] No active session restored on boot.', err)
      }
      memoryAccessToken = null
      this.onUserChange(null)
      this.onPhaseChange('LOGGED_OUT')
    }
  }

  public async login(email: string, password: string, rememberMe: boolean): Promise<UserProfile> {
    this.onPhaseChange('AUTHENTICATING')
    try {
      const res = await api.post('/auth/login', { email, password })
      memoryAccessToken = res.data.access_token
      this.onUserChange(res.data.user)
      
      if (rememberMe) {
        localStorage.setItem('yowon_remember_me', 'true')
      } else {
        localStorage.removeItem('yowon_remember_me')
      }
      
      this.scheduleSilentRefresh()
      await this.runPostAuthSequence(res.data.user)
      return res.data.user
    } catch (err) {
      memoryAccessToken = null
      this.onUserChange(null)
      this.onPhaseChange('LOGGED_OUT')
      throw err
    }
  }

  public async register(fullName: string, email: string, password: string): Promise<UserProfile> {
    this.onPhaseChange('AUTHENTICATING')
    try {
      const res = await api.post('/auth/register', {
        full_name: fullName,
        email,
        password
      })
      memoryAccessToken = res.data.access_token
      this.onUserChange(res.data.user)
      this.scheduleSilentRefresh()
      await this.runPostAuthSequence(res.data.user)
      return res.data.user
    } catch (err) {
      memoryAccessToken = null
      this.onUserChange(null)
      this.onPhaseChange('LOGGED_OUT')
      throw err
    }
  }

  public async setupOrganization(orgName: string, adminName: string, email: string, password: string): Promise<UserProfile> {
    this.onPhaseChange('AUTHENTICATING')
    try {
      const res = await api.post('/auth/setup-organization', {
        organization_name: orgName,
        admin_name: adminName,
        email,
        password
      })
      memoryAccessToken = res.data.access_token
      this.onUserChange(res.data.user)
      this.onPlatformChange(true)
      this.scheduleSilentRefresh()
      await this.runPostAuthSequence(res.data.user)
      return res.data.user
    } catch (err) {
      memoryAccessToken = null
      this.onUserChange(null)
      this.onPhaseChange('NEW')
      throw err
    }
  }

  public async logout(): Promise<void> {
    this.clearRefreshTimer()
    this.onPhaseChange('LOGGED_OUT')
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('[AuthOrchestrator] Logout endpoint error', err)
    } finally {
      memoryAccessToken = null
      this.onUserChange(null)
      localStorage.removeItem('yowon_remember_me')
    }
  }
}

export const authOrchestrator = new AuthOrchestrator()
