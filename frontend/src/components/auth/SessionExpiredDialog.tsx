import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Loader2, AlertTriangle, LogOut, ShieldAlert } from 'lucide-react'
import { useAuth } from './AuthContext'

export default function SessionExpiredDialog() {
  const { authPhase, user, login, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setErrorMsg('Please enter your password.')
      return
    }

    setIsLoading(true)
    setErrorMsg(null)
    try {
      if (user) {
        await login(user.email, password, true)
        setPassword('')
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.detail || err.response?.data?.message || 'Current password verification failed.'
      setErrorMsg(serverMsg)
    } finally {
      setIsLoading(false)
    }
  }

  if (authPhase !== 'EXPIRED') return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm bg-[#0c0d13] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-6 text-center"
        >
          {/* Locked Icon */}
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Lock size={20} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Clearance Clearance Expired</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Re-authentication Required</p>
            <p className="text-[10.5px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              Your operator token has expired. Please verify credentials for **{user?.full_name || 'Operator'}** to resume active operations.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Security Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to unlock"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 transition-all font-mono"
              />
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 font-sans text-xs">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMsg}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={logout}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg text-[10.5px] font-mono text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600 hover:bg-red-500 border border-white/10 rounded-lg text-[10.5px] font-mono text-white uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Unlocking...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
