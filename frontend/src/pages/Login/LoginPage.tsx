import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Mail, Lock, Eye, EyeOff, Loader2, 
  AlertTriangle, Chrome, Github, Terminal, CheckCircle2, ChevronRight
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/auth/AuthContext'
import SoftAurora from '../../components/effects/SoftAurora'

export default function LoginPage() {
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Routing query parameter parsing
  const params = new URLSearchParams(location.search)
  const redirectTo = params.get('redirect_to') || '/submit'

  // View state: login | register | forgot | check_email
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'check_email'>('login')

  // Form fields state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Validation / interaction states
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [capsLockActive, setCapsLockActive] = useState(false)
  const [shakeTrigger, setShakeTrigger] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, navigate, redirectTo])

  // Caps lock detection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true)
    } else {
      setCapsLockActive(false)
    }
  }

  // Handle Login & Register submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMsg(null)

    // Form Validation
    if (!email) {
      setFormError('Please enter your email address')
      triggerErrorState()
      return
    }
    if (!password) {
      setFormError('Please enter your password')
      triggerErrorState()
      return
    }
    if (mode === 'register' && !fullName) {
      setFormError('Please enter your full name')
      triggerErrorState()
      return
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long')
      triggerErrorState()
      return
    }

    setIsSubmitLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password, rememberMe)
        setSuccessMsg('System authorization granted. Welcome back.')
      } else if (mode === 'register') {
        await register(fullName, email, password)
        // Auto transition to login or show verification email message
        setSuccessMsg('Account created successfully. Authenticating session...')
        // Auto-login registered user
        await login(email, password, rememberMe)
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.detail || err.response?.data?.message || 'Authentication connection failed'
      setFormError(serverMsg)
      triggerErrorState()
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const triggerErrorState = () => {
    setShakeTrigger(true)
    setTimeout(() => setShakeTrigger(false), 500)
  }

  // Handle forgot password request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setFormError('Please enter your email address')
      triggerErrorState()
      return
    }
    setIsSubmitLoading(true)
    try {
      // Mock call or routes
      setMode('check_email')
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Request failed')
    } finally {
      setIsSubmitLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden select-none bg-[#07070a]">
      {/* Dynamic Animated background context */}
      <SoftAurora colorStops={['#00F5FF', '#8B5CF6', '#4F46E5']} speed={0.4} amplitude={1.0} />

      {/* Main Glass Login Card container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          x: shakeTrigger ? [-8, 8, -6, 6, -4, 4, 0] : 0
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[440px] z-10 glass-card bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 space-y-6 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300"
        onKeyDown={handleKeyDown}
      >
        {/* Soft aura card header glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-20 pointer-events-none" />

        {/* Branding/Header Section */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl text-cyan-400 shadow-inner group-hover:text-cyan-300 transition-colors">
            <Shield size={32} className="stroke-[1.5]" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold tracking-[0.2em] text-white">YOWON AI</h1>
            <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mt-0.5">AI Operating System</p>
          </div>
          {mode === 'login' && <p className="text-xs text-slate-400 max-w-xs mx-auto">Authorize connection to establish sandbox session.</p>}
          {mode === 'register' && <p className="text-xs text-slate-400 max-w-xs mx-auto">Register credentials to provision sandbox node.</p>}
          {mode === 'forgot' && <p className="text-xs text-slate-400 max-w-xs mx-auto">Enter registration email to recover credentials.</p>}
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-red-500/10 border border-red-500/25 p-3 rounded-lg flex items-start gap-2.5 text-red-300 text-xs font-mono"
            >
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-lg flex items-start gap-2.5 text-emerald-300 text-xs font-mono"
            >
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Forms */}
        {mode === 'check_email' ? (
          <div className="space-y-4 py-2 text-center font-mono">
            <p className="text-xs text-slate-300">
              An email containing password recovery tokens has been dispatched to:
            </p>
            <div className="bg-white/5 border border-white/10 px-3.5 py-2 rounded text-cyan-300 text-xs break-all select-all font-mono">
              {email}
            </div>
            <button
              onClick={() => setMode('login')}
              className="w-full justify-center glass-pill hover:bg-white/5 text-xs text-cyan-400 mt-2 py-2"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={mode === 'forgot' ? handleForgotPassword : handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Terminal size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    disabled={isSubmitLoading}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alexander Pierce"
                    className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-white/10 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-white/[0.04] transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  disabled={isSubmitLoading}
                  autoComplete="username email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. operator@yowon.ai"
                  className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-white/10 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-white/[0.04] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      disabled={isSubmitLoading}
                      onClick={() => setMode('forgot')}
                      className="text-[9.5px] font-mono text-cyan-400/80 hover:text-cyan-300"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isSubmitLoading}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-10 py-2 bg-white/[0.02] border border-white/10 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-white/[0.04] transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Caps Lock warning */}
            {capsLockActive && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono">
                <AlertTriangle size={11} />
                <span>Warning: Caps Lock is active.</span>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300 font-mono text-[10px] uppercase select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    disabled={isSubmitLoading}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-white/5 border border-white/10 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                  />
                  <span>Remember session context</span>
                </label>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold rounded-lg text-xs tracking-wider transition-all disabled:opacity-50 select-none cursor-pointer"
            >
              {isSubmitLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>AUTHENTICATING NODE...</span>
                </>
              ) : (
                <>
                  <span className="uppercase">{mode === 'login' ? 'Establish Session' : mode === 'register' ? 'Provision Sandbox' : 'Recover Sandbox'}</span>
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Third Party OAuth layouts */}
        {mode === 'login' && (
          <div className="space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute border-t border-white/5 w-full" />
              <span className="relative px-3 bg-[#0c0d13] text-[9.5px] font-mono text-slate-500 uppercase tracking-wider">
                Or authorize with
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isSubmitLoading}
                onClick={() => setFormError('OAuth authentication integrations are locked in demo sandbox')}
                className="flex items-center justify-center gap-2 py-2 bg-white/[0.01] hover:bg-white/[0.04] border border-white/10 rounded-lg text-[10px] font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <Chrome size={12} className="text-cyan-400" />
                <span>Google</span>
              </button>
              <button
                type="button"
                disabled={isSubmitLoading}
                onClick={() => setFormError('OAuth authentication integrations are locked in demo sandbox')}
                className="flex items-center justify-center gap-2 py-2 bg-white/[0.01] hover:bg-white/[0.04] border border-white/10 rounded-lg text-[10px] font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <Github size={12} className="text-indigo-400" />
                <span>GitHub</span>
              </button>
            </div>
          </div>
        )}

        {/* Switch forms footer */}
        <div className="text-center font-mono text-[10.5px] border-t border-white/5 pt-4">
          {mode === 'login' ? (
            <p className="text-slate-500">
              New node operator?{' '}
              <button
                type="button"
                disabled={isSubmitLoading}
                onClick={() => { setMode('register'); setFormError(null); }}
                className="text-cyan-400 hover:text-cyan-300 underline font-bold"
              >
                Register Node Credentials
              </button>
            </p>
          ) : (
            <p className="text-slate-500">
              Already possess clearance?{' '}
              <button
                type="button"
                disabled={isSubmitLoading}
                onClick={() => { setMode('login'); setFormError(null); }}
                className="text-cyan-400 hover:text-cyan-300 underline font-bold"
              >
                Establish Connection
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
