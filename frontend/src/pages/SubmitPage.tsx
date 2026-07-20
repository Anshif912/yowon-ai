import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Github, BarChart3, Zap, AlertCircle, FileStack, Sparkles,
  CheckCircle2, ClipboardCheck, Upload, FileText, ChevronRight,
  X, Eye, Search, Star, GitBranch, Globe, Lock, RefreshCw, Play
} from 'lucide-react'
import FileDropZone from '../components/upload/FileDropZone'
import { uploadProject, triggerEvaluation, api } from '../api/api'
import type { ProjectType } from '../types'

const PROJECT_TYPES: { value: ProjectType; emoji: string }[] = [
  { value: 'Auto Detect',         emoji: '🔍' },
  { value: 'Hackathon Project',   emoji: '⚡' },
  { value: 'University Project',  emoji: '🎓' },
  { value: 'Startup Pitch',       emoji: '🚀' },
  { value: 'Startup Product',     emoji: '💼' },
  { value: 'Research Project',    emoji: '🔬' },
  { value: 'Corporate Project',   emoji: '🏢' },
  { value: 'Enterprise System',   emoji: '⚙️' },
  { value: 'Open Source Project', emoji: '🌐' },
]

const STEPS = [
  { id: 1, label: 'Project Info',   icon: BarChart3 },
  { id: 2, label: 'Upload Assets',  icon: FileStack },
  { id: 3, label: 'Review',         icon: ClipboardCheck },
]

const UPLOAD_PHASES = [
  { label: 'Initializing repository clone...', pct: 25 },
  { label: 'Running Repository Intelligence analysis...', pct: 50 },
  { label: 'Running AI Judge evaluation model...', pct: 75 },
  { label: 'Generating Executive Verdict Dashboard...', pct: 95 },
]

