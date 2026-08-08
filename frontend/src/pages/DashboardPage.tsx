import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/api'
import { useEvaluationReport } from '../components/report/queries'
import { useDashboardState } from '../hooks/useDashboardState'

// Layout
import LeftRail, { CompactRepo } from '../components/dashboard/LeftRail'
import RightRail from '../components/dashboard/RightRail'
import WorkspaceTabs from '../components/dashboard/WorkspaceTabs'
import WorkspaceModeSelector from '../components/dashboard/WorkspaceModeSelector'

// Bands
import ExecutiveBriefing from '../components/dashboard/ExecutiveBriefing'
import MissionStatus from '../components/dashboard/MissionStatus'
import RepositoryGrid, { Repository } from '../components/dashboard/RepositoryGrid'
import RepositoryDrawer from '../components/dashboard/RepositoryDrawer'
import ActivePipeline, { ActiveJob } from '../components/dashboard/ActivePipeline'
import RiskMatrix from '../components/dashboard/RiskMatrix'
import RepositoryRelationships from '../components/dashboard/RepositoryRelationships'
import ActivityFeed, { ActivityEvent } from '../components/dashboard/ActivityFeed'
import RecommendationsFeed, { Recommendation } from '../components/dashboard/RecommendationsFeed'
import PortfolioAnalytics from '../components/dashboard/PortfolioAnalytics'
import PortfolioTrends from '../components/dashboard/PortfolioTrends'
import WidgetsPanel from '../components/dashboard/WidgetsPanel'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { state, setState, toggleFavorite, toggleGroup, dismissRecommendation, trackRecommendation } = useDashboardState()

  // ── Core data state ──────────────────────────────────────────────────────
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([])
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [trendData, setTrendData] = useState<any[]>([])

  // ── Drawer state ─────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const { data: reportDetails, isLoading: reportLoading } = useEvaluationReport(
    selectedRepo?.uuid || ''
  )

  // ── Bulk actions ─────────────────────────────────────────────────────────
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([])
  const [compareMode, setCompareMode] = useState(false)
  const [compareBaseId, setCompareBaseId] = useState('')
  const [compareTargetId, setCompareTargetId] = useState('')
  const [compareResult, setCompareResult] = useState<any>(null)
  const [comparing, setComparing] = useState(false)

  // ── Recent repos tracking ─────────────────────────────────────────────────
  const [recentRepoIds, setRecentRepoIds] = useState<string[]>([])

  // ── Active tag filter ─────────────────────────────────────────────────────
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined)

  // ─────────────────────────────────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => { fetchRepositories() }, [])

  const fetchRepositories = () => {
    setLoading(true)
    api.get('/git/repositories')
      .then((res) => {
        if (Array.isArray(res.data)) setRepositories(res.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  // Poll active jobs
  useEffect(() => {
    if (activeJobs.length === 0) return
    const interval = setInterval(() => {
      activeJobs.forEach((job) => {
        api.get(`/status/${job.projectId}`)
          .then((res) => {
            const data = res.data
            const progress = data.progress?.percentage ?? job.progress
            setActiveJobs((prev) =>
              prev.map((j) => {
                if (j.projectId !== job.projectId) return j
                let stage = j.stage
                if (data.status === 'done') stage = 'done'
                else if (data.status === 'failed') stage = 'failed'
                else if (progress >= 80) stage = 'council'
                else if (progress >= 50) stage = 'intelligence'
                else if (progress >= 25) stage = 'ast'
                return { ...j, progress, stage, status: data.status }
              })
            )
            if (data.status === 'done' || data.status === 'success') {
              setActivities((prev) => [{
                timestamp: new Date().toLocaleTimeString(),
                repoName: job.name,
                event: 'Evaluation Completed',
                status: 'success',
              }, ...prev])
              setTimeout(() => {
                setActiveJobs((prev) => prev.filter((j) => j.projectId !== job.projectId))
                fetchRepositories()
              }, 1500)
            }
          })
          .catch(() => {})
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [activeJobs])

  // Trend data
  useEffect(() => {
    const evaluated = repositories.filter((r) => r.statistics)
    if (evaluated.length > 1) {
      setTrendData([
        { timestamp: '10:00', health: 88, risk: 15, debt: 12 },
        { timestamp: '10:30', health: 91, risk: 10, debt: 8 },
        { timestamp: '11:00', health: avgHealth, risk: criticalSecurity, debt: engineeringDebtHours },
      ])
    } else {
      setTrendData([])
    }
  }, [repositories])

  // ─────────────────────────────────────────────────────────────────────────
  // Keyboard shortcuts
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let gPressed = false
    const TABS = ['overview', 'repositories', 'operations', 'security', 'portfolio'] as const

    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'Escape') {
        if (drawerOpen) { setDrawerOpen(false); return }
        if (compareMode) { setCompareMode(false); return }
      }
      if (e.key === '[') { setState({ leftRailCollapsed: !state.leftRailCollapsed }); return }
      if (e.key === ']') { setState({ rightRailCollapsed: !state.rightRailCollapsed }); return }

      // Workspace mode shortcuts: 1/2/3
      if (e.key === '1') { setState({ workspaceMode: 'engineering' }); return }
      if (e.key === '2') { setState({ workspaceMode: 'security' }); return }
      if (e.key === '3') { setState({ workspaceMode: 'executive' }); return }

      // Tab navigation: ArrowLeft / ArrowRight
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const idx = TABS.indexOf(state.activeTab as any)
        const next = e.key === 'ArrowRight'
          ? TABS[Math.min(idx + 1, TABS.length - 1)]
          : TABS[Math.max(idx - 1, 0)]
        setState({ activeTab: next })
        return
      }

      // g+r, g+o, g+s, g+p
      if (e.key === 'g') { gPressed = true; setTimeout(() => { gPressed = false }, 800); return }
      if (gPressed) {
        if (e.key === 'r') setState({ activeTab: 'repositories' })
        if (e.key === 'o') setState({ activeTab: 'overview' })
        if (e.key === 's') setState({ activeTab: 'security' })
        if (e.key === 'p') setState({ activeTab: 'portfolio' })
        gPressed = false
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [drawerOpen, compareMode, state.activeTab, state.leftRailCollapsed, state.rightRailCollapsed])

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────
  const handleCardClick = useCallback((repo: Repository) => {
    setSelectedRepo(repo)
    setDrawerOpen(true)
    setState({ selectedRepoId: repo.uuid, drawerTab: 'overview' })
    setRecentRepoIds((prev) => [repo.uuid, ...prev.filter((id) => id !== repo.uuid)].slice(0, 5))
  }, [])

  const handleRepoClick = useCallback((repoId: string) => {
    const repo = repositories.find((r) => r.uuid === repoId)
    if (repo) handleCardClick(repo)
  }, [repositories, handleCardClick])

  const triggerRepoEvaluation = useCallback((repoId: string) => {
    navigate(`/evaluate/${repoId}`)
  }, [navigate])

  const handleAbortJob = useCallback((projectId: string) => {
    api.post(`/evaluate/${projectId}/abort`).then(() => {
      setActiveJobs((prev) => prev.filter((j) => j.projectId !== projectId))
      fetchRepositories()
    }).catch(() => {
      setActiveJobs((prev) => prev.filter((j) => j.projectId !== projectId))
    })
  }, [])

  const triggerSync = useCallback(() => {
    setLoading(true)
    api.post('/git/repositories/sync-all').then(fetchRepositories).catch(() => setLoading(false))
  }, [])

  const executeCompare = () => {
    if (!compareBaseId || !compareTargetId) return
    setComparing(true)
    api.post('/git/repositories/compare', { base_repo_id: compareBaseId, target_repo_id: compareTargetId })
      .then((res) => { setCompareResult(res.data); setComparing(false) })
      .catch(() => setComparing(false))
  }

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedRepoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedRepoIds((prev) =>
      prev.length === filteredRepos.length ? [] : filteredRepos.map((r) => r.uuid)
    )
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // Derived metrics (memoized)
  // ─────────────────────────────────────────────────────────────────────────
  const evaluatedRepos = useMemo(
    () => repositories.filter((r) => r.statistics),
    [repositories]
  )

  const avgHealth = useMemo(() =>
    evaluatedRepos.length > 0
      ? Math.round(evaluatedRepos.reduce((a, r) => a + (r.statistics?.health_score ?? 0), 0) / evaluatedRepos.length)
      : 0,
    [evaluatedRepos]
  )

  const needReview = useMemo(
    () => evaluatedRepos.filter((r) => (r.statistics?.health_score ?? 0) < 90).length,
    [evaluatedRepos]
  )
  const blockedCount = useMemo(
    () => evaluatedRepos.filter((r) => (r.statistics?.health_score ?? 0) < 80).length,
    [evaluatedRepos]
  )
  const productionReadyCount = useMemo(
    () => evaluatedRepos.filter((r) => (r.statistics?.health_score ?? 0) >= 90).length,
    [evaluatedRepos]
  )
  const engineeringDebtHours = useMemo(
    () => evaluatedRepos.reduce((a, r) => a + (r.statistics?.technical_debt ?? 0), 0),
    [evaluatedRepos]
  )
  const criticalSecurity = useMemo(
    () => evaluatedRepos.reduce((a, r) => a + (r.statistics?.security_issues_count ?? 0), 0),
    [evaluatedRepos]
  )

  const filteredRepos = useMemo(() => {
    const q = (state.activeFilters as any).search?.toLowerCase() ?? ''
    return repositories.filter((r) => {
      const matchOrg = state.activeFilters.org === 'all' || r.organization?.login === state.activeFilters.org
      const matchVerdict = state.activeFilters.verdict === 'all' || r.verdict === state.activeFilters.verdict
      const matchSearch = !q || r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q)
      const matchTag = !activeTag || (r.language ?? '').toLowerCase() === activeTag.toLowerCase() || (r.description ?? '').toLowerCase().includes(activeTag.toLowerCase())
      return matchOrg && matchVerdict && matchSearch && matchTag
    })
  }, [repositories, state.activeFilters, activeTag])

  const riskNodes = useMemo(() =>
    evaluatedRepos.filter((r) => (r.statistics?.security_issues_count ?? 0) > 0 || (r.statistics?.health_score ?? 100) < 90)
      .map((r) => ({
        repoId: r.uuid, repoName: r.name,
        riskName: (r.statistics?.health_score ?? 100) < 80 ? 'Critical vulnerability' : 'Dependency exposure',
        severity: (r.statistics?.health_score ?? 100) < 80 ? 'CRITICAL' : 'HIGH' as any,
        likelihood: 'HIGH' as any, impact: 'HIGH' as any,
        category: 'Security', primaryAgent: 'Sentinel',
        hours: r.statistics?.technical_debt ?? 8,
        score: r.statistics?.health_score ?? 0,
      })),
    [evaluatedRepos]
  )

  const recommendationsList = useMemo((): Recommendation[] =>
    evaluatedRepos
      .filter((r) => (r.statistics?.health_score ?? 100) < 100)
      .map((r, i) => {
        const health = r.statistics?.health_score ?? 0
        return {
          id: `${r.uuid}-rec`,
          repoId: r.uuid,
          repoName: r.name,
          recommendation: health < 80
            ? 'Enforce security policy validations across API router paths'
            : health < 90
            ? 'Configure missing content security policy response headers'
            : 'Increase unit test coverage index',
          impact: (health < 80 ? 'HIGH' : health < 90 ? 'MEDIUM' : 'LOW') as any,
          difficulty: 'MEDIUM' as any,
          category: health < 80 ? 'Immediate' : health < 90 ? 'Today' : 'This Week',
          eta: health < 80 ? '4h' : health < 90 ? '2h' : '6h',
          files: [health < 80 ? 'backend/modules/auth/router.py' : 'frontend/src/App.tsx'],
        }
      }),
    [evaluatedRepos]
  )

  const securityAlerts = useMemo(() => {
    const alerts: string[] = []
    evaluatedRepos.forEach((r) => {
      if ((r.statistics?.security_issues_count ?? 0) > 0) {
        alerts.push(`Critical vulnerabilities detected in ${r.name}`)
      }
    })
    return alerts
  }, [evaluatedRepos])

  const techStackStats = useMemo(() => {
    const map: Record<string, { count: number; category: string }> = {}
    repositories.forEach((r) => {
      if (r.language) {
        if (!map[r.language]) map[r.language] = { count: 0, category: 'language' }
        map[r.language].count++
      }
    })
    return Object.entries(map).map(([label, info]) => ({ label, count: info.count, category: info.category }))
  }, [repositories])

  const uniqueOrgs = useMemo(
    () => Array.from(new Set(repositories.map((r) => r.organization?.login).filter(Boolean))) as string[],
    [repositories]
  )

  const compactRepos: CompactRepo[] = useMemo(
    () => repositories.map((r) => ({
      uuid: r.uuid,
      name: r.name,
      health_score: r.statistics?.health_score ?? 0,
      verdict: r.verdict ?? '',
      language: r.language,
    })),
    [repositories]
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Tab content renderer
  // ─────────────────────────────────────────────────────────────────────────
  const renderCenter = () => {
    const tab = state.activeTab

    const repoGrid = (
      <RepositoryGrid
        repositories={filteredRepos}
        loading={loading}
        selectedRepoIds={selectedRepoIds}
        favoriteRepoIds={state.favoriteRepoIds}
        expandedGroups={state.expandedGroups}
        layoutDensity={state.layoutDensity}
        onToggleSelect={handleToggleSelect}
        onToggleFavorite={toggleFavorite}
        onToggleGroup={toggleGroup}
        onSelectAll={handleSelectAll}
        onCardClick={handleCardClick}
        onCompare={(id) => { setCompareMode(true); setCompareBaseId(id) }}
        onEvaluate={triggerRepoEvaluation}
        onOpenReport={(id) => navigate(`/report/${id}`)}
        drillDownTag={activeTag}
        onDrillDownClear={() => setActiveTag(undefined)}
      />
    )

    if (tab === 'overview') {
      return (
        <div className="space-y-4">
          {repoGrid}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RiskMatrix nodes={riskNodes} onNodeClick={(id) => navigate(`/repositories/${id}`)} />
            <div className="space-y-4">
              <PortfolioAnalytics stats={techStackStats} onTagClick={setActiveTag} activeTag={activeTag} loading={loading} />
            </div>
            <RepositoryRelationships />
          </div>
        </div>
      )
    }
    if (tab === 'repositories') {
      return repoGrid
    }
    if (tab === 'operations') {
      return (
        <div className="space-y-4">
          {activeJobs.length > 0 && <ActivePipeline jobs={activeJobs} onAbortJob={handleAbortJob} />}
          <RiskMatrix nodes={riskNodes} onNodeClick={(id) => navigate(`/repositories/${id}`)} />
        </div>
      )
    }
    if (tab === 'security') {
      return (
        <div className="space-y-4">
          <RiskMatrix nodes={riskNodes} onNodeClick={(id) => navigate(`/repositories/${id}`)} />
          {repoGrid}
        </div>
      )
    }
    if (tab === 'portfolio') {
      return (
        <div className="space-y-4">
          <PortfolioAnalytics stats={techStackStats} onTagClick={setActiveTag} activeTag={activeTag} loading={loading} />
          <PortfolioTrends data={trendData} />
        </div>
      )
    }
    return repoGrid
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#05070a]">

      {/* Band 0 — Executive Brief (glass, full-width) */}
      <ExecutiveBriefing
        avgHealth={avgHealth}
        needReview={needReview}
        blockedCount={blockedCount}
        engineeringDebtHours={engineeringDebtHours}
        productionReady={productionReadyCount}
        latestReport={reportDetails}
        loading={loading}
      />

      {/* Band 1 — Sticky Mission Strip */}
      <div className="sticky top-0 z-20 shrink-0 bg-[#05070a] border-b border-white/[0.05]">
        <MissionStatus
          avgHealth={avgHealth}
          needReview={needReview}
          blockedCount={blockedCount}
          evaluatingCount={activeJobs.length}
          engineeringDebtHours={engineeringDebtHours}
          productionReady={productionReadyCount}
        />
      </div>

      {/* Workspace Tabs + Mode selector row */}
      <div className="flex items-center shrink-0 border-b border-white/[0.05] bg-[#05070a]">
        <WorkspaceTabs
          activeTab={state.activeTab}
          onTabChange={(t) => setState({ activeTab: t })}
          layoutDensity={state.layoutDensity}
          onLayoutChange={(d) => setState({ layoutDensity: d })}
        />
        <div className="px-3 ml-auto shrink-0">
          <WorkspaceModeSelector
            mode={state.workspaceMode}
            onChange={(m) => setState({ workspaceMode: m })}
          />
        </div>
      </div>

      {/* Band 2 — 3-column IDE body */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left Rail */}
        <LeftRail
          collapsed={state.leftRailCollapsed}
          onToggle={() => setState({ leftRailCollapsed: !state.leftRailCollapsed })}
          repos={compactRepos}
          favoriteRepoIds={state.favoriteRepoIds}
          onToggleFavorite={toggleFavorite}
          filters={state.activeFilters}
          onFilterChange={(f) => setState({ activeFilters: { ...state.activeFilters, ...f } })}
          onRepoClick={handleRepoClick}
          onConnectClick={() => navigate('/submit')}
          onSyncClick={triggerSync}
          onSearchClick={() => {
            // CommandPalette is globally registered in AppLayout — dispatch Ctrl+K event
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
          }}
          orgs={uniqueOrgs}
          recentRepoIds={recentRepoIds}
        />

        {/* Center workspace — only this scrolls */}
        <main className="flex-1 overflow-y-auto min-w-0 py-5 px-6 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-5">
            {renderCenter()}
          </div>
        </main>

        {/* Right Rail */}
        <RightRail
          collapsed={state.rightRailCollapsed}
          onToggle={() => setState({ rightRailCollapsed: !state.rightRailCollapsed })}
          activeJobs={activeJobs}
          onAbortJob={handleAbortJob}
          recommendations={recommendationsList}
          activities={activities}
          securityAlerts={securityAlerts}
          trackedRecommendations={state.trackedRecommendations}
          dismissedRecommendations={state.dismissedRecommendations}
          onReviewRecommendation={(repoId) => navigate(`/report/${repoId}/security`)}
          onDismissRecommendation={dismissRecommendation}
          onTrackRecommendation={trackRecommendation}
        />
      </div>

      {/* Compare Modal */}
      {compareMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-surface w-full max-w-xl rounded-2xl p-6 space-y-5 font-mono">
            <div className="flex justify-between items-center pb-3 border-b border-white/[0.05]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">Compare Codebases</span>
              <button onClick={() => { setCompareMode(false); setCompareResult(null) }} className="text-zinc-500 hover:text-white text-sm">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[{ label: 'Base', val: compareBaseId, set: setCompareBaseId }, { label: 'Target', val: compareTargetId, set: setCompareTargetId }].map(({ label, val, set }) => (
                <div key={label} className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase">{label}</label>
                  <select value={val} onChange={(e) => set(e.target.value)}
                    className="w-full bg-[#12131a] border border-white/[0.08] text-white rounded-lg h-8 px-3 text-[10px] outline-none">
                    <option value="">Select…</option>
                    {repositories.map((r) => <option key={r.uuid} value={r.uuid}>{r.full_name}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button onClick={executeCompare} disabled={comparing || !compareBaseId || !compareTargetId}
              className="w-full yowon-btn-primary h-9 text-[11px]">
              {comparing ? 'Calculating…' : 'Compare Codebases'}
            </button>
            {compareResult && (
              <div className="grid grid-cols-3 gap-3 text-center text-[10px]">
                {[
                  { label: 'Similarity', val: `${compareResult.similarity_score}%`, class: 'text-cyan-400' },
                  { label: 'Health Diff', val: `${compareResult.delta?.health_diff >= 0 ? '+' : ''}${compareResult.delta?.health_diff}%`, class: compareResult.delta?.health_diff >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'Debt Delta', val: `${compareResult.delta?.tech_debt_diff > 0 ? '+' : ''}${compareResult.delta?.tech_debt_diff}h`, class: compareResult.delta?.tech_debt_diff <= 0 ? 'text-emerald-400' : 'text-red-400' },
                ].map(({ label, val, class: cls }) => (
                  <div key={label} className="bg-[#12131a] p-3 rounded-lg border border-white/[0.04]">
                    <p className="text-zinc-500 text-[8px] uppercase mb-1">{label}</p>
                    <p className={`font-bold font-mono text-sm ${cls}`}>{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawer */}
      <RepositoryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        repo={selectedRepo}
        report={reportDetails}
        reportLoading={reportLoading}
        onEvaluate={triggerRepoEvaluation}
        onCompare={(id) => { setCompareMode(true); setCompareBaseId(id); setDrawerOpen(false) }}
        onOpenReport={(id) => navigate(`/report/${id}`)}
        onOpenRepoUrl={(url) => window.open(url, '_blank')}
      />
    </div>
  )
}
