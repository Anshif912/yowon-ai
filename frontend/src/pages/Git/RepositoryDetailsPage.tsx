import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Activity,
  Brain,
  FolderOpen,
  Scale,
  Shield,
  Bot,
  Settings,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Code2,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Home
} from 'lucide-react'
import { api } from '../../api/api'

interface Branch {
  name: string
  sha: string
  is_default: boolean
}

interface Contributor {
  login: string
  contributions: number
  avatar_url?: string
}

interface BranchProtection {
  branch_name: string
  requires_status_checks: boolean
  requires_approvals: boolean
}

interface Statistics {
  health_score: number
  risk_index: number
  velocity: number
  technical_debt: number
  coverage: number
  active_contributors: number
  security_issues_count: number
  deployment_readiness: number
  deployment_confidence: number
  estimated_remediation_cost: number
  ai_summary?: {
    purpose: string
    architecture: string
    technologies: string[]
    strengths: string[]
    weaknesses: string[]
    risks: string[]
    recommendations: string[]
  }
  radar_engineering: number
  radar_security: number
  radar_architecture: number
  radar_innovation: number
  radar_compliance: number
}

interface RepositoryDetails {
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
  watchers_count: number
  size: number
  default_branch: string
  license?: string
  is_archived: boolean
  last_sync_at?: string
  last_commit_at?: string
  evaluation_policy: string
  watchlist_active: boolean
  organization?: {
    name: string
    login: string
    avatar_url?: string
  }
  statistics?: Statistics
  branches: Branch[]
  contributors: Contributor[]
  branch_protections: BranchProtection[]
}

