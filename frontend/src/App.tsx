import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { QueryProvider } from './components/providers/QueryProvider'
import RenderingManager from './components/effects/RenderingManager'
import { AuthProvider } from './components/auth/AuthContext'
import { WorkspaceProvider } from './components/auth/WorkspaceContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import GuestRoute from './components/auth/GuestRoute'
import AppLayout from './components/layout/AppLayout'
import SessionExpiredDialog from './components/auth/SessionExpiredDialog'

const LandingPage      = lazy(() => import('./pages/LandingPage'))
const SubmitPage       = lazy(() => import('./pages/SubmitPage'))
const EvaluatePage     = lazy(() => import('./pages/EvaluatePage'))
const ReportPage       = lazy(() => import('./pages/ReportPage'))
const DemoPage         = lazy(() => import('./pages/DemoPage'))
const LeaderboardPage  = lazy(() => import('./pages/LeaderboardPage'))
const JuryDashboardPage= lazy(() => import('./pages/JuryDashboardPage'))
const ProjectsPage     = lazy(() => import('./pages/ProjectsPage'))
const LoginPage        = lazy(() => import('./pages/Login/LoginPage'))
const RegisterPage     = lazy(() => import('./pages/Login/RegisterPage'))
const RegisterOrganizationPage = lazy(() => import('./pages/Login/RegisterOrganizationPage'))
const LoadingWorkspacePage = lazy(() => import('./pages/Login/LoadingWorkspacePage'))

// Newly added redesigned pages
const DashboardPage    = lazy(() => import('./pages/DashboardPage'))
const IntelligencePage = lazy(() => import('./pages/IntelligencePage'))
const HistoryPage      = lazy(() => import('./pages/HistoryPage'))
const SettingsPage     = lazy(() => import('./pages/SettingsPage'))
const TeamsPage            = lazy(() => import('./pages/TeamsPage'))
const TeamWorkspacePage    = lazy(() => import('./pages/TeamWorkspacePage'))
const ProjectWorkspacePage = lazy(() => import('./pages/ProjectWorkspacePage'))
const AuthenticityPage     = lazy(() => import('./pages/AuthenticityPage'))

// Enterprise and Enterprise AI pages
const EnterpriseOverviewPage = lazy(() => import('./pages/Enterprise/EnterpriseOverviewPage'))
const ConnectorsPage         = lazy(() => import('./pages/Enterprise/ConnectorsPage'))
const ConnectorDetailsPage   = lazy(() => import('./pages/Enterprise/ConnectorDetailsPage'))
const SecretsVaultPage       = lazy(() => import('./pages/Enterprise/SecretsVaultPage'))
const MarketplacePage        = lazy(() => import('./pages/Enterprise/MarketplacePage'))
const PluginsPage            = lazy(() => import('./pages/Enterprise/PluginsPage'))
const WebhooksPage           = lazy(() => import('./pages/Enterprise/WebhooksPage'))
const OperationsPage         = lazy(() => import('./pages/Enterprise/OperationsPage'))

const EnterpriseAIOverviewPage = lazy(() => import('./pages/EnterpriseAI/EnterpriseAIOverviewPage'))
const CopilotWorkspacePage     = lazy(() => import('./pages/EnterpriseAI/CopilotWorkspacePage'))
const KnowledgeSearchPage      = lazy(() => import('./pages/EnterpriseAI/KnowledgeSearchPage'))
const PredictionsPage          = lazy(() => import('./pages/EnterpriseAI/PredictionsPage'))
const DigitalTwinPage          = lazy(() => import('./pages/EnterpriseAI/DigitalTwinPage'))
const WorkflowStudioPage       = lazy(() => import('./pages/EnterpriseAI/WorkflowStudioPage'))
const ExecutiveDashboardPage   = lazy(() => import('./pages/EnterpriseAI/ExecutiveDashboardPage'))
const RepositoryDetailsPage    = lazy(() => import('./pages/Git/RepositoryDetailsPage'))

/**
 * Page-level loading fallback.
 * Background is already visible (RenderingManager is mounted above Routes),
 * so this only shows the spinner — no white flash.
 */
