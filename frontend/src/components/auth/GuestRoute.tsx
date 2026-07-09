import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#07070a] text-slate-300 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent animate-spin rounded-full" />
        <span>Authenticating...</span>
      </div>
    )
  }

  if (isAuthenticated) {
    // Check if there is an intended destination
    const params = new URLSearchParams(location.search)
    const redirectTo = params.get('redirect_to') || '/submit'
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
