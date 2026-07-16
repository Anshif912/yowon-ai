import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderGit2,
  GitBranch,
  Brain,
  Dna,
  Play,
  FileText,
  Shield,
  Clock,
  History,
  Settings,
  Search,
  RefreshCw,
  Sparkles,
  GitCommit,
  Layers,
  ChevronRight,
  Send,
  MessageSquare,
  Pin,
  Paperclip,
  CheckCircle,
  Copy,
  Check,
  UserCheck,
  AlertTriangle,
  Info
} from 'lucide-react'
import { api } from '../api/api'

interface ProjectDetails {
  id: string
  workspace_id?: string
  team_id?: string
  name: string
  slug?: string
  project_type: string
  description?: string
  github_url?: string
  visibility: string
  tags?: string
  category?: string
  repository_url?: string
  default_branch?: string
  current_version: string
  status: string
  created_at: string
  updated_at: string
}

interface RepoDetails {
  repository_url?: string
  default_branch?: string
  connection_status: string
  webhook_enabled: boolean
  last_sync_at: string
  last_commit_message?: string
  repository_size: number
  contributors: number
  commit_count: number
}

interface OwnershipRecord {
  uuid: string
  owner_id?: string
  team_id?: string
  ownership_type: string
  ownership_percentage: number
  verification_status: string
  joined_date: string
  notes?: string
}

interface TimelineItem {
  event_type: string
  description: string
  timestamp: string
}

interface CommentItem {
  uuid: string
  user_id: string
  content: string
  is_pinned: boolean
  is_resolved: boolean
  created_at: string
  replies?: CommentItem[]
}

interface SearchItem {
  entity_type: string
  entity_id: string
  title: string
  subtitle?: string
  snippet?: string
  url: string
}

