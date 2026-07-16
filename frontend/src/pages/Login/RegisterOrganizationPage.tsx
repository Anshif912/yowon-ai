import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Building2, User, Mail, Lock, Loader2, 
  CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft, Key
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/auth/AuthContext'
import SoftAurora from '../../components/effects/SoftAurora'

export default function RegisterOrganizationPage() {
  const { setupOrganization, platformInitialized } = useAuth()
  const navigate = useNavigate()

  // Wizard Steps: 1: License, 2: Organization, 3: Administrator, 4: Complete
  const [step, setStep] = useState(1)
  const [licenseAccepted, setLicenseAccepted] = useState(false)

  // Fields State
  const [orgName, setOrgName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Loading & error tracking
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Block accessing installer if platform is already initialized
  useEffect(() => {
    if (platformInitialized) {
      navigate('/login')
    }
  }, [platformInitialized, navigate])

  const handleNextStep = () => {
    setErrorMsg(null)
    if (step === 1 && !licenseAccepted) {
      setErrorMsg('You must accept the YOWON AI software agreement to proceed.')
      return
    }
    if (step === 2 && !orgName.trim()) {
      setErrorMsg('Please specify the organization name.')
      return
    }
    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setErrorMsg(null)
    setStep(step - 1)
  }

  const handleFinishSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // Validate fields
    if (!adminName.trim()) {
      setErrorMsg('Please enter the administrator name.')
      return
    }
    if (!email.trim()) {
      setErrorMsg('Please enter the email address.')
      return
    }
    if (!password) {
      setErrorMsg('Please specify a password.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await setupOrganization(orgName, adminName, email, password)
      setStep(4)
    } catch (err: any) {
      const serverMsg = err.response?.data?.detail || err.response?.data?.message || 'Failed to initialize platform setup.'
      setErrorMsg(serverMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#05070a] px-4 py-12">
      <SoftAurora colorStops={['#6366f1', '#8B5CF6', '#3B82F6']} amplitude={1.0} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-full max-w-md bg-[#0c0d13]/80 border border-white/[0.06] rounded-2xl p-6 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="text-center mb-6 space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Shield className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight text-white uppercase">Welcome to YOWON AI</h1>
            <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">Enterprise Platform Installation</p>
            
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {[1, 2, 3, 4].map((s) => (
                <div 
                  key={s} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    s === step ? 'bg-indigo-400 w-4' : s < step ? 'bg-indigo-600' : 'bg-slate-700'
                  }`} 
                />
              ))}
            </div>
          </div>

          {/* Errors display */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 font-sans text-xs">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* STEP 1: License Agreement */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Step 1: Licensing Terms</h2>
              <div className="h-48 overflow-y-auto bg-black/40 border border-white/5 rounded-lg p-3 text-[10px] font-mono text-slate-400 space-y-3 leading-relaxed scrollbar-thin">
                <p className="text-white font-bold uppercase">Software Licensing Agreement</p>
                <p>This software is provided to your organization under the terms of the YOWON AI Enterprise Terms of Service.</p>
                <p>1. **Workspace Isolation**: Data remains fully isolated within the provisioned organization database schema.</p>
                <p>2. **AI Model Usage**: Generative models are run securely inside context-aware execution filters.</p>
                <p>3. **Auditability**: All actions, evaluations, and modifications are logged to immutable append-only trails.</p>
                <p>4. **Governing Rules**: You agree not to reverse engineer or modify the core frozen engine contracts.</p>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
                <input 
                  type="checkbox" 
                  checked={licenseAccepted}
                  onChange={(e) => setLicenseAccepted(e.target.checked)}
                  className="rounded border-white/10 bg-black/40 text-indigo-500 focus:ring-0 w-4 h-4"
                />
                <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wide">
                  I accept the licensing terms and conditions
                </span>
              </label>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 border border-white/10 rounded-lg text-[10.5px] font-mono text-white uppercase tracking-wider transition-all cursor-pointer"
              >
                <span>Accept & Continue</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* STEP 2: Configure Organization */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">Step 2: Configure Organization</h2>
              <p className="text-[10.5px] text-slate-400 leading-normal">
                Bootstrap the organization profile. This creates the primary administrative boundaries and default workspaces.
              </p>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Organization Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 pl-9 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                  />
                  <Building2 className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg text-[10.5px] font-mono text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <ChevronLeft size={13} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 border border-white/10 rounded-lg text-[10.5px] font-mono text-white uppercase tracking-wider transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Setup Administrator */}
          {step === 3 && (
            <form onSubmit={handleFinishSetup} className="space-y-4">
              <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">Step 3: Administrative Credentials</h2>
              <p className="text-[10.5px] text-slate-400 leading-normal">
                Define the primary system administrator account credentials. This account holds root authorization capabilities.
              </p>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Administrator Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 pl-9 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                  />
                  <User className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@yourorg.com"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 pl-9 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                  />
                  <Mail className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8+ characters"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handlePrevStep}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg text-[10.5px] font-mono text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <ChevronLeft size={13} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 border border-white/10 rounded-lg text-[10.5px] font-mono text-white uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Installing...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Installation</span>
                      <CheckCircle2 size={13} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Installation Complete */}
          {step === 4 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
                <CheckCircle2 size={24} />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Installation Successful</h2>
                <p className="text-[10.5px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Your organization **{orgName}** and system administrator account **{email}** have been successfully provisioned.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 border border-white/10 rounded-lg text-[10.5px] font-mono text-white uppercase tracking-wider transition-all cursor-pointer"
              >
                <span>Enter Command Center</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
