import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  LayoutDashboard,
  FolderGit2,
  Settings,
  Clock,
  Sparkles,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  LogOut,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react'
import { api } from '../api/api'

interface TeamDetails {
  uuid: string
  name: string
  description?: string
  team_type: string
  status: string
  slug: string
  created_at: string
}

interface ActivityItem {
  event_type: string
  actor_name: string
  details?: string
  timestamp: string
}

interface TeamDashboard {
  team: TeamDetails
  members_count: number
  projects_count: number
  invitations_count: number
  recent_activity: ActivityItem[]
}

interface MemberItem {
  uuid: string
  user_id: string
  role: string
  status: string
  joined_at: string
}

export default function TeamWorkspacePage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'projects' | 'activity' | 'settings'>('overview')
  const [dashboard, setDashboard] = useState<TeamDashboard | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Invitation parameters
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Developer')
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [inviting, setInviting] = useState(false)

  // Settings parameters
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [teamType, setTeamType] = useState('DEVELOPMENT')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  const fetchDashboard = () => {
    setLoading(true)
    api.get(`/teams/${teamId}/dashboard`)
      .then(({ data }) => {
        setDashboard(data)
        setName(data.team.name)
        setDescription(data.team.description || '')
        setTeamType(data.team.team_type)
      })
      .catch(() => navigate('/teams'))
      .finally(() => setLoading(false))
  }

  const fetchMembers = () => {
    api.get(`/teams/${teamId}`)
      .then(({ data }) => {
        // Members list details from team response
        setMembers(data.members || [])
      })
      .catch(() => {})
  }

  const fetchProjects = () => {
    api.get('/projects')
      .then(({ data }) => {
        // Filter projects belonging to this team
        setProjects(data.filter((p: any) => p.team_id === teamId))
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (teamId) {
      fetchDashboard()
      fetchMembers()
      fetchProjects()
    }
  }, [teamId])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setGeneratedCode('')
    try {
      const res = await api.post(`/teams/${teamId}/invite`, {
        email: inviteEmail,
        role: inviteRole
      })
      setGeneratedCode(res.data.invite_code)
      setInviteEmail('')
      fetchDashboard()
    } catch (err) {
      alert('Failed to send team invitation')
    } finally {
      setInviting(false)
    }
  }

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    setSettingsError('')
    try {
      await api.put(`/teams/${teamId}`, {
        name,
        description,
        team_type: teamType
      })
      fetchDashboard()
      alert('Settings updated successfully')
    } catch (err: any) {
      setSettingsError(err.response?.data?.detail || 'Failed to update team settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm('Are you absolutely sure you want to archive this team? All project associations will be preserved.')) return
    try {
      await api.delete(`/teams/${teamId}`)
      navigate('/teams')
    } catch (err) {
      alert('Failed to archive team')
    }
  }

  if (loading || !dashboard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-white font-mono text-xs">
        <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Opening Team Workspace Shell...</span>
      </div>
    )
  }

  const { team } = dashboard

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#05070a] font-mono text-xs text-white">
      
      {/* Team Top Shell Banner */}
      <div className="border-b border-white/5 bg-gradient-to-r from-purple-950/10 via-[#07090e] to-transparent p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="glass-pill px-2.5 py-1 text-[9px] font-bold text-purple-400 border-purple-500/10 uppercase tracking-widest">
                {team.team_type}
              </span>
              <span className="text-[10px] text-yowon-muted">Slug: /{team.slug}</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-white mt-1">
              {team.name} <span className="text-purple-400">Workspace</span>
            </h1>
            <p className="text-yowon-muted max-w-xl text-[10px] line-clamp-1">{team.description}</p>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex gap-2 mt-6 border-b border-white/5 pb-px">
          {([
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'projects', label: 'Projects Registry', icon: FolderGit2 },
            { id: 'activity', label: 'Activity Logs', icon: Clock },
            { id: 'settings', label: 'Settings', icon: Settings }
          ] as const).map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-display text-xs transition-colors ${
                  active 
                    ? 'border-purple-500 text-purple-400 font-semibold bg-purple-500/5' 
                    : 'border-transparent text-yowon-muted hover:text-white hover:bg-white/[0.01]'
                }`}
              >
                <Icon size={12} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Tab Panel Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
        
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-white/5 rounded-xl bg-white/[0.01] p-4 flex items-center justify-between">
                <div>
                  <span className="text-yowon-muted text-[10px] uppercase">Registry Projects</span>
                  <h3 className="text-xl font-bold font-display mt-1 text-white">{dashboard.projects_count}</h3>
                </div>
                <FolderGit2 className="text-purple-400 opacity-60" size={24} />
              </div>
              
              <div className="border border-white/5 rounded-xl bg-white/[0.01] p-4 flex items-center justify-between">
                <div>
                  <span className="text-yowon-muted text-[10px] uppercase">Active Members</span>
                  <h3 className="text-xl font-bold font-display mt-1 text-white">{dashboard.members_count}</h3>
                </div>
                <Users className="text-purple-400 opacity-60" size={24} />
              </div>

              <div className="border border-white/5 rounded-xl bg-white/[0.01] p-4 flex items-center justify-between">
                <div>
                  <span className="text-yowon-muted text-[10px] uppercase">Pending Invitations</span>
                  <h3 className="text-xl font-bold font-display mt-1 text-white">{dashboard.invitations_count}</h3>
                </div>
                <UserPlus className="text-purple-400 opacity-60" size={24} />
              </div>
            </div>

            {/* Dashboard Recent Activity */}
            <div className="border border-white/5 rounded-xl bg-gradient-to-b from-white/[0.01] to-transparent p-5 space-y-4">
              <h3 className="text-sm font-semibold font-display text-white">Recent Team Actions Feed</h3>
              
              {dashboard.recent_activity.length === 0 ? (
                <p className="text-yowon-muted py-6 text-center">No recent activities on this workspace.</p>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                  {dashboard.recent_activity.map((act, idx) => (
                    <div key={idx} className="flex gap-4 items-start pl-6 relative">
                      <div className="absolute left-[5px] top-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-semibold text-white">{act.event_type}</span>
                          <span className="text-[9px] text-white/30">{new Date(act.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-yowon-muted text-[10px]">
                          By <span className="text-white/60">{act.actor_name}</span>. {act.details ? `Metadata: ${act.details}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Members List Table */}
            <div className="lg:col-span-2 border border-white/5 rounded-xl bg-white/[0.01] p-5 space-y-4">
              <h3 className="text-sm font-semibold font-display text-white">Verified Collaborators</h3>
              
              {members.length === 0 ? (
                <p className="text-yowon-muted py-6">Fetching member records...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Collaborator ID</th>
                        <th>Assigned Role</th>
                        <th>Membership Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((mem) => (
                        <tr key={mem.uuid}>
                          <td className="font-semibold text-white/90">{mem.user?.full_name || mem.user_id}</td>
                          <td>
                            <span className="glass-pill px-2 py-0.5 border-purple-500/10 text-purple-400">
                              {mem.role}
                            </span>
                          </td>
                          <td className="text-[10px] text-emerald-400">{mem.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Invite Panel */}
            <div className="border border-white/5 rounded-xl bg-gradient-to-b from-purple-950/10 to-transparent p-5 space-y-4">
              <h3 className="text-sm font-semibold font-display text-white">Invite Collaborator</h3>
              <p className="text-yowon-muted text-[10px]">Generate a secure join link to assign a colleague to this workspace.</p>
              
              <form onSubmit={handleSendInvite} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Colleague Email</label>
                  <div className="relative">
                    <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="email"
                      required
                      placeholder="colleague@yowon.ai"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-[#05070a] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-purple-500/40"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Role Assignment</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500/40"
                  >
                    <option value="Team Owner">Team Owner</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Developer">Developer</option>
                    <option value="AI Engineer">AI Engineer</option>
                    <option value="Reviewer">Reviewer</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold flex items-center justify-center gap-2 border border-purple-500/20 font-display disabled:opacity-50"
                >
                  <UserPlus size={13} />
                  <span>{inviting ? 'Generating Invite...' : 'Generate Join Code'}</span>
                </button>
              </form>

              {/* Show Code */}
              {generatedCode && (
                <div className="mt-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg space-y-2">
                  <span className="text-[9px] text-yowon-muted uppercase tracking-wider">Secure Team Code</span>
                  <div className="flex items-center justify-between gap-2 bg-[#05070a] px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="font-semibold text-white select-all">{generatedCode}</span>
                    <button 
                      onClick={copyCodeToClipboard}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[9px] text-yowon-muted leading-relaxed">
                    Provide this code to your colleague. They can join by navigating to Teams directory and pasting the code.
                  </p>
                </div>
              )}

            </div>

          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-sm font-semibold font-display text-white">Assigned Codebases Registry</h3>
              <Link to="/submit" className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold">
                Register New Project →
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="border border-white/5 rounded-xl p-12 text-center text-yowon-muted">
                No projects assigned to this team workspace.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p) => (
                  <div 
                    key={p.id}
                    className="border border-white/5 rounded-xl bg-white/[0.01] p-4 flex flex-col justify-between hover:border-purple-500/20 transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-center gap-2 mb-2">
                        <span className="glass-pill px-2 py-0.5 border-purple-500/10 text-purple-400">{p.project_type}</span>
                        <span className="text-[9px] font-semibold text-emerald-400">{p.status}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white font-display">{p.name}</h4>
                      <p className="text-yowon-muted mt-2 text-[10px] line-clamp-2">{p.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                      <Link to={`/projects/${p.id}`} className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1">
                        Open Project OS <Sparkles size={11} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="border border-white/5 rounded-xl bg-white/[0.01] p-5 space-y-4">
            <h3 className="text-sm font-semibold font-display text-white">Immutable Event Activity Logs</h3>
            <p className="text-yowon-muted text-[10px] pb-2 border-b border-white/5">This is the immutable ledger tracking team creations, workspace invitations, and parameters changes.</p>
            
            {dashboard.recent_activity.length === 0 ? (
              <p className="text-yowon-muted py-6">No audits recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {dashboard.recent_activity.map((act, idx) => (
                  <div key={idx} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0">
                    <Clock className="text-purple-400 opacity-60 flex-shrink-0 mt-0.5" size={13} />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-white">{act.event_type}</span>
                        <span className="text-[9px] text-white/30">{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-yowon-muted text-[10px]">
                        Actor: <span className="text-white/60">{act.actor_name}</span> {act.details ? `| Metadata: ${act.details}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Edit Form */}
            <div className="lg:col-span-2 border border-white/5 rounded-xl bg-white/[0.01] p-5 space-y-5">
              <h3 className="text-sm font-semibold font-display text-white">Team Parameters</h3>
              
              {settingsError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                  {settingsError}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Team Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Phoenix Alpha"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Description</label>
                  <textarea
                    placeholder="Enter details of team focus/scope..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500/40 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-yowon-muted">Focus Area (Type)</label>
                  <select
                    value={teamType}
                    onChange={(e) => setTeamType(e.target.value)}
                    className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500/40"
                  >
                    <option value="DEVELOPMENT">Development Team</option>
                    <option value="RESEARCH">Research Lab</option>
                    <option value="STARTUP">Startup Venture</option>
                    <option value="COLLEGE">University / Academic</option>
                    <option value="COMPANY">Corporate Department</option>
                    <option value="OPEN_SOURCE">Open Source Community</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold border border-purple-500/20 font-display disabled:opacity-50"
                >
                  {savingSettings ? 'Saving Changes...' : 'Save Workspace Changes'}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-500/10 rounded-xl bg-red-950/[0.02] p-5 space-y-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle size={15} />
                <h3 className="text-sm font-semibold font-display">Danger Zone</h3>
              </div>
              <p className="text-yowon-muted text-[10px] leading-relaxed">
                Archiving a team workspace stops membership registrations. This action is logged in the ledger and is irreversible.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleDeleteTeam}
                  className="w-full py-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 rounded-lg font-semibold border border-red-500/20 flex items-center justify-center gap-2 transition-colors font-display"
                >
                  <Trash2 size={13} />
                  <span>Archive Team Workspace</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
