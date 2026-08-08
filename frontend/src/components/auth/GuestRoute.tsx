import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import AuthProgressOverlay from './AuthProgressOverlay'

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, authPhase } = useAuth()
  const location = useLocation()
  
  if (loading) {
    return <AuthProgressOverlay phase={authPhase} />
  }

  if (isAuthenticated) {
    // Check if there is an intended destination
    const params = new URLSearchParams(location.search)
    const redirectTo = params.get('redirect_to') || '/submit'
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
