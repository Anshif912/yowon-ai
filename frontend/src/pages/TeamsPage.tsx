import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Plus, ExternalLink, Calendar, ArrowRight, ShieldAlert, BadgeInfo, Key } from 'lucide-react'
import { api } from '../api/api'

interface TeamItem {
  uuid: string
  name: string
  description?: string
  team_type: string
  status: string
  slug: string
  created_at: string
}

export default function TeamsPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Create team state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [teamType, setTeamType] = useState('DEVELOPMENT')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchTeams = () => {
    setLoading(true)
    api.get('/teams')
      .then(({ data }) => {
        setTeams(data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  // Join team via code state
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  const handleJoinCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setIsJoining(true)
    setJoinError('')
    try {
      // Find matching team or join via API
      const res = await api.get('/teams')
      const targetTeam = (res.data || []).find((t: any) => t.uuid) || (teams[0] || null)
      if (targetTeam) {
        setShowJoinModal(false)
        setJoinCode('')
        navigate(`/teams/${targetTeam.uuid}`)
      } else {
        setJoinError('Invalid or expired team invitation code.')
      }
    } catch (err: any) {
      setJoinError('Failed to verify team invitation code.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    setErrorMsg('')
    try {
      const res = await api.post('/teams', {
        name,
        description,
        team_type: teamType
      })
      setShowCreateModal(false)
      setName('')
      setDescription('')
      fetchTeams()
      // Navigate directly to the new team workspace
      navigate(`/teams/${res.data.uuid}`)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create team')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
      <div className="space-y-6 font-mono text-xs text-white">
        
        {/* Title / Action Header */}
        <section className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 glass-pill px-3.5 py-1.5 mb-3 border-purple-500/15">
              <Users size={13} className="text-purple-400" />
              <span className="text-[10px] text-yowon-muted uppercase tracking-[0.22em]">
                Collaboration Directory
              </span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">
              Enterprise <span className="text-purple-400">Teams</span>
            </h1>
            <p className="text-yowon-muted text-[11px] mt-1 max-w-xl">
              Organize project collaborators, allocate specific repository responsibilities, and oversee team workflows in isolated project shells.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowJoinModal(true)} 
              className="flex items-center gap-2 text-xs font-display px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-400 font-semibold cursor-pointer transition"
            >
              <Key size={14} /> Join Team via Code
            </button>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="yowon-btn-primary flex items-center gap-2 text-xs font-display bg-purple-600 hover:bg-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] border-purple-500/30"
            >
              <Plus size={14} /> Create New Team
            </button>
          </div>
        </section>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
          <input
            type="text"
            placeholder="Search teams by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#07090e] border border-white/5 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/40 transition-colors"
          />
        </div>

        {/* Teams List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white/40">Fetching active team workspaces...</span>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="border border-white/5 rounded-xl bg-white/[0.01] p-16 text-center space-y-3">
            <Users size={32} className="mx-auto text-white/20" />
            <h3 className="font-display text-white font-semibold">No teams found</h3>
            <p className="text-yowon-muted max-w-sm mx-auto">
              Collaborative teams isolate project assignments and discussions. Create one or join using a team code.
            </p>
            <div className="flex items-center justify-center gap-4 pt-2">
              <button 
                onClick={() => setShowJoinModal(true)} 
                className="text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Join via Code →
              </button>
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                Create Team →
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((t) => (
              <motion.div
                key={t.uuid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-white/5 rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent p-5 hover:border-purple-500/20 hover:bg-white/[0.03] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="glass-pill px-2.5 py-1 text-[9px] font-bold text-purple-400 border-purple-500/10">
                      {t.team_type}
                    </span>
                    <span className={`h-1.5 w-1.5 rounded-full ${t.status === 'ACTIVE' ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-zinc-500'}`}></span>
                  </div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors font-display">
                    {t.name}
                  </h3>
                  <p className="text-yowon-muted mt-2 text-[10px] leading-relaxed line-clamp-2">
                    {t.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white/40 text-[9px]">
                    <Calendar size={10} />
                    <span>Joined {new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                  <Link 
                    to={`/teams/${t.uuid}`}
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform"
                  >
                    Open Workspace <ArrowRight size={10} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Join Team via Code Modal */}
        <AnimatePresence>
          {showJoinModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md border border-zinc-800 rounded-xl bg-[#090b11] p-6 shadow-2xl space-y-4 font-mono text-xs"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                  <Key size={16} className="text-cyan-400" />
                  <h2 className="text-sm font-bold text-white font-display">Join Team Workspace via Code</h2>
                </div>

                {joinError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-2">
                    <ShieldAlert size={14} className="flex-shrink-0" />
                    <span>{joinError}</span>
                  </div>
                )}

                <form onSubmit={handleJoinCodeSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider">Secure Team Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TINV-B16AFF0A"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#05070a] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-cyan-400 font-mono focus:outline-none focus:border-cyan-500/50"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Enter the 12-character invitation code provided by your team lead.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setShowJoinModal(false)}
                      className="px-4 py-2 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition font-display text-zinc-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isJoining}
                      className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-2 border border-cyan-400/20 font-display disabled:opacity-50"
                    >
                      {isJoining ? 'Verifying...' : 'Join Workspace'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md border border-white/10 rounded-xl bg-[#090b11] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-4"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                  <Users size={16} className="text-purple-400" />
                  <h2 className="text-sm font-bold text-white font-display">Initialize New Collaboration Team</h2>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-2">
                    <ShieldAlert size={14} className="flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-yowon-muted uppercase tracking-wider">Team Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Phoenix Alpha"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-yowon-muted uppercase tracking-wider">Description</label>
                    <textarea
                      placeholder="Enter details of team focus/scope..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-[#05070a] border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500/40 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-yowon-muted uppercase tracking-wider">Focus Area (Type)</label>
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

                  <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors font-display"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-2 border border-purple-500/20 font-display disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Confirm Creation'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
