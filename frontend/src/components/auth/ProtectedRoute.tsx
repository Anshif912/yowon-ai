import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { ShieldAlert } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#07070a] text-slate-300 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent animate-spin rounded-full" />
        <span>Verifying Security Clearance...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Save current path to return to it after authentication
    const currentPath = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect_to=${currentPath}`} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Role-based authorization warning
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center bg-[#07070a] font-mono text-xs text-slate-300">
        <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 animate-pulse">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Access Clearance Revoked</h2>
          <p className="text-slate-400">
            Your account ({user.email}) does not possess the credentials required to access this system segment.
          </p>
        </div>
        <a href="/submit" className="glass-pill px-4 py-2 border border-white/10 hover:bg-white/5 hover:text-white transition-all">
          Return to Command Center
        </a>
      </div>
    )
  }

  return <>{children}</>
}
