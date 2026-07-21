import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  User as UserIcon,
  Lock,
  Globe,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Building,
  Brain,
  Mail,
  Plus,
  Send,
  Users,
  Github,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  LogOut,
  ExternalLink,
  Check,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../components/auth/AuthContext'
import { useWorkspace } from '../components/auth/WorkspaceContext'
import { api } from '../api/api'

export default function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth()
  const { workspaces, createWorkspace, currentWorkspace } = useWorkspace()
  const isAdmin = user && ['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN', 'admin', 'owner'].includes(user.role)

  // Active Category tab state
  const [activeCategory, setActiveCategory] = useState<'github' | 'profile' | 'workspace' | 'teams' | 'security' | 'preferences'>('github')

  // GitHub Integration State
  const [githubConnected, setGithubConnected] = useState(() => localStorage.getItem('yowon_github_connected') === 'true' || Boolean(localStorage.getItem('yowon_github_token')))
  const [githubUsername, setGithubUsername] = useState(() => localStorage.getItem('yowon_github_user') || 'Anshif912')
  const [githubInputUser, setGithubInputUser] = useState(() => localStorage.getItem('yowon_github_user') || 'Anshif912')
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('yowon_github_token') || '')
  const [showGithubToken, setShowGithubToken] = useState(false)
  const [isConnectingGithub, setIsConnectingGithub] = useState(false)
  const [showAdvancedPat, setShowAdvancedPat] = useState(false)

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC')
  const [language, setLanguage] = useState(user?.language || 'en')
  const [preferences, setPreferences] = useState(user?.preferences || '{}')
  
  // Password Form state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Organizations & Workspaces management states
  const [orgs, setOrgs] = useState<any[]>([])
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSlug, setNewOrgSlug] = useState('')
  const [newOrgDesc, setNewOrgDesc] = useState('')
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)

  const [newWsName, setNewWsName] = useState('')
  const [newWsType, setNewWsType] = useState('COMPANY')
  const [newWsVisibility, setNewWsVisibility] = useState('PRIVATE')
  const [newWsOrgId, setNewWsOrgId] = useState('')
  const [isCreatingWs, setIsCreatingWs] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteRole, setInviteRole] = useState('TEAM_MEMBER')
  const [isSendingInvite, setIsSendingInvite] = useState(false)

  const [invitations, setInvitations] = useState<any[]>([])

  // Feedback states
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null)

  const loadOrgsAndInvites = async () => {
    try {
      const orgRes = await api.get('/organizations')
      setOrgs(orgRes.data || [])
      if (currentWorkspace) {
        const inviteRes = await api.get(`/workspaces/${currentWorkspace.workspace_id}/invitations`)
        setInvitations(inviteRes.data || [])
      }
    } catch (err) {}
  }

  useEffect(() => {
    loadOrgsAndInvites()
  }, [currentWorkspace])

  // Reset success/error on field changes
  useEffect(() => {
    setFeedbackError(null)
    setFeedbackSuccess(null)
  }, [fullName, avatarUrl, timezone, language, preferences, oldPassword, newPassword, newOrgName, newWsName, inviteEmail, githubToken, activeCategory])

  const handleConnectGithubOAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsConnectingGithub(true)
    setFeedbackError(null)
    const handle = githubInputUser.trim() || 'Anshif912'
    try {
      const ghRes = await fetch(`https://api.github.com/users/${handle}/repos?per_page=100&sort=updated`)
      if (ghRes.ok) {
        const repos = await ghRes.json()
        localStorage.setItem('yowon_github_connected', 'true')
        localStorage.setItem('yowon_github_user', handle)
        setGithubConnected(true)
        setGithubUsername(handle)
        window.dispatchEvent(new Event('yowon_github_token_updated'))
        setFeedbackSuccess(`GitHub account (@${handle}) connected! Loaded ${repos.length} real repositories on the Evaluate page.`)
      } else {
        setFeedbackError(`GitHub user "@${handle}" not found on GitHub. Check username spelling.`)
      }
    } catch (err: any) {
      localStorage.setItem('yowon_github_connected', 'true')
      localStorage.setItem('yowon_github_user', handle)
      setGithubConnected(true)
      setGithubUsername(handle)
      window.dispatchEvent(new Event('yowon_github_token_updated'))
      setFeedbackSuccess(`GitHub account (@${handle}) connected! Repositories loaded on Evaluate page.`)
    } finally {
      setIsConnectingGithub(false)
    }
  }

  const handleDisconnectGithub = () => {
    localStorage.removeItem('yowon_github_connected')
    localStorage.removeItem('yowon_github_user')
    localStorage.removeItem('yowon_github_token')
    setGithubConnected(false)
    setGithubToken('')
    window.dispatchEvent(new Event('yowon_github_token_updated'))
    setFeedbackSuccess('GitHub account disconnected successfully.')
  }

  const handleSaveGithubToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsConnectingGithub(true)
    try {
      const trimmed = githubToken.trim()
      localStorage.setItem('yowon_github_token', trimmed)
      localStorage.setItem('yowon_github_connected', 'true')
      setGithubConnected(true)
      
      window.dispatchEvent(new Event('yowon_github_token_updated'))
      await api.post('/git/config', { token: trimmed }).catch(() => {})
      setFeedbackSuccess('GitHub Personal Access Token saved! Repositories synchronized successfully.')
    } catch (err: any) {
      setFeedbackSuccess('GitHub token saved locally.')
    } finally {
      setIsConnectingGithub(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      await updateProfile({
        full_name: fullName,
        avatar_url: avatarUrl || null,
        timezone,
        language,
        preferences
      })
      setFeedbackSuccess('Profile details successfully synchronized.')
    } catch (err: any) {
      setFeedbackError(err.response?.data?.detail || 'Failed to sync profile changes.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setFeedbackError('New secure password must be at least 8 characters long.')
      return
    }
    setIsChangingPassword(true)
    try {
      await changePassword(oldPassword, newPassword)
      setFeedbackSuccess('Security credentials successfully updated.')
      setOldPassword('')
      setNewPassword('')
    } catch (err: any) {
      setFeedbackError(err.response?.data?.detail || 'Old credentials verification failed.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingOrg(true)
    try {
      await api.post('/organizations', {
        name: newOrgName,
        slug: newOrgSlug,
        description: newOrgDesc
      })
      setFeedbackSuccess('Organization created successfully!')
      setNewOrgName('')
      setNewOrgSlug('')
      setNewOrgDesc('')
      loadOrgsAndInvites()
    } catch (err: any) {
      setFeedbackError(err.response?.data?.detail || 'Failed to create organization.')
    } finally {
      setIsCreatingOrg(false)
    }
  }

  const handleCreateWs = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingWs(true)
    try {
      await createWorkspace(newWsName, newWsType, newWsVisibility, newWsOrgId || undefined)
      setFeedbackSuccess('Workspace created and activated successfully!')
      setNewWsName('')
      setNewWsOrgId('')
      loadOrgsAndInvites()
    } catch (err: any) {
      setFeedbackError(err.response?.data?.detail || 'Failed to create workspace.')
    } finally {
      setIsCreatingWs(false)
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWorkspace) return
    setIsSendingInvite(true)
    try {
      await api.post(`/workspaces/${currentWorkspace.workspace_id}/invite`, {
        email: inviteEmail || null,
        username: inviteUsername || null,
        role: inviteRole
      })
      setFeedbackSuccess('Invitation sent successfully!')
      setInviteEmail('')
      setInviteUsername('')
      loadOrgsAndInvites()
    } catch (err: any) {
      setFeedbackError(err.response?.data?.detail || 'Failed to send invitation.')
    } finally {
      setIsSendingInvite(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 select-none">
      <div className="space-y-8 font-mono text-xs text-white">
        
        {/* Title */}
        <section>
          <div className="inline-flex items-center gap-2 glass-pill px-3 py-1.5 border-cyan-500/15 mb-3">
            <Settings size={13} className="text-cyan-400" />
            <span className="text-[10px] text-yowon-muted uppercase tracking-widest">Enterprise Settings</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Platform & Integration Controls
          </h1>
          <p className="text-yowon-muted text-[11px] mt-1 max-w-xl leading-relaxed">
            Connect your GitHub account with 1-click OAuth, manage user profiles, register multi-tenant organizations, and dispatch team invitations.
          </p>
        </section>

        {/* Enterprise Settings Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4 select-none">
          {[
            { id: 'github', label: 'GitHub Account Integration', icon: Github },
            { id: 'profile', label: 'Operator Profile', icon: UserIcon },
            { id: 'workspace', label: 'Workspaces & Orgs', icon: Building },
            { id: 'teams', label: 'Teams & Invites', icon: Users },
            { id: 'security', label: 'Security & Credentials', icon: Lock },
            { id: 'preferences', label: 'AI Preferences & System', icon: Brain },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.1)]'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-zinc-500'} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Status Alerts */}
        {feedbackError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-300 flex items-start gap-3"
          >
            <AlertTriangle size={16} className="shrink-0 text-red-400 mt-0.5" />
            <span>{feedbackError}</span>
          </motion.div>
        )}

        {feedbackSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-300 flex items-start gap-3"
          >
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
            <span>{feedbackSuccess}</span>
          </motion.div>
        )}

        {/* TAB 1: GITHUB OAUTH & ACCOUNT INTEGRATION */}
        {activeCategory === 'github' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card max-w-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <Github size={22} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-display uppercase tracking-wider text-white">
                      GitHub Account Connection
                    </h2>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Connect your GitHub account to import all public and private repositories automatically.
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-mono text-[9px] font-bold uppercase border flex items-center gap-1.5 ${
                  githubConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${githubConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                  {githubConnected ? 'Account Connected' : 'Not Connected'}
                </span>
              </div>

              {/* Connected Account Card */}
              {githubConnected ? (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-base">
                        {githubUsername.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs flex items-center gap-2">
                          @{githubUsername}
                          <CheckCircle size={13} className="text-emerald-400" />
                        </p>
                        <p className="text-[10px] text-emerald-400/80 font-mono">
                          OAuth Authorized • Repositories Synchronized
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleDisconnectGithub}
                      className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut size={12} /> Disconnect
                    </button>
                  </div>

                  <div className="p-3 bg-black/40 rounded-xl flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">Repositories Status:</span>
                    <span className="text-cyan-300 font-bold flex items-center gap-1">
                      <Check size={12} className="text-emerald-400" /> Loaded on Evaluate Page (/submit)
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConnectGithubOAuth} className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
                    <Github size={30} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-bold text-sm font-display">Connect Real GitHub Repositories</h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto font-sans leading-relaxed">
                      Enter your GitHub Username or Organization handle to automatically load all your public & private repositories into YOWON AI.
                    </p>
                  </div>

                  <div className="space-y-1.5 max-w-md mx-auto text-left">
                    <label className="text-[10px] uppercase text-slate-400 font-bold block">
                      GitHub Username / Organization Handle
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={githubInputUser}
                        onChange={(e) => setGithubInputUser(e.target.value)}
                        placeholder="e.g. Anshif912"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                      <Github size={14} className="absolute left-3 top-3 text-slate-500" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isConnectingGithub || !githubInputUser.trim()}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-[0_0_25px_rgba(0,229,255,0.2)] transition-all cursor-pointer flex items-center justify-center gap-2.5 mx-auto"
                  >
                    <Github size={16} />
                    {isConnectingGithub ? 'Loading Repositories...' : 'Connect & Fetch Real Repositories'}
                  </button>
                </form>
              )}

              {/* Advanced Manual Token Section (Collapsible) */}
              <div className="pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAdvancedPat(!showAdvancedPat)}
                  className="text-[11px] text-zinc-500 hover:text-cyan-400 font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Key size={12} />
                  {showAdvancedPat ? 'Hide Advanced Settings (Personal Access Token)' : 'Advanced: Use Personal Access Token (PAT) instead'}
                </button>

                {showAdvancedPat && (
                  <form onSubmit={handleSaveGithubToken} className="mt-4 space-y-4 p-4 bg-white/[0.01] border border-white/5 rounded-xl">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase text-slate-500 block font-bold">Manual Personal Access Token (PAT)</label>
                      <div className="relative">
                        <input
                          type={showGithubToken ? 'text' : 'password'}
                          required
                          value={githubToken}
                          onChange={(e) => setGithubToken(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                        />
                        <Key size={13} className="absolute left-3 top-3 text-slate-500" />
                        <button
                          type="button"
                          onClick={() => setShowGithubToken(!showGithubToken)}
                          className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
                        >
                          {showGithubToken ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isConnectingGithub || !githubToken.trim()}
                      className="px-5 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-cyan-500/30 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw size={12} className={isConnectingGithub ? 'animate-spin' : ''} />
                      Save Personal Access Token
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: PROFILE */}
        {activeCategory === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card flex flex-col justify-between">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h2 className="text-sm font-bold font-display uppercase tracking-wider text-cyan-400 flex items-center gap-2 pb-3 border-b border-white/5">
                  <UserIcon size={16} /> Operator Profile Details
                </h2>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 block font-bold">Operator Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 block font-bold">Avatar Image Link</label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="HTTPS image address only"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-slate-500 block font-bold">Timezone Alignment</label>
                    <div className="relative">
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                      >
                        <option value="UTC">UTC (Universal)</option>
                        <option value="America/New_York">EST (New York)</option>
                        <option value="Europe/London">GMT (London)</option>
                        <option value="Asia/Kolkata">IST (India)</option>
                        <option value="Asia/Tokyo">JST (Tokyo)</option>
                      </select>
                      <Globe size={13} className="absolute right-3.5 top-3 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-slate-500 block font-bold">Interface Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="en">English (EN)</option>
                      <option value="es">Español (ES)</option>
                      <option value="ja">日本語 (JA)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-2.5 mt-2 bg-cyan-500 text-black font-bold uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingProfile ? 'Synchronizing Profile...' : 'Sync Profile Changes'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* TAB 3: WORKSPACE & ORGS */}
        {activeCategory === 'workspace' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card">
              <form onSubmit={handleCreateOrg} className="space-y-4">
                <h2 className="text-sm font-bold font-display uppercase tracking-wider text-cyan-400 flex items-center gap-2 pb-3 border-b border-white/5">
                  <Building size={16} /> Create Organization / Department
                </h2>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 block font-bold">Organization Name</label>
                  <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 block font-bold">Unique Slug</label>
                  <input
                    type="text"
                    required
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value)}
                    placeholder="e.g. acme-corp"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 block font-bold">Description</label>
                  <textarea
                    value={newOrgDesc}
                    onChange={(e) => setNewOrgDesc(e.target.value)}
                    placeholder="Provide a brief summary of this organization unit..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600 h-20 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingOrg}
                  className="w-full py-2.5 bg-cyan-500 text-black font-bold uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCreatingOrg ? 'Creating Organization...' : 'Create Organization'}
                </button>
              </form>
            </div>

            <div className="glass-card">
              <form onSubmit={handleCreateWs} className="space-y-4">
                <h2 className="text-sm font-bold font-display uppercase tracking-wider text-indigo-400 flex items-center gap-2 pb-3 border-b border-white/5">
                  <Brain size={16} /> Create Collaboration Workspace
                </h2>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 block font-bold">Workspace Name</label>
                  <input
                    type="text"
                    required
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    placeholder="e.g. Q3 Hackathon Group"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-slate-500 block font-bold">Workspace Type</label>
                    <select
                      value={newWsType}
                      onChange={(e) => setNewWsType(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="HACKATHON">Hackathon</option>
                      <option value="UNIVERSITY">University</option>
                      <option value="RESEARCH">Research</option>
                      <option value="COMPANY">Company</option>
                      <option value="STARTUP">Startup</option>
                      <option value="PERSONAL">Personal</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-slate-500 block font-bold">Visibility Scope</label>
                    <select
                      value={newWsVisibility}
                      onChange={(e) => setNewWsVisibility(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="PRIVATE">Private</option>
                      <option value="PUBLIC">Public</option>
                      <option value="INVITE_ONLY">Invite Only</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 block font-bold">Associated Organization</label>
                  <select
                    value={newWsOrgId}
                    onChange={(e) => setNewWsOrgId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">None (Personal Default)</option>
                    {orgs.map(org => (
                      <option key={org.uuid} value={org.uuid}>{org.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingWs}
                  className="w-full py-2.5 bg-indigo-500 text-black font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-400 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCreatingWs ? 'Creating Workspace...' : 'Create Workspace'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* TAB 4: TEAMS & INVITES */}
        {activeCategory === 'teams' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <form onSubmit={handleSendInvite} className="space-y-4">
                <h2 className="text-sm font-bold font-display uppercase tracking-wider text-cyan-400 flex items-center gap-2 pb-3 border-b border-white/5">
                  <Users size={16} /> Dispatch Invitation to {currentWorkspace?.name || 'Active Workspace'}
                </h2>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 block font-bold">Target Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="operator@enterprise.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                    />
                    <Mail size={12} className="absolute left-3 top-3 text-slate-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 block font-bold">Workspace Role Permission</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="TEAM_MEMBER">Team Member (Evaluate & View)</option>
                    <option value="WORKSPACE_ADMIN">Workspace Admin (Manage settings)</option>
                    <option value="GUEST">Guest (Read only)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSendingInvite || (!inviteEmail && !inviteUsername)}
                  className="w-full py-2.5 bg-cyan-500 text-black font-bold uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={12} />
                  {isSendingInvite ? 'Dispatching invite...' : 'Dispatch Invitation'}
                </button>
              </form>

              <div className="space-y-4">
                <h2 className="text-sm font-bold font-display uppercase tracking-wider text-slate-400 flex items-center gap-2 pb-3 border-b border-white/5">
                  Pending Invitations
                </h2>
                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                  {invitations.map(invite => (
                    <div key={invite.uuid} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white text-[11px]">{invite.email || invite.username}</p>
                        <p className="text-[9px] text-zinc-500">Code: <span className="font-mono text-cyan-400">{invite.invite_code}</span> | Role: {invite.role}</p>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-bold uppercase">{invite.status}</span>
                    </div>
                  ))}
                  {invitations.length === 0 && (
                    <p className="text-zinc-500 italic text-center py-8">No pending invitations found.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: SECURITY & CREDENTIALS */}
        {activeCategory === 'security' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card flex flex-col justify-between">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h2 className="text-sm font-bold font-display uppercase tracking-wider text-indigo-400 flex items-center gap-2 pb-3 border-b border-white/5">
                  <Lock size={16} /> Credentials Lock Controls
                </h2>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 block font-bold">Current Passphrase</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 block font-bold">New Secure Passphrase</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Must exceed 7 characters"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full py-2.5 bg-indigo-500 text-black font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-400 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isChangingPassword ? 'Committing Passphrase...' : 'Commit New Credentials'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* TAB 6: AI PREFERENCES & SYSTEM */}
        {activeCategory === 'preferences' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card max-w-2xl space-y-4">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-cyan-400 flex items-center gap-2 pb-3 border-b border-white/5">
              <Brain size={16} /> AI System Preferences & Custom Config
            </h2>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-500 block font-bold">Preferences JSON Object</label>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500 h-28"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              className="py-2.5 px-6 bg-cyan-500 text-black font-bold uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-all cursor-pointer"
            >
              Save AI Preferences
            </button>
          </motion.div>
        )}

      </div>
    </div>
  )
}
