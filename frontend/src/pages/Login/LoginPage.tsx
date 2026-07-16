import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Mail, Lock, Eye, EyeOff, Loader2, 
  AlertTriangle, Chrome, Github, Terminal, CheckCircle2, 
  ChevronRight, KeyRound, Globe, Server
} from 'lucide-react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../components/auth/AuthContext'
import SoftAurora from '../../components/effects/SoftAurora'

export default function LoginPage() {
  const { login, isAuthenticated, providersMetadata, platformInitialized } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Routing query parameter parsing
  const params = new URLSearchParams(location.search)
  const redirectTo = params.get('redirect_to') || '/dashboard'

  // Form fields state
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

  // Redirect if already logged in or if platform requires bootstrap setup
  useEffect(() => {
    if (!platformInitialized) {
      navigate('/register-organization')
    } else if (isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, platformInitialized, navigate, redirectTo])

  // Caps lock detection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) {
      setCapsLockActive(true)
    } else {
      setCapsLockActive(false)
    }
  }

  // Handle Login submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMsg(null)

    // Form Validation
    if (!email) {
      setFormError('Please enter your email address.')
      triggerErrorState()
      return
    }
    if (!password) {
      setFormError('Please enter your password.')
      triggerErrorState()
      return
    }

    setIsSubmitLoading(true)
    try {
      await login(email, password, rememberMe)
      setSuccessMsg('Session authorized successfully. Access granted.')
    } catch (err: any) {
      const serverMsg = err.response?.data?.detail || err.response?.data?.message || 'Authentication connection failed.'
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

  // OAuth Provider buttons helper
  const renderProviderButton = (providerKey: string, icon: React.ReactNode, label: string) => {
    const meta = providersMetadata[providerKey] || { configured: false, status: 'Not Configured', tooltip: 'This authentication provider has not been configured by your administrator.' }
    const isConfigured = meta.configured
    
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    const API_BASE = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:8000' : 'http://127.0.0.1:8000')

    return (
      <div className="relative group" key={providerKey}>
        <button
          type="button"
          disabled={!isConfigured || isSubmitLoading}
          onClick={() => {
            if (isConfigured) {
              // Trigger redirect to OAuth flow URL on the backend
              window.location.href = `${API_BASE}/api/v1/auth/oauth/${providerKey}/redirect`
            }
          }}
          className={`w-full flex items-center justify-center gap-2 py-2 bg-white/[0.01] border rounded-lg text-[10px] font-mono transition-all ${

            isConfigured 
              ? 'hover:bg-white/[0.04] border-white/10 text-slate-300 hover:text-white cursor-pointer' 
              : 'border-white/5 text-slate-600 cursor-not-allowed opacity-50'
          }`}
        >
          {icon}
          <span>{label}</span>
          {!isConfigured && <span className="ml-1 text-[8px] opacity-75 font-semibold">({meta.status})</span>}
        </button>
        
        {!isConfigured && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-black/95 border border-white/10 text-slate-400 p-2 rounded text-[8px] leading-normal font-sans shadow-xl text-center z-50">
            {meta.tooltip}
          </div>
        )}
      </div>
    )
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
              Securely authenticate to your organization workspace.
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. administrator@yourorg.com"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 pl-9 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                />
                <Mail className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider">Password</label>
                <a href="/forgot-password" className="text-[9.5px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline transition-all">Forgot?</a>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 pl-9 pr-9 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                />
                <Lock className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-all"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Caps Lock warning indicator */}
            {capsLockActive && (
              <div className="flex items-center gap-2 text-amber-500 font-mono text-[9px] uppercase px-1">
                <AlertTriangle size={12} />
                <span>Warning: Caps Lock is active</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/10 bg-black/40 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Remember Session Context</span>
              </label>
            </div>

            {/* Error & Success indicators */}
            {formError && (
              <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 font-sans text-xs">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">{formError}</p>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 font-sans text-xs">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">{successMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 border border-white/10 rounded-lg text-[11px] font-mono text-white uppercase tracking-wider shadow-lg shadow-cyan-500/5 hover:shadow-cyan-400/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ChevronRight size={13} />
                </>
              )}
            </button>
          </form>

          {/* Trust Indicators */}
          <div className="mt-6 border-t border-white/5 pt-4">
            <div className="grid grid-cols-2 gap-2 text-[8px] font-mono text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><KeyRound size={10} className="text-cyan-500" /><span>Enterprise Security</span></div>
              <div className="flex items-center gap-1.5"><Globe size={10} className="text-cyan-500" /><span>Workspace Isolation</span></div>
              <div className="flex items-center gap-1.5"><Terminal size={10} className="text-cyan-500" /><span>End-to-End Audit</span></div>
              <div className="flex items-center gap-1.5"><Server size={10} className="text-cyan-500" /><span>RBAC Protected</span></div>
            </div>
          </div>

          {/* Third Party OAuth layouts */}
          <div className="space-y-4 mt-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute border-t border-white/5 w-full" />
              <span className="relative px-3 bg-[#0c0d13] text-[9.5px] font-mono text-slate-500 uppercase tracking-wider">
                Or authorize with
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {renderProviderButton("google", <Chrome size={12} className="text-cyan-400" />, "Google")}
              {renderProviderButton("github", <Github size={12} className="text-indigo-400" />, "GitHub")}
            </div>

            <div className="mt-5 pt-4 border-t border-white/[0.04] text-center">
              <span className="text-[10px] text-slate-500">New to YOWON AI? </span>
              <Link to="/register" className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
                CREATE ACCOUNT
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