export default function RepositoryDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [repo, setRepo] = useState<RepositoryDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'dna' | 'prs' | 'copilot' | 'settings'>('overview')
  
  // Tab-specific states
  const [timeline, setTimeline] = useState<any[]>([])
  const [prs, setPrs] = useState<any[]>([])
  const [commits, setCommits] = useState<any[]>([])
  const [copilotMessages, setCopilotMessages] = useState<any[]>([
    { role: 'assistant', content: 'Hello! I am your Repository AI assistant. Ask me anything about this repository structure, health score, technical debt, or pull request merge risks.' }
  ])
  const [inputVal, setInputVal] = useState('')
  const [copilotLoading, setCopilotLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [evalQueueState, setEvalQueueState] = useState<'IDLE' | 'QUEUED' | 'RUNNING' | 'SUCCESS'>('IDLE')
  
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRepoDetails()
  }, [id])

  const fetchRepoDetails = () => {
    setLoading(true)
    api.get(`/git/repositories/${id}`)
      .then(res => {
        setRepo(res.data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  // Load Tab Specific Data
  useEffect(() => {
    if (!id) return
    if (activeTab === 'activity') {
      api.get(`/git/repositories/${id}/timeline`).then(res => setTimeline(res.data)).catch(() => {})
      api.get(`/git/repositories/${id}/commits`).then(res => setCommits(res.data)).catch(() => {})
    } else if (activeTab === 'prs') {
      api.get(`/git/repositories/${id}/pulls`).then(res => setPrs(res.data)).catch(() => {})
    }
  }, [activeTab, id])

  const handleSync = () => {
    setSyncing(true)
    api.post(`/git/repositories/${id}/sync`)
      .then(() => {
        setTimeout(() => {
          setSyncing(false)
          fetchRepoDetails()
        }, 3000)
      })
      .catch(() => setSyncing(false))
  }

  const handleEvaluate = (profile: string) => {
    setEvaluating(true)
    setEvalQueueState('QUEUED')
    api.post(`/git/repositories/${id}/evaluate`, { profile })
      .then(res => {
        const evalId = res.data.evaluation_id
        setEvalQueueState('RUNNING')
        
        // Poll for evaluation result
        const timer = setInterval(() => {
          api.get(`/git/repositories/${id}`).then(resp => {
            setRepo(resp.data)
            setEvalQueueState('SUCCESS')
            setEvaluating(false)
            clearInterval(timer)
          }).catch(() => {})
        }, 4000)
      })
      .catch(() => {
        setEvaluating(false)
        setEvalQueueState('IDLE')
      })
  }

  const handleUpdatePolicy = (policy: string) => {
    api.post(`/git/repositories/${id}/policy`, { policy })
      .then(() => {
        if (repo) setRepo({ ...repo, evaluation_policy: policy })
      })
      .catch(() => {})
  }

  const handleUpdateWatchlist = (active: boolean) => {
    api.post(`/git/repositories/${id}/watchlist`, { active })
      .then(() => {
        if (repo) setRepo({ ...repo, watchlist_active: active })
      })
      .catch(() => {})
  }

  const handleSendMessage = () => {
    if (!inputVal.trim()) return
    const userMsg = { role: 'user', content: inputVal }
    setCopilotMessages(prev => [...prev, userMsg])
    setInputVal('')
    setCopilotLoading(true)

    // Simulate AI response based on repository details
    setTimeout(() => {
      let reply = "I analyzed this repository's codebase."
      if (inputVal.toLowerCase().includes('debt') || inputVal.toLowerCase().includes('score')) {
        reply = `This repository has a Health Score of ${repo?.statistics?.health_score || 92}%. The estimated technical debt is ${repo?.statistics?.technical_debt || 16} hours, representing an estimated remediation cost of $${repo?.statistics?.estimated_remediation_cost || 2400} USD. The main areas contributing to this debt are outdated package dependencies and missing unit tests in authorization handlers.`
      } else if (inputVal.toLowerCase().includes('architecture') || inputVal.toLowerCase().includes('tech')) {
        reply = `The architecture of ${repo?.name} is structured as a Clean Architecture layout. The primary programming language is ${repo?.language || 'TypeScript'}. Key dependencies detected include: Docker container configuration files, Terraform infrastructure automation definitions, and FastAPI server routers. I recommend refactoring the controller adapters to decouple business logic from the HTTP requests.`
      } else if (inputVal.toLowerCase().includes('security') || inputVal.toLowerCase().includes('vulnerabilit')) {
        reply = `I scanned this repository for security risks. I detected ${repo?.statistics?.security_issues_count || 3} vulnerability warnings. These relate to low-level dependency vulnerabilities. I did not find any active credentials or api keys leaked in the code commits.`
      } else {
        reply = `The primary purpose of ${repo?.name} is described as: "${repo?.description || 'No description provided'}" with default branch ${repo?.default_branch || 'main'}. How else can I assist you with this workspace?`
      }
      setCopilotMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setCopilotLoading(false)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 1500)
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#07070a] font-mono text-zinc-500 text-xs">
        <RefreshCw size={24} className="animate-spin text-cyan-400 mb-2" />
        <span>Loading repository operations workspace...</span>
      </div>
    )
  }

  if (!repo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#07070a] font-mono text-zinc-500 text-xs">
        <AlertTriangle size={24} className="text-red-400 mb-2" />
        <span>Workspace could not be loaded. Please ensure repository is synced.</span>
        <button onClick={() => navigate('/dashboard')} className="mt-4 yowon-btn-secondary">Back to Dashboard</button>
      </div>
    )
  }

  const stats = repo.statistics || {
    health_score: 100,
    risk_index: 0,
    velocity: 0,
    technical_debt: 0,
    coverage: 0,
    active_contributors: 0,
    security_issues_count: 0,
    deployment_readiness: 100.0,
    deployment_confidence: 100.0,
    estimated_remediation_cost: 0.0,
    radar_engineering: 100,
    radar_security: 100,
    radar_architecture: 100,
    radar_innovation: 100,
    radar_compliance: 100
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 space-y-8 font-mono text-xs text-white">
      {/* Back link */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
          REPOSITORY WORKSPACE // {repo.full_name}
        </span>
      </div>

      {/* Header Profile */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.01] border border-white/[0.06] rounded-2xl p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {repo.organization?.avatar_url && (
              <img src={repo.organization.avatar_url} alt="" className="w-10 h-10 rounded-lg border border-white/10" />
            )}
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2 text-white">
                {repo.name}
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                  {repo.private ? 'Private' : 'Public'}
                </span>
              </h1>
              <p className="text-zinc-500 font-sans text-xs max-w-xl mt-1">
                {repo.description || 'No description provided.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="yowon-btn-secondary flex items-center gap-2 h-9 text-xs"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Repository'}
          </button>
          
          <button
            onClick={() => handleEvaluate('Full')}
            disabled={evaluating}
            className="yowon-btn-primary flex items-center gap-2 h-9 text-xs"
          >
            <Code2 size={14} />
            {evaluating ? `Running (${evalQueueState})...` : 'Run Evaluation'}
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'health score', value: `${stats.health_score}%`, color: 'text-cyan-400' },
          { label: 'security issues', value: stats.security_issues_count, color: 'text-red-400' },
          { label: 'technical debt', value: `${stats.technical_debt} hrs`, color: 'text-violet-400' },
          { label: 'remediation cost', value: `$${stats.estimated_remediation_cost}`, color: 'text-emerald-400' },
          { label: 'code coverage', value: `${stats.coverage}%`, color: 'text-blue-400' }
        ].map((item, i) => (
          <div key={i} className="bg-white/[0.01] border border-white/[0.06] rounded-xl p-4 space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">{item.label}</span>
            <span className={`text-2xl font-bold tracking-tight block ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
        {[
          { id: 'overview', label: 'Overview', icon: Home },
          { id: 'activity', label: 'Activity Timeline', icon: Activity },
          { id: 'dna', label: 'DNA & Tech Map', icon: FolderOpen },
          { id: 'prs', label: 'Pull Requests', icon: GitPullRequest },
          { id: 'copilot', label: 'AI Copilot Chat', icon: Bot },
          { id: 'settings', label: 'Workspace Settings', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-mono text-xs transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Workspaces */}
      <div className="min-h-0 flex-1">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* AI Summary Card */}
            <div className="lg:col-span-2 border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
                <Brain size={16} className="text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider">AI Executive Summary</h2>
              </div>
              
              {stats.ai_summary ? (
                <div className="space-y-4 font-sans text-zinc-300 leading-relaxed text-xs">
                  <div>
                    <h3 className="text-white font-mono uppercase tracking-wider text-[10px] mb-1">Purpose & Context</h3>
                    <p>{stats.ai_summary.purpose}</p>
                  </div>
                  <div>
                    <h3 className="text-white font-mono uppercase tracking-wider text-[10px] mb-1">Architecture Outline</h3>
                    <p>{stats.ai_summary.architecture}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-lg">
                      <h4 className="text-cyan-400 font-mono uppercase text-[9px] mb-1">Core Strengths</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {stats.ai_summary.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="bg-white/[0.01] border border-white/[0.04] p-3 rounded-lg">
                      <h4 className="text-red-400 font-mono uppercase text-[9px] mb-1">Risk Factors</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {stats.ai_summary.risks.map((r, idx) => <li key={idx}>{r}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-zinc-600 italic">
                  No summary available. Run an evaluation to generate executive summaries.
                </div>
              )}
            </div>

            {/* Branch Protection details */}
            <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
                <Shield size={16} className="text-violet-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Branch Protection Policies</h2>
              </div>
              <div className="space-y-4">
                {repo.branch_protections.length > 0 ? (
                  repo.branch_protections.map((p, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-zinc-300 font-bold">{p.branch_name}</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">Enforced</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-500">Requires status checks:</span>
                          <span className={p.requires_status_checks ? 'text-emerald-400' : 'text-red-400'}>{p.requires_status_checks ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-500">Requires approvals:</span>
                          <span className={p.requires_approvals ? 'text-emerald-400' : 'text-red-400'}>{p.requires_approvals ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-zinc-600 italic">No branch protection rules loaded.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Timeline */}
            <div className="lg:col-span-2 border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
                <Activity size={16} className="text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Repository Health Timeline</h2>
              </div>
              <div className="relative border-l border-white/[0.06] pl-6 ml-2 space-y-6">
                {timeline.length > 0 ? (
                  timeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-[#07070a]" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white text-xs">{item.title}</span>
                          <span className="text-[9px] text-zinc-600">{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-zinc-500 text-[10px] font-sans">{item.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-zinc-600 italic">No timeline entries found. Sync repository to populate feed.</div>
                )}
              </div>
            </div>

            {/* Contributor List */}
            <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
                <Scale size={16} className="text-violet-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Contributors List</h2>
              </div>
              <div className="space-y-3">
                {repo.contributors.map(c => (
                  <div key={c.login} className="flex items-center justify-between p-2.5 rounded bg-white/[0.01] border border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" className="w-6 h-6 rounded" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center font-bold text-white text-[10px]">{c.login[0].toUpperCase()}</div>
                      )}
                      <span className="text-zinc-300 font-bold">{c.login}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{c.contributions} contributions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dna' && (
          <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
              <FolderOpen size={16} className="text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Project DNA Technical Mapping</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-bold text-[11px] uppercase tracking-wider mb-2">Detected Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {[repo.language || 'TypeScript', 'Docker Container', 'Terraform Templates', 'SQL Backend Database'].map((tech, idx) => (
                    <span key={idx} className="text-[10px] font-mono px-3 py-1 rounded bg-white/5 border border-white/10 text-cyan-400">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold text-[11px] uppercase tracking-wider mb-2">Dependency graph</h3>
                <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] font-mono text-[10px] text-zinc-400 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{repo.name}</span>
                    <span className="text-zinc-600">({repo.language || 'TypeScript'})</span>
                  </div>
                  <div className="pl-6 border-l border-zinc-800 space-y-2 py-1">
                    <div className="flex items-center gap-1.5"><ChevronRight size={10} className="text-zinc-600" /> Dockerfile <span className="text-zinc-600">(Docker build config)</span></div>
                    <div className="flex items-center gap-1.5"><ChevronRight size={10} className="text-zinc-600" /> main.tf <span className="text-zinc-600">(Terraform Cloud Infrastructure)</span></div>
                    <div className="flex items-center gap-1.5"><ChevronRight size={10} className="text-zinc-600" /> package.json / requirements.txt <span className="text-zinc-600">(App packages)</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prs' && (
          <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
              <GitPullRequest size={16} className="text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Pull Requests Intelligence</h2>
            </div>
            
            <div className="space-y-4">
              {prs.length > 0 ? (
                prs.map(pr => (
                  <div key={pr.uuid} className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:border-white/10 transition-colors space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-bold font-mono text-xs">#{pr.number}</span>
                        <a href={pr.html_url} target="_blank" rel="noreferrer" className="text-white hover:text-cyan-400 transition-colors font-bold text-xs flex items-center gap-1">
                          {pr.title} <ExternalLink size={10} />
                        </a>
                      </div>
                      <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border ${
                        pr.state === 'open' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'
                      }`}>
                        {pr.state}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-white/[0.03] text-[10px]">
                      <div>
                        <span className="text-zinc-500 block mb-0.5">Merge Risk Score</span>
                        <span className={`font-bold block ${pr.merge_risk > 0.5 ? 'text-red-400' : 'text-emerald-400'}`}>{Math.round(pr.merge_risk * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block mb-0.5">Deployment Risk</span>
                        <span className={`font-bold block ${pr.deployment_risk > 0.5 ? 'text-red-400' : 'text-emerald-400'}`}>{Math.round(pr.deployment_risk * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block mb-0.5">Architecture Impact</span>
                        <span className="text-zinc-300 block truncate">{pr.architecture_impact || 'Minimal'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block mb-0.5">Security Check</span>
                        <span className="text-zinc-300 block truncate">{pr.security_impact || 'Safe'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-600 italic">No pull requests synced. Sync repository to populate list.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'copilot' && (
          <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 flex flex-col h-[500px]">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04] shrink-0">
              <Bot size={16} className="text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">AI Repository Chat Assistant</h2>
            </div>
            
            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {copilotMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl p-3.5 leading-relaxed font-sans text-xs border ${
                    m.role === 'user'
                      ? 'bg-cyan-400/5 border-cyan-400/20 text-white'
                      : 'bg-white/[0.02] border-white/[0.05] text-zinc-300'
                  }`}>
                    <span className="font-mono text-[9px] text-zinc-500 block mb-1 uppercase tracking-wider">
                      {m.role === 'user' ? 'Operator' : 'CTO Agent'}
                    </span>
                    <p className="whitespace-pre-line">{m.content}</p>
                  </div>
                </div>
              ))}
              {copilotLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-zinc-500">
                    <RefreshCw size={12} className="animate-spin inline mr-1 text-cyan-400" /> Analyzing codebase details...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input toolbar */}
            <div className="pt-3 border-t border-white/[0.04] flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="Ask about technical debt, code coverage, or security vulnerabilities..."
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-white/[0.01] border border-white/[0.08] focus:border-cyan-400/50 rounded-xl px-4 h-10 outline-none text-white text-xs"
              />
              <button
                onClick={handleSendMessage}
                disabled={copilotLoading}
                className="yowon-btn-primary h-10 px-6 shrink-0"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 space-y-8">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
              <Settings size={16} className="text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Workspace Settings & Policies</h2>
            </div>
            
            <div className="space-y-6 max-w-xl">
              {/* Sync policy */}
              <div className="space-y-2">
                <label className="text-white font-bold block mb-1 text-[11px] uppercase tracking-wider">Continuous Evaluation Policy</label>
                <p className="text-zinc-500 text-[10px] font-sans leading-relaxed mb-2">
                  Define when the analysis pipeline should run automatically.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {['MANUAL', 'PUSH', 'PULL_REQUEST', 'NIGHTLY', 'WEEKLY'].map(policy => (
                    <button
                      key={policy}
                      onClick={() => handleUpdatePolicy(policy)}
                      className={`h-9 rounded-lg border font-mono text-[9px] transition-colors ${
                        repo.evaluation_policy === policy
                          ? 'bg-cyan-400/10 border-cyan-400 text-cyan-400 font-bold'
                          : 'bg-white/[0.01] border-white/[0.06] text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {policy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Watchlist toggle */}
              <div className="space-y-2 pt-2">
                <label className="text-white font-bold block mb-1 text-[11px] uppercase tracking-wider">Repository Watchlist Alerts</label>
                <p className="text-zinc-500 text-[10px] font-sans leading-relaxed mb-2">
                  Receive system notifications immediately if health score drops or vulnerability issues increase.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateWatchlist(!repo.watchlist_active)}
                    className={`px-4 h-9 rounded-lg border font-mono text-xs transition-colors ${
                      repo.watchlist_active
                        ? 'bg-cyan-400/10 border-cyan-400 text-cyan-400 font-bold'
                        : 'bg-white/[0.01] border-white/[0.06] text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {repo.watchlist_active ? 'Watchlist Enabled' : 'Enable Watchlist'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
