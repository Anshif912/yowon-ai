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
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../components/auth/AuthContext'

export default function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth()

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC')
  const [language, setLanguage] = useState(user?.language || 'en')
  const [preferences, setPreferences] = useState(user?.preferences || '{}')
  
  // Password Form state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Feedback states
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null)

  // Reset success/error on change
  useEffect(() => {
    setFeedbackError(null)
    setFeedbackSuccess(null)
  }, [fullName, avatarUrl, timezone, language, preferences, oldPassword, newPassword])

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
          Manage your YOWON AI access credentials, interface localized language contexts, timezone alignments, and custom operating parameters.
        </p>
      </section>

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
      </div>
    </div>
  )
}