export default function SubmitPage() {
  const navigate   = useNavigate()
  const [activeTab, setActiveTab] = useState<'github' | 'manual'>('github')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [uploadPhase, setUploadPhase] = useState(0)

  // GitHub autopilot state
  const [repos, setRepos] = useState<any[]>([])
  const [loadingRepos, setLoadingRepos] = useState(true)
  const [repoSearch, setRepoSearch] = useState('')
  const [repoLanguage, setRepoLanguage] = useState('all')
  const [importingRepoId, setImportingRepoId] = useState<string | null>(null)

  // Manual Form state
  const [name,       setName]       = useState('')
  const [projectType, setProjectType] = useState<ProjectType>('Hackathon Project')
  const [githubUrl,   setGithubUrl]  = useState('')
  const [pdfFile,     setPdfFile]    = useState<File | null>(null)
  const [pptFile,     setPptFile]    = useState<File | null>(null)

  const fetchRepos = async () => {
    setLoadingRepos(true)
    setError(null)
    try {
      const res = await api.get('/git/repositories')
      setRepos(res.data || [])
    } catch (err: any) {
      console.error(err)
      setError('Failed to load GitHub repository list. Check connector tokens.')
    } finally {
      setLoadingRepos(false)
    }
  }

  useEffect(() => {
    fetchRepos()
  }, [])

  // Local filtering lists
  const filteredRepos = useMemo(() => {
    return repos.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
                            r.full_name.toLowerCase().includes(repoSearch.toLowerCase()) ||
                            (r.description && r.description.toLowerCase().includes(repoSearch.toLowerCase()))
      const matchesLanguage = repoLanguage === 'all' || r.language?.toLowerCase() === repoLanguage.toLowerCase()
      return matchesSearch && matchesLanguage
    })
  }, [repos, repoSearch, repoLanguage])

  // Languages list for filtering
  const languages = useMemo(() => {
    const list = new Set(repos.map(r => r.language).filter(Boolean))
    return ['all', ...Array.from(list)]
  }, [repos])

  const activeStep =
    loading                                                    ? 3 :
    projectType && (githubUrl || pdfFile || pptFile) && name.trim() ? 3 :
    projectType && name.trim()                                 ? 2 :
    1

  const validate = (): string | null => {
    if (!name.trim()) return 'Project name is required'
    if (!githubUrl && !pdfFile && !pptFile) return 'Provide at least a GitHub URL or document'
    if (githubUrl && !/^https?:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/i.test(githubUrl.trim()))
      return 'GitHub URL must be a valid github.com repository URL'
    return null
  }

  // 1-Click autopilot import handler
  const handleImportRepo = async (repo: any) => {
    setImportingRepoId(repo.uuid)
    setLoading(true)
    setError(null)
    setUploadPhase(0)

    try {
      // 1. Create project entry
      const uploadPayload = {
        name: repo.name,
        project_type: 'Hackathon Project' as ProjectType,
        github_url: repo.html_url
      }
      
      const uploadRes = await uploadProject(uploadPayload)
      const projectId = uploadRes.project_id

      // 2. Trigger async pipelines simulation
      setUploadPhase(1)
      await new Promise(r => setTimeout(r, 1200))
      setUploadPhase(2)
      await triggerEvaluation(projectId)
      setUploadPhase(3)
      await new Promise(r => setTimeout(r, 1000))
      
      navigate(`/evaluate/${projectId}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Auto-onboarding evaluation failed')
      setLoading(false)
      setImportingRepoId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) return setError(err)

    setLoading(true)
    setError(null)
    setUploadPhase(0)

    try {
      const { project_id } = await uploadProject({
        name: name.trim(),
        project_type: projectType,
        github_url: githubUrl || undefined,
        pdf_file: pdfFile || undefined,
        ppt_file: pptFile || undefined,
      })
      setUploadPhase(1)
      await new Promise(r => setTimeout(r, 1000))
      setUploadPhase(2)
      await triggerEvaluation(project_id)
      setUploadPhase(3)
      await new Promise(r => setTimeout(r, 1000))
      navigate(`/evaluate/${project_id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Upload evaluation failed')
      setUploadPhase(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
      <div className="relative font-mono text-xs text-white">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 relative">

          {/* Page Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 glass-pill px-3.5 py-1.5 mb-4 border-cyan-300/15">
              <Sparkles size={12} className="text-cyan-300" />
              <span className="text-[10px] font-mono text-yowon-muted uppercase tracking-[0.22em]">
                Evaluation Intake
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Onboard & Evaluate <span className="gradient-text">Repositories</span>
            </h1>
            <p className="text-yowon-muted max-w-lg mx-auto text-sm leading-relaxed font-sans">
              Connect to your codebase assets to trigger automated security audits, code authenticity reports, and judge-grade dashboards.
            </p>
          </motion.div>

          {/* Premium Workflow Tabs */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              type="button"
              onClick={() => setActiveTab('github')}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'github'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
              }`}
            >
              <Github size={13} />
              GitHub Autopilot Onboarding
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
              }`}
            >
              <FileStack size={13} />
              Manual Asset Intake
            </button>
          </div>

          {/* Main Workspace Frame */}
          <AnimatePresence mode="wait">
            {activeTab === 'github' ? (
              <motion.div
                key="github-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Search and Filters Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search synchronized GitHub repositories..."
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      className="bg-[#05070a] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={repoLanguage}
                      onChange={(e) => setRepoLanguage(e.target.value)}
                      className="bg-[#05070a] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="all">All Languages</option>
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>

                    <button
                      onClick={fetchRepos}
                      className="p-2.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Refresh Repositories"
                    >
                      <RefreshCw size={14} className={loadingRepos ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {/* Progress bar overlay during import */}
                {loading && importingRepoId && (
                  <motion.div
                    className="glass-card !p-5 accent-violet border border-cyan-500/20"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-yowon-muted mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border-2 border-cyan-300/30 border-t-cyan-300 animate-spin" />
                        <span>{UPLOAD_PHASES[uploadPhase]?.label ?? 'Processing...'}</span>
                      </div>
                      <span className="text-cyan-300 font-bold">{UPLOAD_PHASES[uploadPhase]?.pct ?? 0}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-violet-500"
                        animate={{ width: `${UPLOAD_PHASES[uploadPhase]?.pct ?? 0}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Errors display */}
                {error && (
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs">
                    <AlertCircle size={15} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-400">✕</button>
                  </div>
                )}

                {/* Repositories Cards Grid */}
                {loadingRepos ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="glass-card h-36 animate-pulse bg-white/[0.01] border-white/5" />
                    ))}
                  </div>
                ) : filteredRepos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRepos.map((repo) => (
                      <motion.div
                        key={repo.uuid}
                        className="glass-card flex flex-col justify-between border-white/5 hover:border-cyan-500/20 transition-all p-5 relative overflow-hidden group"
                        whileHover={{ y: -2 }}
                      >
                        {/* Background glow hover */}
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.01] to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
                        
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5">
                              {repo.organization?.avatar_url ? (
                                <img
                                  src={repo.organization.avatar_url}
                                  alt={repo.organization.login}
                                  className="w-7 h-7 rounded-lg border border-white/10"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center font-bold text-cyan-400 uppercase">
                                  {repo.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h3 className="font-bold text-white text-xs truncate max-w-[220px]">
                                  {repo.full_name}
                                </h3>
                                <p className="text-[9px] text-slate-500 font-mono">
                                  Branch: <span className="text-zinc-400">{repo.default_branch || 'main'}</span>
                                </p>
                              </div>
                            </div>

                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono border bg-[#05070a] border-white/10 text-slate-400">
                              {repo.private ? <Lock size={9} /> : <Globe size={9} />}
                              {repo.private ? 'Private' : 'Public'}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed min-h-[32px] font-sans">
                            {repo.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-3">
                          <div className="flex items-center gap-3 text-slate-500 text-[10px]">
                            {repo.language && (
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Star size={11} className="text-amber-400" />
                              {repo.stars_count || 0}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              Issues: {repo.open_issues_count || 0}
                            </span>
                          </div>

                          <button
                            onClick={() => handleImportRepo(repo)}
                            disabled={loading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg disabled:opacity-40 shadow-[0_0_12px_rgba(34,211,238,0.12)] cursor-pointer transition-all duration-150"
                          >
                            <Play size={10} className="fill-current" />
                            EVALUATE
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card py-16 text-center border-dashed border-white/10">
                    <p className="text-slate-400 italic text-sm">No repositories synchronized.</p>
                    <p className="text-slate-500 text-[11px] mt-1">Try to refresh or register a GitHub connection tunnel in settings.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="manual-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Project Details */}
                  <motion.div
                    className="glass-card !p-6 accent-cyan"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.03] to-transparent pointer-events-none rounded-[inherit]" />
                    <div className="relative z-10">
                      <div className="module-header">
                        <div className="icon-wrap"><BarChart3 size={15} className="text-cyan-300" /></div>
                        <div className="label-group text-left">
                          <span className="eyebrow">Step 1</span>
                          <span className="title">Project Details</span>
                        </div>
                      </div>

                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-xs font-semibold text-yowon-muted mb-2 uppercase tracking-wider">
                            Project Name <span className="text-cyan-300">*</span>
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. MediAssist — AI-Powered Triage App"
                            className="yowon-input"
                            required
                          />
                        </div>

                        {/* Project type select */}
                        <div>
                          <label className="block text-xs font-semibold text-yowon-muted mb-2 uppercase tracking-wider">
                            Project Type <span className="text-cyan-300">*</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {PROJECT_TYPES.map(({ value, emoji }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setProjectType(value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                  projectType === value
                                    ? 'bg-cyan-300/12 border-cyan-300/35 text-cyan-200 shadow-[0_0_12px_rgba(0,229,255,0.12)]'
                                    : 'bg-white/[0.03] border-white/[0.07] text-yowon-muted hover:border-white/12 hover:text-white'
                                }`}
                              >
                                <span>{emoji}</span>
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Code & Links */}
                  <motion.div
                    className="glass-card !p-6"
                    style={{ borderColor: 'rgba(52,211,153,0.18)' }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.03] to-transparent pointer-events-none rounded-[inherit]" />
                    <div className="relative z-10">
                      <div className="module-header">
                        <div className="icon-wrap"><Github size={15} className="text-emerald-400" /></div>
                        <div className="label-group text-left">
                          <span className="eyebrow">Step 2a</span>
                          <span className="title">Code Repository</span>
                        </div>
                      </div>

                      <div className="text-left">
                        <label className="block text-xs font-semibold text-yowon-muted mb-2 uppercase tracking-wider">
                          GitHub Repository URL
                        </label>
                        <div className="relative">
                          <Github size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-yowon-muted" />
                          <input
                            type="url"
                            value={githubUrl}
                            onChange={e => setGithubUrl(e.target.value)}
                            placeholder="https://github.com/username/repository"
                            className="yowon-input pl-10"
                          />
                          {githubUrl && (
                            <motion.div
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2"
                            >
                              {/^https?:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/i.test(githubUrl.trim())
                                ? <CheckCircle2 size={15} className="text-emerald-400" />
                                : <AlertCircle  size={15} className="text-amber-400" />
                              }
                            </motion.div>
                          )}
                        </div>
                        {githubUrl && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            className={`text-[11px] mt-1.5 font-medium ${
                              /^https?:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/i.test(githubUrl.trim())
                                ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {/^https?:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/i.test(githubUrl.trim())
                              ? '✓ Valid GitHub repository URL'
                              : '⚠ Enter a valid github.com/user/repo URL'
                            }
                          </motion.p>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Documents */}
                  <motion.div
                    className="glass-card !p-6 accent-violet"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.03] to-transparent pointer-events-none rounded-[inherit]" />
                    <div className="relative z-10">
                      <div className="module-header">
                        <div className="icon-wrap"><FileStack size={15} className="text-violet-400" /></div>
                        <div className="label-group text-left">
                          <span className="eyebrow">Step 2b</span>
                          <span className="title">Documents</span>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FileDropZone
                          accept=".pdf"
                          label="PDF Presentation"
                          hint="PDF up to 50MB"
                          type="pdf"
                          file={pdfFile}
                          onFile={setPdfFile}
                        />
                        <FileDropZone
                          accept=".pptx,.ppt"
                          label="PowerPoint File"
                          hint="PPTX up to 50MB"
                          type="ppt"
                          file={pptFile}
                          onFile={setPptFile}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Error display */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm text-left"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#F87171' }}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                        <button type="button" onClick={() => setError(null)} className="ml-auto shrink-0">
                          <X size={14} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Upload Progress */}
                  <AnimatePresence>
                    {loading && (
                      <motion.div
                        className="glass-card !p-5 accent-violet"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="flex items-center justify-between text-xs font-mono text-yowon-muted mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border-2 border-cyan-300/30 border-t-cyan-300 animate-spin" />
                            <span>{UPLOAD_PHASES[uploadPhase]?.label ?? 'Processing...'}</span>
                          </div>
                          <span className="text-cyan-300 font-bold">{UPLOAD_PHASES[uploadPhase]?.pct ?? 0}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-violet-500"
                            animate={{ width: `${UPLOAD_PHASES[uploadPhase]?.pct ?? 0}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          {UPLOAD_PHASES.map((phase, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                                i <= uploadPhase ? 'bg-cyan-300' : 'bg-white/15'
                              }`} />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="yowon-btn-primary w-full flex items-center justify-center gap-2 text-sm !py-3.5 cursor-pointer"
                    whileHover={{ scale: loading ? 1 : 1.005 }}
                    whileTap={{ scale: loading ? 1 : 0.995 }}
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Initializing AI Jury...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Evaluate Project
                        <ChevronRight size={16} />
                      </>
                    )}
                  </motion.button>

                  <p className="text-center text-[11px] text-yowon-muted/70 font-mono">
                    Encrypted intake · Parallel agent analysis · Verdict in minutes
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
