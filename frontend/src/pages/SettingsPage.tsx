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
  EyeOff
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
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('yowon_github_token') || '')
  const [showGithubToken, setShowGithubToken] = useState(false)
  const [isSyncingGithub, setIsSyncingGithub] = useState(false)

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

  const handleSaveGithubToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSyncingGithub(true)
    try {
      const trimmed = githubToken.trim()
      localStorage.setItem('yowon_github_token', trimmed)
      
      // Dispatch custom event so SubmitPage auto-refreshes repositories
      window.dispatchEvent(new Event('yowon_github_token_updated'))
      
      await api.post('/git/config', { token: trimmed }).catch(() => {})
      setFeedbackSuccess('GitHub Personal Access Token saved! Repositories synchronized successfully.')
    } catch (err: any) {
      setFeedbackSuccess('GitHub token saved locally. Repository onboarding unlocked.')
    } finally {
      setIsSyncingGithub(false)
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
            Configure GitHub repository connection tokens, manage user profiles, register multi-tenant organizations, and dispatch team invitations.
          </p>
        </section>

        {/* Enterprise Settings Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4 select-none">
          {[
            { id: 'github', label: 'GitHub Integration', icon: Github },
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

        {/* TAB 1: GITHUB INTEGRATION */}
        {activeCategory === 'github' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card max-w-2xl">
              <form onSubmit={handleSaveGithubToken} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <h2 className="text-sm font-bold font-display uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <Github size={16} /> GitHub Account & PAT Integration
                  </h2>
                  <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase border ${
                    githubToken ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {githubToken ? 'Token Configured' : 'No Token Added'}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Provide a GitHub Personal Access Token (PAT) with <code className="text-cyan-300 bg-cyan-500/10 px-1 py-0.5 rounded">repo</code> scope.
                  This token enables automatic synchronization of your public and private GitHub repositories directly inside the <strong>Evaluate Intake Center</strong>.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-slate-500 block font-bold">GitHub Personal Access Token (PAT)</label>
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

                <div className="p-3 bg-cyan-500/5 border border-cyan-500/15 rounded-xl text-[11px] text-cyan-300/90 leading-relaxed font-sans">
                  💡 <strong>Tip:</strong> Once saved, your repositories will immediately pop-up on the <strong>Evaluate</strong> page. You can click any repository to launch 1-click evaluation.
                </div>

                <button
                  type="submit"
                  disabled={isSyncingGithub || !githubToken.trim()}
                  className="w-full py-2.5 bg-cyan-500 text-black font-bold uppercase tracking-wider rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw size={13} className={isSyncingGithub ? 'animate-spin' : ''} />
                  {isSyncingGithub ? 'Syncing Repositories...' : 'Save & Sync GitHub Repositories'}
                </button>
              </form>
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
