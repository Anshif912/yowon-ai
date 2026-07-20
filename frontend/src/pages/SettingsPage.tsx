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
  Users
} from 'lucide-react'
import { useAuth } from '../components/auth/AuthContext'
import { useWorkspace } from '../components/auth/WorkspaceContext'
import { api } from '../api/api'

export default function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth()
  const { workspaces, createWorkspace, currentWorkspace } = useWorkspace()
  const isAdmin = user && ['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN'].includes(user.role)

  // Active Category tab state
  const [activeCategory, setActiveCategory] = useState<'profile' | 'workspace' | 'teams' | 'security' | 'preferences'>('profile')

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
      setOrgs(orgRes.data)
      if (currentWorkspace) {
        const inviteRes = await api.get(`/workspaces/${currentWorkspace.workspace_id}/invitations`)
        setInvitations(inviteRes.data)
      }
    } catch (err) {}
  }

  useEffect(() => {
    loadOrgsAndInvites()
  }, [currentWorkspace])

  // Reset success/error on change
  useEffect(() => {
    setFeedbackError(null)
    setFeedbackSuccess(null)
  }, [fullName, avatarUrl, timezone, language, preferences, oldPassword, newPassword, newOrgName, newWsName, inviteEmail])

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
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
      <div className="space-y-8 font-mono text-xs text-white">
      {/* Title */}
      <section>
        <div className="inline-flex items-center gap-2 glass-pill px-3 py-1.5 border-cyan-500/15 mb-3">
          <Settings size={13} className="text-cyan-400" />
          <span className="text-[10px] text-yowon-muted uppercase tracking-widest">Operator Settings</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">
          Operator Workspace Controls
        </h1>
        <p className="text-yowon-muted text-[11px] mt-1 max-w-xl leading-relaxed">
          Manage YOWON AI access credentials, register organizations, create workspaces, and dispatch workspace invitations.
        </p>
      </section>

      {/* Enterprise Settings Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-4 select-none">
        {[
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

      {/* Details Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card flex flex-col justify-between"
        >
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-cyan-400 flex items-center gap-2 pb-3 border-b border-white/5">
              <UserIcon size={16} /> Operator Profile Details
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-500 block">Operator Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-500 block">Avatar Image Link</label>
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
                <label className="text-[10px] uppercase text-slate-500 block">Timezone Alignment</label>
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
                <label className="text-[10px] uppercase text-slate-500 block">Interface Language</label>
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
        </motion.div>

        {/* Credentials Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-card flex flex-col justify-between"
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-indigo-400 flex items-center gap-2 pb-3 border-b border-white/5">
              <Lock size={16} /> Credentials Lock Controls
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-500 block">Current Passphrase</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-slate-500 block">New Secure Passphrase</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Must exceed 7 characters"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
              />
            </div>

            <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 space-y-1.5">
              <span className="text-white font-bold uppercase tracking-wider flex items-center gap-1.5 text-[9px]">
                <Sparkles size={11} className="text-amber-400" /> Preferences JSON string
              </span>
              <input
                type="text"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-lg px-2.5 py-1.5 text-slate-400 font-mono text-[9px] focus:outline-none focus:border-cyan-500"
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
        </motion.div>
      </div>

      {/* Enterprise Multi-Tenancy Forms Grid */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Organization */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
          >
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-cyan-400 flex items-center gap-2 pb-3 border-b border-white/5">
                <Building size={16} /> Create Organization / Department
              </h2>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-500 block">Organization Name</label>
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
                <label className="text-[10px] uppercase text-slate-500 block">Unique Slug (URL component)</label>
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
                <label className="text-[10px] uppercase text-slate-500 block">Description</label>
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
          </motion.div>

          {/* Create Workspace */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
          >
            <form onSubmit={handleCreateWs} className="space-y-4">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-indigo-400 flex items-center gap-2 pb-3 border-b border-white/5">
                <Brain size={16} /> Create Collaboration Workspace
              </h2>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-500 block">Workspace Name</label>
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
                  <label className="text-[10px] uppercase text-slate-500 block">Workspace Type</label>
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
                  <label className="text-[10px] uppercase text-slate-500 block">Visibility Scope</label>
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
                <label className="text-[10px] uppercase text-slate-500 block">Associated Organization</label>
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
          </motion.div>
        </div>
      )}

      {/* Workspace Membership Invitations Panel */}
      {isAdmin && currentWorkspace && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Invite Dispatch */}
            <form onSubmit={handleSendInvite} className="space-y-4">
              <h2 className="text-sm font-bold font-display uppercase tracking-wider text-cyan-400 flex items-center gap-2 pb-3 border-b border-white/5">
                <Users size={16} /> Dispatch Invitation to {currentWorkspace.name}
              </h2>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-slate-500 block">Target Email Address</label>
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
                <label className="text-[10px] uppercase text-slate-500 block">Workspace Role Permission</label>
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

            {/* Pending Invitations list */}
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
      </div>
    </div>
  )
}
