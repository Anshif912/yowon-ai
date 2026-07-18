import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderGit2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Plus,
  Lock,
  Unlock,
  Building2,
  Sliders,
  ChevronRight,
  TrendingUp,
  Brain,
  Shield,
  Layers,
  GitFork,
  Star
} from 'lucide-react'
import { api } from '../api/api'
import { useAuth } from '../components/auth/AuthContext'
import ScoreRing from '../components/ScoreRing'

interface Repository {
  uuid: string
  name: string
  full_name: string
  description?: string
  html_url: string
  private: boolean
  language?: string
  stars_count: number
  forks_count: number
  open_issues_count: number
  last_sync_at?: string
  last_commit_at?: string
  evaluation_policy: string
  watchlist_active: boolean
  organization?: {
    name: string
    login: string
    avatar_url?: string
  }
  statistics?: {
    health_score: number
    risk_index: number
    velocity: number
    technical_debt: number
    coverage: number
    active_contributors: number
    security_issues_count: number
    estimated_remediation_cost: number
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrg, setSelectedOrg] = useState('all')
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  
  // Selection states for bulk operations
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [bulkActionStatus, setBulkActionStatus] = useState('')

  // Compare mode states
  const [compareMode, setCompareMode] = useState(false)
  const [compareBaseId, setCompareBaseId] = useState('')
  const [compareTargetId, setCompareTargetId] = useState('')
  const [compareResult, setCompareResult] = useState<any>(null)
  const [comparing, setComparing] = useState(false)

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = () => {
    setLoading(true)
    api.get('/git/repositories')
      .then(res => {
        setRepositories(res.data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  // Filter logic
  const orgs = Array.from(new Set(repositories.map(r => r.organization?.login).filter(Boolean)))
  const languages = Array.from(new Set(repositories.map(r => r.language).filter(Boolean)))

  const filteredRepos = repositories.filter(repo => {
    const matchesSearch = repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesOrg = selectedOrg === 'all' || repo.organization?.login === selectedOrg
    const matchesLang = selectedLanguage === 'all' || repo.language === selectedLanguage
    return matchesSearch && matchesOrg && matchesLang
  })

  // Executive summary stats
  const totalRepos = repositories.length
  const evaluatedRepos = repositories.filter(r => r.statistics !== undefined && r.statistics !== null)
  const avgHealth = evaluatedRepos.length > 0
    ? Math.round(evaluatedRepos.reduce((acc, r) => acc + (r.statistics?.health_score || 0), 0) / evaluatedRepos.length)
    : 100
  const avgTechDebt = evaluatedRepos.length > 0
    ? Math.round(evaluatedRepos.reduce((acc, r) => acc + (r.statistics?.technical_debt || 0), 0) / evaluatedRepos.length)
    : 0
  const totalRemediationCost = evaluatedRepos.reduce((acc, r) => acc + (r.statistics?.estimated_remediation_cost || 0), 0)

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedRepoIds(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedRepoIds.length === filteredRepos.length) {
      setSelectedRepoIds([])
    } else {
      setSelectedRepoIds(filteredRepos.map(r => r.uuid))
    }
  }

  // Bulk actions
  const handleBulkSync = () => {
    if (selectedRepoIds.length === 0) return
    setBulkActionLoading(true)
    setBulkActionStatus('Syncing selected repositories...')
    api.post('/git/repositories/sync-all', { repo_ids: selectedRepoIds })
      .then(() => {
        setTimeout(() => {
          setBulkActionLoading(false)
          setBulkActionStatus('')
          setSelectedRepoIds([])
          fetchRepositories()
        }, 3000)
      })
      .catch(() => {
        setBulkActionLoading(false)
        setBulkActionStatus('')
      })
  }

  const handleBulkEvaluate = () => {
    if (selectedRepoIds.length === 0) return
    setBulkActionLoading(true)
    setBulkActionStatus('Enqueuing bulk evaluations...')
    api.post('/git/repositories/evaluate-all', { repo_ids: selectedRepoIds, profile: 'Full' })
      .then(() => {
        setTimeout(() => {
          setBulkActionLoading(false)
          setBulkActionStatus('')
          setSelectedRepoIds([])
          fetchRepositories()
        }, 3000)
      })
      .catch(() => {
        setBulkActionLoading(false)
        setBulkActionStatus('')
      })
  }

  // Compare execution
  const executeCompare = () => {
    if (!compareBaseId || !compareTargetId) return
    setComparing(true)
    api.post('/git/repositories/compare', {
      base_repo_id: compareBaseId,
      target_repo_id: compareTargetId
    }).then(res => {
      setCompareResult(res.data)
      setComparing(false)
    }).catch(() => {
      setComparing(false)
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 space-y-8 font-mono text-xs text-white">
      {/* Welcome header strip */}
      <section className="space-y-4 pb-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">OPERATIONS HUB ACTIVE</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">
              Enterprise <span className="gradient-text">Command Center</span>
            </h1>
            <p className="text-zinc-500 text-xs font-sans max-w-xl">
              Continuous intelligence pipeline. Monitor health, audit vulnerability debt, and trigger automated repository evaluations.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCompareMode(true)}
              className="yowon-btn-secondary h-9 text-xs flex items-center gap-2"
            >
              <Layers size={14} /> Compare Repositories
            </button>
            <button
              onClick={() => navigate('/submit')}
              className="yowon-btn-primary h-9 text-xs flex items-center gap-2"
            >
              <Plus size={14} /> Connect Repository
            </button>
          </div>
        </div>
      </section>

      {/* Compare Modal */}
      {compareMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0c0d12] border border-white/[0.08] w-full max-w-2xl rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-white/[0.05]">
              <span className="text-sm font-bold uppercase tracking-wider text-white">Compare Codebase Performance</span>
              <button onClick={() => { setCompareMode(false); setCompareResult(null); }} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase">Base Repository</label>
                <select
                  value={compareBaseId}
                  onChange={e => setCompareBaseId(e.target.value)}
                  className="w-full bg-[#12131a] border border-white/[0.08] text-white rounded-lg h-9 px-3 outline-none"
                >
                  <option value="">Select Base</option>
                  {repositories.map(r => <option key={r.uuid} value={r.uuid}>{r.full_name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase">Target Repository</label>
                <select
                  value={compareTargetId}
                  onChange={e => setCompareTargetId(e.target.value)}
                  className="w-full bg-[#12131a] border border-white/[0.08] text-white rounded-lg h-9 px-3 outline-none"
                >
                  <option value="">Select Target</option>
                  {repositories.map(r => <option key={r.uuid} value={r.uuid}>{r.full_name}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={executeCompare}
              disabled={comparing || !compareBaseId || !compareTargetId}
              className="w-full yowon-btn-primary h-10"
            >
              {comparing ? 'Calculating Deltas...' : 'Calculate Similarity Matrix'}
            </button>

            {compareResult && (
              <div className="space-y-4 pt-3 border-t border-white/[0.05] font-sans">
                <div className="flex justify-between items-center bg-cyan-400/5 border border-cyan-400/10 p-4 rounded-xl">
                  <span className="text-zinc-400 text-xs">VCS Code Similarity Match</span>
                  <span className="text-xl font-bold font-mono text-cyan-400">{compareResult.similarity_score}%</span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  <div className="bg-[#12131a] p-3 rounded-lg border border-white/[0.04] space-y-1">
                    <span className="text-zinc-500 text-[10px] block uppercase">Health Score Difference</span>
                    <span className={`font-bold font-mono text-sm block ${compareResult.delta.health_diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {compareResult.delta.health_diff >= 0 ? '+' : ''}{compareResult.delta.health_diff}%
                    </span>
                  </div>
                  <div className="bg-[#12131a] p-3 rounded-lg border border-white/[0.04] space-y-1">
                    <span className="text-zinc-500 text-[10px] block uppercase">Remediation Delta</span>
                    <span className={`font-bold font-mono text-sm block ${compareResult.delta.tech_debt_diff <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {compareResult.delta.tech_debt_diff > 0 ? '+' : ''}{compareResult.delta.tech_debt_diff} hrs
                    </span>
                  </div>
                  <div className="bg-[#12131a] p-3 rounded-lg border border-white/[0.04] space-y-1">
                    <span className="text-zinc-500 text-[10px] block uppercase">Coverage Variance</span>
                    <span className={`font-bold font-mono text-sm block ${compareResult.delta.coverage_diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {compareResult.delta.coverage_diff >= 0 ? '+' : ''}{compareResult.delta.coverage_diff}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Executive Portfolio Dashboard Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* KPI metrics */}
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Repositories', value: totalRepos, color: 'text-blue-400' },
            { label: 'Portfolio Health', value: `${avgHealth}%`, color: 'text-cyan-400' },
            { label: 'Portfolio Technical Debt', value: `${avgTechDebt} hrs`, color: 'text-violet-400' },
            { label: 'Remediation Cost', value: `$${totalRemediationCost}`, color: 'text-emerald-400' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.01] border border-white/[0.06] rounded-xl p-4 space-y-1">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">{stat.label}</span>
              <span className={`text-2xl font-bold block ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Health Ring Summary */}
        <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-5 flex items-center justify-between gap-6">
          <div className="w-16 h-16 shrink-0">
            <ScoreRing score={avgHealth} size={64} />
          </div>
          <div className="space-y-1 min-w-0">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Average health index</span>
            <span className="text-xl font-bold text-white block">{avgHealth}%</span>
            <p className="text-[9px] text-zinc-500 leading-snug font-sans">
              Codebases scoring above 80% are cleared for production deployment.
            </p>
          </div>
        </div>
      </section>

      {/* Repository Filter Toolbar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01] border border-white/[0.06] rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Org Selector */}
          <div className="flex items-center gap-1 bg-[#12131a] border border-white/[0.08] rounded-xl px-3 h-9">
            <Building2 size={12} className="text-zinc-500" />
            <select
              value={selectedOrg}
              onChange={e => setSelectedOrg(e.target.value)}
              className="bg-transparent text-white outline-none border-none pr-6 text-xs"
            >
              <option value="all">All Organizations</option>
              {orgs.map(org => <option key={org} value={org}>{org}</option>)}
            </select>
          </div>

          {/* Lang Selector */}
          <div className="flex items-center gap-1 bg-[#12131a] border border-white/[0.08] rounded-xl px-3 h-9">
            <Sliders size={12} className="text-zinc-500" />
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-white outline-none border-none pr-6 text-xs"
            >
              <option value="all">All Languages</option>
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#12131a] border border-white/[0.08] rounded-xl px-3 h-9 max-w-sm w-full">
          <Search size={14} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder="Search codebases..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-white w-full text-xs"
          />
        </div>
      </section>

      {/* Bulk Operations action panel */}
      {selectedRepoIds.length > 0 && (
        <section className="bg-cyan-400/5 border border-cyan-400/20 rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-xs">{selectedRepoIds.length} repositories selected</span>
            {bulkActionStatus && <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">{bulkActionStatus}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkSync}
              disabled={bulkActionLoading}
              className="yowon-btn-secondary h-8 text-[11px]"
            >
              Sync Selected
            </button>
            <button
              onClick={handleBulkEvaluate}
              disabled={bulkActionLoading}
              className="yowon-btn-primary h-8 text-[11px]"
            >
              Evaluate Selected
            </button>
          </div>
        </section>
      )}

      {/* Repository Explorer Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Repositories</h2>
          <button
            onClick={handleSelectAll}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {selectedRepoIds.length === filteredRepos.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-600 animate-pulse font-mono">Synchronizing workspace metadata...</div>
        ) : filteredRepos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepos.map(repo => {
              const rStats = repo.statistics || { health_score: 100, risk_index: 0, coverage: 0, technical_debt: 0, estimated_remediation_cost: 0 }
              const isSelected = selectedRepoIds.includes(repo.uuid)
              
              return (
                <div
                  key={repo.uuid}
                  className={`bg-white/[0.01] border rounded-2xl p-5 hover:bg-white/[0.02] hover:border-white/10 transition-all space-y-4 cursor-pointer relative ${
                    isSelected ? 'border-cyan-400/40 bg-cyan-400/[0.01]' : 'border-white/[0.06]'
                  }`}
                  onClick={() => navigate(`/repositories/${repo.uuid}`)}
                >
                  {/* Checkbox trigger overlay */}
                  <div
                    onClick={e => { e.stopPropagation(); handleToggleSelect(repo.uuid); }}
                    className="absolute top-4 right-4 w-4 h-4 rounded border border-white/20 flex items-center justify-center hover:border-white/40 cursor-pointer"
                  >
                    {isSelected && <div className="w-2.5 h-2.5 bg-cyan-400 rounded-sm" />}
                  </div>

                  {/* Header info */}
                  <div className="space-y-1.5 pr-6">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                        {repo.organization?.login || 'Personal'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate font-display">{repo.name}</h3>
                    <p className="text-[10px] text-zinc-500 font-sans line-clamp-2 h-7 leading-relaxed">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 border-t border-b border-white/[0.03] py-3 text-[10px] font-mono">
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Health Score</span>
                      <span className="font-bold text-cyan-400 block">{rStats.health_score}%</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Coverage</span>
                      <span className="font-bold text-blue-400 block">{rStats.coverage}%</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Remediation Cost</span>
                      <span className="font-bold text-emerald-400 block">${rStats.estimated_remediation_cost}</span>
                    </div>
                  </div>

                  {/* Language and stars strip */}
                  <div className="flex justify-between items-center text-[10px] text-zinc-500">
                    <div className="flex items-center gap-3">
                      {repo.language && (
                        <span className="font-mono text-cyan-400">{repo.language}</span>
                      )}
                      {repo.private ? <Lock size={10} /> : <Unlock size={10} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5"><Star size={10} /> {repo.stars_count}</span>
                      <span className="flex items-center gap-0.5"><GitFork size={10} /> {repo.forks_count}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center text-zinc-600 font-mono italic">
            No repositories found matching current filters.
          </div>
        )}
      </section>
    </div>
  )
}
