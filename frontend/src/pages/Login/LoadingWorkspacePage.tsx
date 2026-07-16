import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/auth/AuthContext'
import { useWorkspace } from '../../components/auth/WorkspaceContext'
import SoftAurora from '../../components/effects/SoftAurora'

export default function LoadingWorkspacePage() {
  const { authPhase, setAuthPhase } = useAuth()
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace()
  const navigate = useNavigate()
  
  // Track loading steps indexes:
  // 0: Authenticating, 1: Loading Organization, 2: Loading Workspace, 3: Loading Permissions, 4: Ready
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Step simulation flow
    if (authPhase === 'READY') {
      const timers: any[] = []
      
      // Step 1: Authenticating is already done (READY phase is reached)
      setCurrentStep(1)
      
      // Step 2: Load Organization
      timers.push(setTimeout(() => {
        setCurrentStep(2)
      }, 800))
      
      // Step 3: Load Workspace
      timers.push(setTimeout(() => {
        setCurrentStep(3)
      }, 1600))
      
      // Step 4: Load Permissions & Ready
      timers.push(setTimeout(() => {
        setCurrentStep(4)
      }, 2400))
      
      // Redirect
      timers.push(setTimeout(() => {
        navigate('/dashboard')
      }, 3000))

      return () => timers.forEach(t => clearTimeout(t))
    }
  }, [authPhase, navigate])

  const steps = [
    'Authenticating Operator Security Credentials',
    'Decrypting Organization Workspace Databases',
    'Resolving Active Multi-Agent Sandbox Environments',
    'Injecting Granular Role-Based Access Controls (RBAC)'
  ]

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#05070a] px-4">
      <SoftAurora colorStops={['#00e5ff', '#3B82F6', '#8B5CF6']} amplitude={1.0} />

      <div className="relative z-10 w-full max-w-sm bg-[#0c0d13]/90 border border-white/[0.06] rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-center space-y-6">
        {/* Brand Header */}
        <div className="space-y-2">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <Shield size={22} className="absolute inset-0 m-auto text-cyan-400" />
          </div>
          <h1 className="text-sm font-bold text-white uppercase tracking-wider font-display">Initializing Command Center</h1>
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Security Authorization Phase</p>
        </div>

        {/* Loading Steps Checkboxes list */}
        <div className="space-y-3 text-left">
          {steps.map((text, idx) => {
            const isCompleted = currentStep > idx
            const isActive = currentStep === idx
            
            return (
              <div 
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                  isCompleted 
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400/90' 
                    : isActive 
                      ? 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400' 
                      : 'bg-white/[0.01] border-white/5 text-slate-600'
                }`}
              >
                <div className="shrink-0 w-4 h-4 flex items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 size={13} className="animate-spin text-cyan-400" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  )}
                </div>
                <span className="text-[10px] font-mono leading-tight">{text}</span>
              </div>
            )
          })}
        </div>

        {/* Console loading progress indicator */}
        <div className="border-t border-white/5 pt-4 text-[9.5px] font-mono text-slate-500 flex justify-between items-center px-1">
          <span>Connection: Secure</span>
          <span>Status: {currentStep < 4 ? 'Synchronizing' : 'Complete'}</span>
        </div>
      </div>
    </div>
  )
}
