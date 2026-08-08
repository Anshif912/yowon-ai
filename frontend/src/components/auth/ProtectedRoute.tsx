import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { ShieldAlert } from 'lucide-react'
import AuthProgressOverlay from './AuthProgressOverlay'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading, authPhase } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AuthProgressOverlay phase={authPhase} />
  }

  if (!isAuthenticated) {
    // Save current path to return to it after authentication
    const currentPath = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect_to=${currentPath}`} replace />
  }

  if (allowedRoles && user) {
    const userRoleClean = (user.role || '').trim().toUpperCase()
    const userRoleRaw = (user.role || '').trim().toLowerCase()

    const isAuthorized = allowedRoles.some((role) => {
      const targetClean = role.trim().toUpperCase()
      const targetLower = role.trim().toLowerCase()

      if (userRoleClean === targetClean || userRoleRaw === targetLower) return true

      // Aliases
      if (['ADMIN', 'SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN'].includes(userRoleClean) &&
          ['ADMIN', 'SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN', 'PLATFORM OWNER', 'ORGANIZATION ADMIN'].includes(targetClean)) {
        return true
      }

      if (['DEVELOPER', 'TEAM_MEMBER', 'PROJECT_OWNER'].includes(userRoleClean) &&
          ['DEVELOPER', 'MEMBER', 'TEAM_MEMBER'].includes(targetClean)) {
        return true
      }

      return false
    })

    if (!isAuthorized) {
      // Role-based authorization warning
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center bg-[#07070a] font-mono text-xs text-slate-300">
          <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 animate-pulse">
            <ShieldAlert size={28} />
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Access Clearance Revoked</h2>
            <p className="text-slate-400">
              Your account (<span className="text-cyan-400 font-mono">{user.email}</span>, role: <span className="text-amber-400 font-mono">{user.role}</span>) does not possess the clearance required for this segment.
            </p>
          </div>
          <a href="/dashboard" className="glass-pill px-4 py-2 border border-white/10 hover:bg-white/5 hover:text-white transition-all">
            Return to Command Center
          </a>
        </div>
      )
    }
  }


  return <>{children}</>
}
