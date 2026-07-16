import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Mail, Lock, User, Eye, EyeOff, Loader2, AlertTriangle, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/auth/AuthContext'
import SoftAurora from '../../components/effects/SoftAurora'

export default function RegisterPage() {
  const { register, isSubmitLoading } = useAuth() as any
  const navigate = useNavigate()

  // Form fields state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Validation / interaction states
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [capsLockActive, setCapsLockActive] = useState(false)
  const [shakeTrigger, setShakeTrigger] = useState(false)

  // Caps lock detection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) {
      setCapsLockActive(true)
    } else {
      setCapsLockActive(false)
    }
  }

  // Password complexity check
  const validateComplexity = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.'
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.'
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter.'
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one digit.'
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain at least one special character.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMsg(null)

    if (!fullName.trim()) {
      setFormError('Please enter your full name.')
      triggerErrorState()
      return
    }
    if (!email.trim()) {
      setFormError('Please enter your email address.')
      triggerErrorState()
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      triggerErrorState()
      return
    }

    const complexityError = validateComplexity(password)
    if (complexityError) {
      setFormError(complexityError)
      triggerErrorState()
      return
    }

    setIsLoading(true)
    try {
      const { register: registerFunc } = useAuth()
      await registerFunc(fullName, email, password)
      setSuccessMsg('Account registered successfully. Redirecting...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (err: any) {
      const serverMsg = err.response?.data?.detail || err.response?.data?.message || 'Registration connection failed.'
      setFormError(serverMsg)
      triggerErrorState()
    } finally {
      setIsLoading(false)
    }
  }

  const triggerErrorState = () => {
    setShakeTrigger(true)
    setTimeout(() => setShakeTrigger(false), 500)
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#05070a] px-4 py-12">
      {/* Background Aurora effects */}
      <SoftAurora colorStops={['#00e5ff', '#3B82F6', '#8B5CF6']} amplitude={1.2} />
      
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className={`relative z-10 w-full max-w-sm bg-[#0c0d13]/80 border border-white/[0.06] rounded-2xl p-6 shadow-2xl backdrop-blur-xl ${shakeTrigger ? 'animate-shake' : ''}`}
        >
          {/* Brand Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Shield className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight text-white uppercase">YOWON AI</h1>
            <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Enterprise Operating System</p>
            <p className="text-[10.5px] text-slate-400 max-w-xs mx-auto">
              Create your engineering account.
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name field */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative flex items-center group">
                <User size={13} className="absolute left-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-9 pr-4 py-2 text-[11px] text-white bg-black/40 border border-white/5 hover:border-white/10 focus:border-cyan-500/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans placeholder-slate-600"
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative flex items-center group">
                <Mail size={13} className="absolute left-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-4 py-2 text-[11px] text-white bg-black/40 border border-white/5 hover:border-white/10 focus:border-cyan-500/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans placeholder-slate-600"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative flex items-center group">
                <Lock size={13} className="absolute left-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-[11px] text-white bg-black/40 border border-white/5 hover:border-white/10 focus:border-cyan-500/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Confirm Password field */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider block">Confirm Password</label>
              <div className="relative flex items-center group">
                <Lock size={13} className="absolute left-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-[11px] text-white bg-black/40 border border-white/5 hover:border-white/10 focus:border-cyan-500/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans placeholder-slate-600"
                />
              </div>
            </div>

            {/* Feedback states */}
            <AnimatePresence mode="wait">
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-[10px] flex items-start gap-2 leading-relaxed"
                >
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] flex items-start gap-2 leading-relaxed"
                >
                  <Shield size={13} className="shrink-0 mt-0.5 text-cyan-400" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
              {capsLockActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[9px] font-mono text-amber-500 flex items-center gap-1.5"
                >
                  <AlertTriangle size={11} />
                  <span>Caps Lock is active</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-cyan-400 hover:bg-cyan-300 text-[#05070a] font-semibold rounded-lg text-[10px] font-mono transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-zinc-950" />
                  <span>VERIFYING REGISTRATION...</span>
                </>
              ) : (
                <>
                  <span>REGISTER ACCOUNT</span>
                  <ChevronRight size={13} />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-5 pt-4 border-t border-white/[0.04] text-center">
            <span className="text-[10px] text-slate-500">Already registered? </span>
            <Link to="/login" className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
              SIGN IN
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
