import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CircuitBoard, Radio, Trophy, LayoutDashboard, FolderGit2,
  LogOut, User as UserIcon, Settings, X, Shield, Lock, Globe, Sparkles,
  ShieldAlert, CheckCircle2
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const NAV_LINKS = [
  { to: '/projects',    label: 'Projects', icon: FolderGit2 },
  { to: '/leaderboard', label: 'Rankings', icon: Trophy },
  { to: '/jury',        label: 'AI Jury',  icon: LayoutDashboard },
]

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, updateProfile, changePassword } = useAuth()

  // Dropdown & Modal open states
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC')
  const [language, setLanguage] = useState(user?.language || 'en')
  const [preferences, setPreferences] = useState(user?.preferences || '{}')
  
  // Password Form state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Loading/Feedback states
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalSuccess, setModalSuccess] = useState<string | null>(null)

  const handleLogout = async () => {
    setShowDropdown(false)
    await logout()
    navigate('/login')
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setModalSuccess(null)
    setIsSavingProfile(true)
    try {
      await updateProfile({
        full_name: fullName,
        avatar_url: avatarUrl || null,
        timezone,
        language,
        preferences
      })
      setModalSuccess('Profile details successfully updated.')
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to update profile details.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)
    setModalSuccess(null)
    if (newPassword.length < 8) {
      setModalError('New password must be at least 8 characters long.')
      return
    }
    setIsChangingPassword(true)
    try {
      await changePassword(oldPassword, newPassword)
      setModalSuccess('Password successfully updated.')
      setOldPassword('')
      setNewPassword('')
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Old password verification failed.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const openSettings = () => {
    setFullName(user?.full_name || '')
    setAvatarUrl(user?.avatar_url || '')
    setTimezone(user?.timezone || 'UTC')
    setLanguage(user?.language || 'en')
    setPreferences(user?.preferences || '{}')
    setModalError(null)
    setModalSuccess(null)
    setShowDropdown(false)
    setShowSettingsModal(true)
  }

  return (
    <>
      <header className="sticky top-0 z-50 px-4 pt-4 pb-2 bg-transparent">
        <div className="glass-panel max-w-6xl mx-auto px-6 h-14 rounded-full flex items-center justify-between gap-4 border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.40)]">

          {/* Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-emerald-400 to-violet-600 flex items-center justify-center"
              whileHover={{ scale: 1.08 }}
              style={{ boxShadow: '0 0 14px rgba(0,245,255,0.32)' }}
            >
              <CircuitBoard size={16} className="text-[#04111F]" />
            </motion.div>
            <div className="leading-none">
              <span className="font-display font-bold text-base text-white tracking-tight">
                YOWON AI
              </span>
              <p className="text-[9px] font-mono text-yowon-muted tracking-[0.22em] uppercase hidden sm:block mt-0.5">
                AI Operating System
              </p>
            </div>
          </Link>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const active = pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[rgba(0,245,255,0.10)] text-cyan-200 border border-[rgba(0,245,255,0.20)] shadow-[0_0_16px_rgba(0,245,255,0.10)]'
                      : 'text-yowon-muted hover:text-white hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0 relative">
            <div className="hidden sm:flex items-center gap-2 glass-pill px-3 py-1.5 border-[rgba(0,245,255,0.15)]">
              <Radio size={11} className="text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-yowon-muted tracking-[0.18em] uppercase">
                LIVE
              </span>
            </div>

            {isAuthenticated ? (
              <div className="relative">
                {/* User Avatar Action Trigger */}
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-8 h-8 rounded-full border border-white/10 hover:border-cyan-400 bg-gradient-to-tr from-cyan-600 to-indigo-700 flex items-center justify-center text-white font-mono font-bold text-xs uppercase cursor-pointer select-none"
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user?.full_name.charAt(0) || 'U'
                  )}
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <>
                      {/* Overlay background close interceptor */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                      
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2.5 w-56 z-50 glass-card bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2.5 space-y-2 font-mono text-[11px]"
                      >
                        <div className="px-2 py-1.5 border-b border-white/5 space-y-0.5">
                          <p className="text-white font-bold truncate">{user?.full_name}</p>
                          <p className="text-yowon-muted truncate">{user?.email}</p>
                          <span className="inline-block mt-1 bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                            {user?.role} Clearance
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <button
                            onClick={openSettings}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left cursor-pointer"
                          >
                            <Settings size={12} className="text-slate-400" />
                            <span>Operator Controls</span>
                          </button>

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all text-left cursor-pointer"
                          >
                            <LogOut size={12} className="text-red-400" />
                            <span>Revoke Connection</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="yowon-btn-primary yowon-btn-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Slide-over/Center Glass Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal backdrop close handler */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg glass-card bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6 font-mono text-xs text-slate-300 overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="font-display font-bold text-sm text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Settings size={16} className="text-cyan-400" />
                  Operator Settings Controls
                </span>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status alerts */}
              {modalError && (
                <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-lg text-red-300 font-mono text-[11px] flex gap-2">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}
              {modalSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-lg text-emerald-300 font-mono text-[11px] flex gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              {/* Dual grid options: Profile details / Password change */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Profile form */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                    <UserIcon size={12} /> Profile Details
                  </h3>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-slate-500">Clearance Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-slate-500">Avatar Image URL</label>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="HTTPS link only"
                      className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-slate-500">Timezone Context</label>
                    <div className="relative">
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500 appearance-none"
                      >
                        <option value="UTC">UTC (Universal)</option>
                        <option value="America/New_York">EST (New York)</option>
                        <option value="Europe/London">GMT (London)</option>
                        <option value="Asia/Kolkata">IST (India)</option>
                        <option value="Asia/Tokyo">JST (Tokyo)</option>
                      </select>
                      <Globe size={11} className="absolute right-2.5 top-2.5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-slate-500">Interface Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="en">English (EN)</option>
                      <option value="es">Español (ES)</option>
                      <option value="ja">日本語 (JA)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full py-2 bg-white/5 border border-white/10 hover:bg-cyan-500 hover:text-black rounded text-[10px] uppercase font-bold tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingProfile ? 'Updating Profile...' : 'Save Profile Details'}
                  </button>
                </form>

                {/* Password Form */}
                <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                    <Lock size={12} /> Credentials Lock
                  </h3>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-slate-500">Current Password</label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-slate-500">New Secure Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600"
                    />
                  </div>

                  <div className="bg-white/[0.01] border border-white/5 rounded p-2.5 space-y-1 text-[9.5px]">
                    <span className="text-white font-bold uppercase block tracking-wider flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-400" /> Preferences JSON string
                    </span>
                    <input
                      type="text"
                      value={preferences}
                      onChange={(e) => setPreferences(e.target.value)}
                      className="w-full bg-[#07070a] border border-white/5 rounded px-2 py-1 text-slate-400 font-mono text-[9px] focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-2 bg-white/5 border border-white/10 hover:bg-indigo-500 hover:text-black rounded text-[10px] uppercase font-bold tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isChangingPassword ? 'Modifying Lock...' : 'Commit New Password'}
                  </button>
                </form>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