function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#07070a] font-mono text-xs text-white">
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
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center bg-[#07070a] font-mono text-xs text-white">
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
        <WorkspaceProvider>
        <SessionExpiredDialog />
        {/*
          RenderingManager is mounted OUTSIDE <Routes> so it never remounts
          during navigation. The WebGL context persists across all pages.
        */}
        <RenderingManager />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes outside shell */}
            <Route path="/"           element={<LandingPage />} />
            <Route path="/login"      element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register"   element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/register-organization" element={<RegisterOrganizationPage />} />
            <Route path="/loading-workspace" element={<LoadingWorkspacePage />} />
            <Route path="/demo"       element={<DemoPage />} />

            {/* Authenticated routes inside AppLayout persistent shell */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard"    element={<DashboardPage />} />
              <Route path="/projects"     element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectWorkspacePage />} />
              <Route path="/teams"        element={<TeamsPage />} />
              <Route path="/teams/:teamId" element={<TeamWorkspacePage />} />
              <Route path="/submit"       element={<SubmitPage />} />
              <Route path="/history"      element={<HistoryPage />} />
              <Route path="/settings"     element={<SettingsPage />} />
              <Route path="/leaderboard"  element={<LeaderboardPage />} />
              
              {/* Jury dashboard restricted to admins and managers */}
              <Route path="/jury"         element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <JuryDashboardPage />
                </ProtectedRoute>
              } />

              {/* Context-aware routes requiring projectId */}
              <Route
                path="/intelligence/:projectId"
                element={
                  <RequireProjectId>
                    <IntelligencePage />
                  </RequireProjectId>
                }
              />
              <Route
                path="/intelligence/:projectId/:tab"
                element={
                  <RequireProjectId>
                    <IntelligencePage />
                  </RequireProjectId>
                }
              />
              <Route
                path="/evaluate/:projectId"
                element={
                  <RequireProjectId>
                    <EvaluatePage />
                  </RequireProjectId>
                }
              />
              <Route
                path="/report/:projectId"
                element={
                  <RequireProjectId>
                    <ReportPage />
                  </RequireProjectId>
                }
              />
              <Route
                path="/report/:projectId/:section"
                element={
                  <RequireProjectId>
                    <ReportPage />
                  </RequireProjectId>
                }
              />
              <Route
                path="/authenticity/:projectId"
                element={
                  <RequireProjectId>
                    <AuthenticityPage />
                  </RequireProjectId>
                }
              />
              <Route
                path="/authenticity/compare/:projectId/:targetProjectId"
                element={
                  <RequireProjectId>
                    <AuthenticityPage compareMode={true} />
                  </RequireProjectId>
                }
              />


              {/* Enterprise Routes */}
              <Route path="/enterprise"            element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN']}><EnterpriseOverviewPage /></ProtectedRoute>} />
              <Route path="/enterprise/connectors" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN']}><ConnectorsPage /></ProtectedRoute>} />
              <Route path="/enterprise/connectors/:connectorId" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN']}><ConnectorDetailsPage /></ProtectedRoute>} />
              <Route path="/enterprise/secrets"    element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN']}><SecretsVaultPage /></ProtectedRoute>} />
              <Route path="/enterprise/marketplace" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN']}><MarketplacePage /></ProtectedRoute>} />
              <Route path="/enterprise/plugins"     element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN']}><PluginsPage /></ProtectedRoute>} />
              <Route path="/enterprise/webhooks"    element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN']}><WebhooksPage /></ProtectedRoute>} />
              <Route path="/enterprise/operations"  element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN']}><OperationsPage /></ProtectedRoute>} />

              {/* Enterprise AI / Intelligence Routes */}
              <Route path="/intelligence"             element={<EnterpriseAIOverviewPage />} />
              <Route path="/intelligence/copilot"     element={<CopilotWorkspacePage />} />
              <Route path="/intelligence/search"      element={<KnowledgeSearchPage />} />
              <Route path="/intelligence/predictions" element={<PredictionsPage />} />
              <Route path="/intelligence/digital-twin" element={<DigitalTwinPage />} />
              <Route path="/enterprise/workflows"     element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN']}><WorkflowStudioPage /></ProtectedRoute>} />
              <Route path="/intelligence/executive"   element={<ExecutiveDashboardPage />} />
              <Route path="/repositories/:id"         element={<RepositoryDetailsPage />} />
            </Route>

            {/* Redirections */}
            <Route path="/evaluate" element={<Navigate to="/submit" replace />} />
            <Route path="/report"   element={<Navigate to="/submit" replace />} />
            <Route path="*"         element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