export default function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<
    'overview' | 'repository' | 'intelligence' | 'dna' | 'evaluation' | 'jury' | 'ownership' | 'timeline' | 'activity' | 'settings'
  >('overview')

  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [repoDetails, setRepoDetails] = useState<RepoDetails | null>(null)
  const [ownershipRecords, setOwnershipRecords] = useState<OwnershipRecord[]>([])
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [comments, setComments] = useState<CommentItem[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchItem[]>([])
  const [searching, setSearching] = useState(false)

  // Sync state
  const [syncingRepo, setSyncingRepo] = useState(false)

  // Evaluation trigger state
  const [evalTriggering, setEvalTriggering] = useState(false)

  // Ownership forms
  const [claimReason, setClaimReason] = useState('')
  const [claimEvidence, setClaimEvidence] = useState('')
  const [claimSubmitting, setClaimSubmitting] = useState(false)

  const [transferRecipient, setTransferRecipient] = useState('')
  const [transferCode, setTransferCode] = useState('')
  const [generatedTxCode, setGeneratedTxCode] = useState('')
  const [copiedTx, setCopiedTx] = useState(false)
  const [creatingTx, setCreatingTx] = useState(false)
  const [acceptingTx, setAcceptingTx] = useState(false)

  // Comments form
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Project Settings form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [projectType, setProjectType] = useState('Hackathon Project')
  const [visibility, setVisibility] = useState('PRIVATE')
  const [githubUrl, setGithubUrl] = useState('')
  const [tags, setTags] = useState('')
  const [category, setCategory] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`)
      setProject(res.data)
      setName(res.data.name)
      setDescription(res.data.description || '')
      setProjectType(res.data.project_type)
      setVisibility(res.data.visibility)
      setGithubUrl(res.data.github_url || '')
      setTags(res.data.tags || '')
      setCategory(res.data.category || '')
      
      // Fetch repository details if connected
      if (res.data.repository_url) {
        try {
          const repoRes = await api.get(`/projects/${projectId}/repository`)
          setRepoDetails(repoRes.data)
        } catch {
          setRepoDetails(null)
        }
      }
    } catch {
      navigate('/projects')
    }
  }

  const fetchOwnership = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/ownership`)
      setOwnershipRecords(res.data || [])
    } catch {}
  }

  const fetchTimeline = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/timeline`)
      setTimeline(res.data || [])
    } catch {}
  }

  const fetchComments = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/comments`)
      setComments(res.data || [])
    } catch {}
  }

  const fetchActivity = async () => {
    try {
      // Feed from audits logs target
      const res = await api.get(`/projects/${projectId}/timeline`) // re-uses timeline or audits
      setActivityLogs(res.data || [])
    } catch {}
  }

  const refreshAll = async () => {
    setLoading(true)
    await Promise.all([
      fetchProject(),
      fetchOwnership(),
      fetchTimeline(),
      fetchComments(),
      fetchActivity()
    ])
    setLoading(false)
  }

  useEffect(() => {
    if (projectId) {
      refreshAll()
    }
  }, [projectId])

  const handleSyncRepository = async () => {
    if (!project?.github_url) return
    setSyncingRepo(true)
    try {
      await api.post(`/projects/${projectId}/import`, {
        repository_url: project.github_url,
        default_branch: 'main'
      })
      await refreshAll()
      alert('Repository connection metadata synced successfully!')
    } catch {
      alert('Failed to sync repository connection')
    } finally {
      setSyncingRepo(false)
    }
  }

  const handleTriggerEvaluation = async () => {
    setEvalTriggering(true)
    try {
      await api.post(`/evaluate/${projectId}`)
      await refreshAll()
      alert('AI Evaluation engine started successfully!')
    } catch {
      alert('Failed to trigger evaluation')
    } finally {
      setEvalTriggering(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await api.get(`/projects/${projectId}/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchResults(res.data || [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) return
    setSubmittingComment(true)
    try {
      await api.post(`/projects/${projectId}/comments`, {
        content: commentContent
      })
      setCommentContent('')
      await fetchComments()
    } catch {
      alert('Failed to post comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimReason.trim()) return
    setClaimSubmitting(true)
    try {
      await api.post(`/projects/${projectId}/ownership/request`, {
        reason: claimReason,
        supporting_evidence: claimEvidence
      })
      setClaimReason('')
      setClaimEvidence('')
      await refreshAll()
      alert('Ownership claim request queued. Auto-conflict analysis generated manual review ticket.')
    } catch {
      alert('Failed to submit claim request')
    } finally {
      setClaimSubmitting(false)
    }
  }

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferRecipient.trim()) return
    setCreatingTx(true)
    setGeneratedTxCode('')
    try {
      const res = await api.post(`/projects/${projectId}/ownership/transfer`, {
        recipient_id: transferRecipient
      })
      setGeneratedTxCode(res.data.verification_code)
      setTransferRecipient('')
      await fetchOwnership()
    } catch {
      alert('Failed to initiate transfer. Ensure you are the verified project owner.')
    } finally {
      setCreatingTx(false)
    }
  }

  const handleAcceptTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferCode.trim()) return
    setAcceptingTx(true)
    try {
      await api.post(`/projects/${projectId}/ownership/transfer?code=${transferCode}`)
      setTransferCode('')
      await refreshAll()
      alert('Secure transfer completed. Ownership registry shifted.')
    } catch {
      alert('Invalid or expired transfer code.')
    } finally {
      setAcceptingTx(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await api.put(`/projects/${projectId}`, {
        name,
        description,
        project_type: projectType,
        visibility,
        github_url: githubUrl,
        tags,
        category
      })
      await fetchProject()
      alert('Project registry updated successfully!')
    } catch {
      alert('Failed to update project settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Are you absolutely sure you want to delete this project registry? This is logged in immutable audits.')) return
    try {
      await api.delete(`/projects/${projectId}`)
      navigate('/projects')
    } catch {
      alert('Failed to delete project')
    }
  }

  if (loading || !project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-white font-mono text-xs">
        <div className="h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Initializing Project Workspace Operating System...</span>
      </div>
    )
  }

  // Radial gauge calculation
  const totalPercentage = ownershipRecords.reduce((sum, r) => sum + r.ownership_percentage, 0)
  const primaryOwnerShare = ownershipRecords[0]?.ownership_percentage || 0
  const circumference = 2 * Math.PI * 40 // radius 40
  const strokeDashoffset = circumference - (primaryOwnerShare / 100) * circumference

  return (
    <div className="flex-1 flex min-h-0 bg-[#05070a] font-mono text-xs text-white">
      
      {/* ── Left-hand Project Sub-Sidebar (OS Shell Navigation) ── */}
      <div className="w-56 border-r border-white/5 bg-[#07090e] flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-4">
          
          {/* Project Identity */}
          <div className="space-y-1 pb-3 border-b border-white/5">
            <span className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold">Project OS v1.2</span>
            <h2 className="text-sm font-bold text-white font-display truncate">{project.name}</h2>
            <div className="flex items-center gap-1.5 text-yowon-muted text-[10px] truncate">
              <span className={`h-1.5 w-1.5 rounded-full ${project.status === 'REGISTERED' ? 'bg-zinc-500' : 'bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.6)]'}`}></span>
              <span>{project.status}</span>
            </div>
          </div>

          {/* OS Navigation Links */}
          <div className="space-y-1.5">
            {([
              { id: 'overview', label: 'Overview', icon: FolderGit2, color: '#3B82F6', badge: undefined },
              { id: 'repository', label: 'Repository', icon: GitBranch, color: '#8B5CF6', badge: undefined },
              { id: 'intelligence', label: 'Intelligence', icon: Brain, color: '#00E5FF', badge: undefined },
              { id: 'dna', label: 'Project DNA', icon: Dna, color: '#A855F7', badge: 'RESERVED' },
              { id: 'evaluation', label: 'AI Evaluation', icon: Play, color: '#10B981', badge: undefined },
              { id: 'jury', label: 'Jury Verdict', icon: FileText, color: '#EAB308', badge: undefined },
              { id: 'ownership', label: 'Ownership', icon: Shield, color: '#EF4444', badge: undefined },
              { id: 'timeline', label: 'Timeline & Feed', icon: Clock, color: '#6366F1', badge: undefined },
              { id: 'activity', label: 'Audit Logs', icon: History, color: '#F97316', badge: undefined },
              { id: 'settings', label: 'Settings', icon: Settings, color: '#71717A', badge: undefined }
            ] as { id: 'overview' | 'repository' | 'intelligence' | 'dna' | 'evaluation' | 'jury' | 'ownership' | 'timeline' | 'activity' | 'settings', label: string, icon: any, color: string, badge?: string }[]).map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                    active 
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold shadow-[inset_0_0_12px_rgba(0,229,255,0.05)]' 
                      : 'text-yowon-muted hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon size={13} style={{ color: active ? '#00E5FF' : tab.color }} />
                    <span className="font-display truncate text-[11px]">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="bg-white/5 border border-white/10 text-white/40 text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

        </div>

        {/* Sync Trigger shortcut */}
        {project.github_url && (
          <button
            onClick={handleSyncRepository}
            disabled={syncingRepo}
            className="w-full flex items-center justify-center gap-2 py-2 border border-white/5 rounded-lg text-yowon-muted hover:text-white hover:bg-white/5 transition-colors font-display disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncingRepo ? 'animate-spin text-cyan-400' : ''} />
            <span>Sync Source</span>
          </button>
        )}
      </div>

      {/* ── Right-hand Panel Content (Updates without full reload) ── */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 flex flex-col justify-between">
        
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="border border-white/5 rounded-xl bg-gradient-to-b from-white/[0.01] to-transparent p-5 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="glass-pill px-2.5 py-0.5 border-cyan-500/10 text-cyan-400">{project.project_type}</span>
                  <h3 className="text-xl font-bold font-display text-white mt-2">{project.name}</h3>
                  <p className="text-yowon-muted mt-2 leading-relaxed text-[11px]">{project.description || 'No description provided.'}</p>
                </div>
                <div className="text-right">
                  <span className="text-white/30 text-[9px] uppercase tracking-wider">Registry Version</span>
                  <div className="text-lg font-bold font-display mt-0.5 text-cyan-400">{project.current_version}</div>
                </div>
              </div>

              {/* Tag system */}
              {project.tags && (
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                  {project.tags.split(',').map((t, idx) => (
                    <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] text-yowon-muted">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-white/5 rounded-xl bg-[#07090e] p-4 flex items-center justify-between">
                <div>
                  <span className="text-yowon-muted text-[10px] uppercase">Visibility</span>
                  <h4 className="text-sm font-semibold font-display mt-1 text-white">{project.visibility}</h4>
                </div>
                <Shield className="text-cyan-400 opacity-60" size={20} />
              </div>

              <div className="border border-white/5 rounded-xl bg-[#07090e] p-4 flex items-center justify-between">
                <div>
                  <span className="text-yowon-muted text-[10px] uppercase">Category</span>
                  <h4 className="text-sm font-semibold font-display mt-1 text-white truncate max-w-[120px]">{project.category || 'General'}</h4>
                </div>
                <Layers className="text-cyan-400 opacity-60" size={20} />
              </div>

              <div className="border border-white/5 rounded-xl bg-[#07090e] p-4 flex items-center justify-between">
                <div>
                  <span className="text-yowon-muted text-[10px] uppercase">Registered</span>
                  <h4 className="text-sm font-semibold font-display mt-1 text-white">{new Date(project.created_at).toLocaleDateString()}</h4>
                </div>
                <Clock className="text-cyan-400 opacity-60" size={20} />
              </div>
            </div>

          </div>
        )}

        {activeTab === 'repository' && (
          <div className="space-y-6">
            <div className="border border-white/5 rounded-xl bg-white/[0.01] p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-sm font-semibold font-display text-white">Source Connection Details</h3>
                {project.github_url && (
                  <button
                    onClick={handleSyncRepository}
                    disabled={syncingRepo}
                    className="yowon-btn-primary flex items-center gap-2 text-xs font-display disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={syncingRepo ? 'animate-spin' : ''} />
                    <span>Sync Now</span>
                  </button>
                )}
              </div>

              {!repoDetails ? (
                <div className="space-y-3 p-4 border border-white/5 rounded-xl text-center">
                  <p className="text-yowon-muted">No repository connected to this registry project.</p>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    Configure GitHub Url →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Sync status */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-yowon-muted text-[9px] uppercase tracking-wider">GitHub Url</span>
                      <p className="text-white text-xs font-semibold truncate select-all">{repoDetails.repository_url}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-yowon-muted text-[9px] uppercase tracking-wider">Active Status</span>
                        <p className="text-emerald-400 text-xs font-bold">{repoDetails.connection_status}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-yowon-muted text-[9px] uppercase tracking-wider">Webhook Sync</span>
                        <p className="text-white text-xs font-semibold">{repoDetails.webhook_enabled ? 'Active Webhook' : 'Manual only'}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-yowon-muted text-[9px] uppercase tracking-wider">Last Sync Timestamp</span>
                      <p className="text-white/70 text-[10px]">{new Date(repoDetails.last_sync_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Commit stats */}
                  <div className="space-y-4 border-l border-white/5 pl-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-yowon-muted text-[9px] uppercase tracking-wider">Commit count</span>
                        <p className="text-white text-sm font-bold font-display">{repoDetails.commit_count}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-yowon-muted text-[9px] uppercase tracking-wider">Repository Size</span>
                        <p className="text-white text-sm font-bold font-display">{(repoDetails.repository_size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-yowon-muted text-[9px] uppercase tracking-wider">Last Commit Message</span>
                      <div className="flex gap-2 items-start bg-[#05070a] p-3 rounded-lg border border-white/5 text-[10px] text-yowon-muted leading-relaxed">
                        <GitCommit size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>{repoDetails.last_commit_message || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'intelligence' && (
          <div className="space-y-6">
            <div className="border border-white/5 rounded-xl bg-white/[0.01] p-5 space-y-4">
              <h3 className="text-sm font-semibold font-display text-white">Repository Intelligence Hub</h3>
              
              {!repoDetails ? (
                <p className="text-yowon-muted py-6">Connect a repository source to index languages and tech stacks.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Languages distribution */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-white/80">Languages Distribution</h4>
                    <div className="space-y-3">
                      {([
                        { name: 'TypeScript', pct: 72.5, color: '#3178c6' },
                        { name: 'Python', pct: 20.0, color: '#3572A5' },
                        { name: 'HTML', pct: 5.0, color: '#e34c26' },
                        { name: 'CSS', pct: 2.5, color: '#563d7c' }
                      ]).map((lang, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-white/90">{lang.name}</span>
                            <span className="text-yowon-muted font-bold">{lang.pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${lang.pct}%`, backgroundColor: lang.color }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Frameworks & Architectures metadata */}
                  <div className="space-y-4 border-l border-white/5 pl-6">
                    <h4 className="text-xs font-semibold text-white/80">Extracted Stack Configurations</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-yowon-muted text-[9px] uppercase tracking-wider">Frameworks & Tools</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {['React', 'FastAPI', 'TailwindCSS'].map((f, idx) => (
                            <span key={idx} className="glass-pill px-2.5 py-0.5 border-purple-500/15 text-purple-400">{f}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-yowon-muted text-[9px] uppercase tracking-wider">AI & Large Language Models</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {['Gemini Pro', 'Llama 3'].map((m, idx) => (
                            <span key={idx} className="glass-pill px-2.5 py-0.5 border-cyan-500/15 text-cyan-400">{m}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-yowon-muted text-[9px] uppercase tracking-wider">Deployment & Databases</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {['Vercel', 'AWS ECS', 'PostgreSQL', 'Redis'].map((d, idx) => (
                            <span key={idx} className="glass-pill px-2.5 py-0.5 border-emerald-500/15 text-emerald-400">{d}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dna' && (
          <div className="border border-white/5 rounded-xl bg-white/[0.01] p-12 text-center space-y-4">
            <Dna size={40} className="mx-auto text-purple-400 animate-pulse" />
            <h3 className="font-display text-white font-semibold text-sm">Project DNA Diagnostics</h3>
            <p className="text-yowon-muted max-w-sm mx-auto leading-relaxed text-[11px]">
              This capability performs abstract syntax tree (AST) decomposition to graph code logic blocks.
            </p>
            <div className="inline-flex items-center gap-2 glass-pill px-3 py-1 border-purple-500/15 text-purple-400 font-bold uppercase tracking-wider text-[9px]">
              RESERVED FOR PHASE 6
            </div>
          </div>
        )}

        {activeTab === 'evaluation' && (
          <div className="space-y-6">
            <div className="border border-white/5 rounded-xl bg-white/[0.01] p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-sm font-semibold font-display text-white">AI Evaluation Orchestrator</h3>
                <button
                  onClick={handleTriggerEvaluation}
                  disabled={evalTriggering}
                  className="yowon-btn-primary flex items-center gap-2 text-xs font-display bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(0,229,255,0.3)] border-cyan-500/30"
                >
                  <Play size={13} />
                  <span>{evalTriggering ? 'Running Engine...' : 'Trigger Evaluation Run'}</span>
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-yowon-muted leading-relaxed">
                  Triggering an evaluation launches our neural pipeline to parse repository codes, identify security bugs, grade code quality, and output a detailed audit review.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jury' && (
          <div className="space-y-6">
            <div className="border border-white/5 rounded-xl bg-[#07090e] p-5 space-y-4">
              <h3 className="text-sm font-semibold font-display text-white">Jury Consensus Reports</h3>
              <p className="text-yowon-muted leading-relaxed">
                Jury report results present recommendations compile logs from our agentic peer panels.
              </p>
              
              <div className="pt-4 flex justify-start">
                <Link to={`/report/${projectId}`} className="yowon-btn-primary flex items-center gap-2 text-xs font-display">
                  <FileText size={14} /> Open Full Jury Report
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ownership' && (
          <div className="space-y-6">
            
            {/* Radial Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 border border-white/5 rounded-xl bg-white/[0.01] p-5 flex flex-col md:flex-row items-center gap-8">
                
                {/* SVG Radial Chart */}
                <div className="relative h-32 w-32 flex-shrink-0">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#EF4444"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold font-display text-white">{primaryOwnerShare}%</span>
                    <span className="text-[8px] text-yowon-muted uppercase font-bold tracking-wider">Owner Share</span>
                  </div>
                </div>

                {/* Shares registry list */}
                <div className="flex-1 space-y-4 w-full">
                  <h4 className="text-xs font-semibold text-white/80">Asset Share Registry</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {ownershipRecords.length === 0 ? (
                      <p className="text-yowon-muted">No ownership records registered.</p>
                    ) : (
                      ownershipRecords.map((rec) => (
                        <div key={rec.uuid} className="flex justify-between items-center gap-3 bg-[#05070a] p-2.5 rounded-lg border border-white/5">
                          <div>
                            <span className="font-semibold text-white truncate max-w-[120px] block">{rec.owner_id || 'Team/Org Share'}</span>
                            <span className="text-[9px] text-yowon-muted block mt-0.5">{rec.ownership_type} | {rec.verification_status}</span>
                          </div>
                          <span className="font-bold text-red-400 font-display text-sm">{rec.ownership_percentage}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Secure Transfer Panel */}
              <div className="border border-white/5 rounded-xl bg-gradient-to-b from-red-950/10 to-transparent p-5 space-y-4">
                <h3 className="text-sm font-semibold font-display text-white">Secure Transfer</h3>
                <p className="text-yowon-muted text-[10px] leading-relaxed">Securely hand over verified project ownership control using an authorization token.</p>
                
                {/* Initiate Form */}
                <form onSubmit={handleInitiateTransfer} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Recipient ID (User UUID)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. b5f4d1c2..."
                      value={transferRecipient}
                      onChange={(e) => setTransferRecipient(e.target.value)}
                      className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500/40"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingTx}
                    className="w-full py-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-500/20 rounded-lg font-semibold flex items-center justify-center gap-2 font-display transition-colors disabled:opacity-50"
                  >
                    <span>{creatingTx ? 'Generating...' : 'Initiate Transfer'}</span>
                  </button>
                </form>

                {/* Show Tx Code */}
                {generatedTxCode && (
                  <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg space-y-1">
                    <span className="text-[9px] text-yowon-muted uppercase font-bold tracking-wider">Transfer Code</span>
                    <div className="flex items-center justify-between gap-2 bg-[#05070a] px-3 py-1 rounded-lg border border-white/5">
                      <span className="font-semibold text-white select-all">{generatedTxCode}</span>
                      <button onClick={() => {
                        navigator.clipboard.writeText(generatedTxCode)
                        setCopiedTx(true)
                        setTimeout(() => setCopiedTx(false), 2000)
                      }} className="text-red-400 hover:text-red-300">
                        {copiedTx ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Accept Code Form */}
                <div className="pt-3 border-t border-white/5">
                  <form onSubmit={handleAcceptTransfer} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Have a Transfer Code?</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TX-ABC123"
                        value={transferCode}
                        onChange={(e) => setTransferCode(e.target.value)}
                        className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500/40"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={acceptingTx}
                      className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 font-display transition-colors disabled:opacity-50"
                    >
                      <span>{acceptingTx ? 'Accepting...' : 'Accept Transfer'}</span>
                    </button>
                  </form>
                </div>

              </div>

            </div>

            {/* Claims Request and Conflicts Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Claims Request Form */}
              <div className="border border-white/5 rounded-xl bg-white/[0.01] p-5 space-y-4">
                <h3 className="text-sm font-semibold font-display text-white">Ownership Claim Submission</h3>
                <p className="text-yowon-muted text-[10px] leading-relaxed">If you are the original developer, submit a claim registry. Conflicting claims trigger review verification cycles.</p>
                
                <form onSubmit={handleSubmitClaim} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Reason for Claim</label>
                    <textarea
                      required
                      placeholder="Explain details of author registry..."
                      value={claimReason}
                      onChange={(e) => setClaimReason(e.target.value)}
                      rows={2}
                      className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Evidence (commit authors, Git logs link)</label>
                    <input
                      type="text"
                      placeholder="e.g. Git commit signatures matching GPG key"
                      value={claimEvidence}
                      onChange={(e) => setClaimEvidence(e.target.value)}
                      className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={claimSubmitting}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold border border-cyan-500/20 font-display disabled:opacity-50"
                  >
                    <span>{claimSubmitting ? 'Submitting...' : 'File Registry Claim'}</span>
                  </button>
                </form>
              </div>

              {/* Conflict resolution explanation */}
              <div className="border border-white/5 rounded-xl bg-white/[0.01] p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-display font-semibold">
                    <UserCheck size={16} />
                    <span>Governance Disputes Queue</span>
                  </div>
                  <p className="text-yowon-muted leading-relaxed text-[11px]">
                    To maintain business asset continuity, claims targeting projects that already contain verified owners are flagged as disputes. The AI similarity model assesses commit matches and escalates validation tickets to the Admin console.
                  </p>
                </div>
                <div className="flex gap-2 items-start bg-cyan-500/5 p-3 rounded-lg border border-cyan-500/10 text-[10px] text-yowon-muted mt-4">
                  <Info size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Verified assets receive the "Jury Approved" priority badge in the leaderboard registry.</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Timeline log */}
            <div className="lg:col-span-2 border border-white/5 rounded-xl bg-white/[0.01] p-5 space-y-4">
              <h3 className="text-sm font-semibold font-display text-white">Project Timeline Feed</h3>
              
              {timeline.length === 0 ? (
                <p className="text-yowon-muted py-6">No registry events logged.</p>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                  {timeline.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start pl-6 relative">
                      <div className="absolute left-[5px] top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.8)]"></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-semibold text-white">{item.event_type}</span>
                          <span className="text-[9px] text-white/30">{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-yowon-muted text-[10px]">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discussions and Threaded comments */}
            <div className="border border-white/5 rounded-xl bg-white/[0.01] p-5 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold font-display text-white">Team Discussions</h3>
                
                {/* Scrollable list */}
                <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                  {comments.length === 0 ? (
                    <p className="text-yowon-muted text-center py-6">No discussions yet. Post a thread to coordinate.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.uuid} className="bg-[#07090e] p-3 rounded-lg border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-[9px] text-white/40">
                          <span className="font-semibold text-cyan-400">{c.user_id}</span>
                          <span>{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-white/80 leading-relaxed">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Comment Post Form */}
              <form onSubmit={handlePostComment} className="flex gap-2 border-t border-white/5 pt-3">
                <input
                  type="text"
                  required
                  placeholder="Post thread annotation..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="flex-1 bg-[#05070a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                />
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white border border-cyan-500/20 disabled:opacity-50"
                >
                  <Send size={12} />
                </button>
              </form>

            </div>

          </div>
        )}

        {activeTab === 'activity' && (
          <div className="border border-white/5 rounded-xl bg-white/[0.01] p-5 space-y-4">
            <h3 className="text-sm font-semibold font-display text-white">Immutable Ledger Audit Logs</h3>
            <p className="text-yowon-muted text-[10px] pb-2 border-b border-white/5 font-mono">Ledger hashes, webhook actions, evaluations outputs, and ownership adjustments tracker.</p>
            
            {activityLogs.length === 0 ? (
              <p className="text-yowon-muted py-6">No audits compiled.</p>
            ) : (
              <div className="space-y-3">
                {activityLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-4 items-start pb-3 border-b border-white/5 last:border-0">
                    <Clock className="text-cyan-400 opacity-60 flex-shrink-0 mt-0.5" size={13} />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-white">{log.event_type}</span>
                        <span className="text-[9px] text-white/30">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-yowon-muted text-[10px]">{log.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Edit metadata */}
            <div className="lg:col-span-2 border border-white/5 rounded-xl bg-white/[0.01] p-5 space-y-5">
              <h3 className="text-sm font-semibold font-display text-white">Project Settings</h3>
              
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Project Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Project Aegis"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Web App"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Description</label>
                  <textarea
                    placeholder="Brief description of the codebase functionality..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-yowon-muted">GitHub Repository Url</label>
                    <input
                      type="url"
                      placeholder="https://github.com/yowon-ai/..."
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Visibility Settings</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                    >
                      <option value="PRIVATE">Private (Workspace Isolation)</option>
                      <option value="INTERNAL">Internal (Workspace members read)</option>
                      <option value="PUBLIC">Public (Leaderboard visibility)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. security, ast, ledger"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold border border-cyan-500/20 font-display disabled:opacity-50"
                >
                  {savingSettings ? 'Saving Changes...' : 'Save Registry Changes'}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-500/10 rounded-xl bg-red-950/[0.02] p-5 space-y-4">
              <div className="flex items-center gap-2 text-red-400 font-display font-semibold">
                <AlertTriangle size={14} />
                <span>Danger Zone</span>
              </div>
              <p className="text-yowon-muted text-[10px] leading-relaxed">
                Deleting this registry removes all commit indices, discussions, evaluation runs, and ownership history permanently.
              </p>
              <button
                onClick={handleDeleteProject}
                className="w-full py-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded-lg font-semibold border border-red-500/20 flex items-center justify-center gap-2 transition-colors font-display"
              >
                <span>Delete Project Registry</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
