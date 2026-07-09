import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { QueryProvider } from './components/providers/QueryProvider'
import RenderingManager from './components/effects/RenderingManager'
import { AuthProvider } from './components/auth/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import GuestRoute from './components/auth/GuestRoute'

const LandingPage      = lazy(() => import('./pages/LandingPage'))
const SubmitPage       = lazy(() => import('./pages/SubmitPage'))
const EvaluatePage     = lazy(() => import('./pages/EvaluatePage'))
const ReportPage       = lazy(() => import('./pages/ReportPage'))
const DemoPage         = lazy(() => import('./pages/DemoPage'))
const LeaderboardPage  = lazy(() => import('./pages/LeaderboardPage'))
const JuryDashboardPage= lazy(() => import('./pages/JuryDashboardPage'))
const ProjectsPage     = lazy(() => import('./pages/ProjectsPage'))
const LoginPage        = lazy(() => import('./pages/Login/LoginPage'))

/**
 * Page-level loading fallback.
 * Background is already visible (GlobalBackground is mounted above Routes),
 * so this only shows the spinner — no white flash.
 */
function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#07070a]">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-yowon-border" />
        <div className="absolute inset-0 rounded-full border-4 border-t-yowon-accent border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <Shield size={22} className="absolute inset-0 m-auto text-yowon-accent" />
      </div>
      <p className="text-yowon-muted text-sm font-display tracking-wide">
        Initializing YOWON AI...
      </p>
    </div>
  )
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center bg-[#07070a]">
      <h1
        className="text-[8rem] leading-none font-bold font-display text-yowon-border select-none"
        style={{ textShadow: '0 0 60px rgba(6,182,212,0.25)' }}
      >
        404
      </h1>
      <p className="text-yowon-muted max-w-sm">This page doesn't exist in the YOWON AI network.</p>
      <a href="/" className="yowon-btn-primary">Back to Command Center</a>
    </div>
  )
}

function RequireProjectId({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const hasId = pathname.split('/').filter(Boolean).length >= 2
  return hasId ? <>{children}</> : <Navigate to="/submit" replace />
}

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        {/*
          RenderingManager is mounted OUTSIDE <Routes> so it never remounts
          during navigation. The Strands WebGL context persists across all pages.
        */}
        <RenderingManager />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"           element={<LandingPage />} />
            <Route path="/login"      element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/submit"     element={<ProtectedRoute><SubmitPage /></ProtectedRoute>} />
            <Route path="/demo"       element={<DemoPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            
            {/* Jury dashboard restricted to admins and managers */}
            <Route path="/jury"       element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <JuryDashboardPage />
              </ProtectedRoute>
            } />
            
            <Route path="/projects"   element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route
              path="/evaluate/:projectId"
              element={
                <ProtectedRoute>
                  <RequireProjectId>
                    <EvaluatePage />
                  </RequireProjectId>
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/:projectId"
              element={<Navigate to="overview" replace />}
            />
            <Route
              path="/report/:projectId/:section"
              element={
                <ProtectedRoute>
                  <RequireProjectId>
                    <ReportPage />
                  </RequireProjectId>
                </ProtectedRoute>
              }
            />
            <Route path="/evaluate" element={<Navigate to="/submit" replace />} />
            <Route path="/report"   element={<Navigate to="/submit" replace />} />
            <Route path="*"         element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </QueryProvider>
  )
}
