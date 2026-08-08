import React from 'react'
import { motion } from 'framer-motion'
import { Terminal, Shield, Check, Loader2 } from 'lucide-react'
import type { AuthPhase } from './AuthContext'
import SoftAurora from '../effects/SoftAurora'

const AURORA_COLORS: [string, string, string] = ['#00f0ff', '#3B82F6', '#8B5CF6'];

interface AuthProgressOverlayProps {
  phase: AuthPhase
}

const PHASES_ORDER: AuthPhase[] = [
  'INITIALIZING',
  'CHECKING_PLATFORM',
  'RESTORING_SESSION',
  'AUTHENTICATING',
  'LOADING_ORGANIZATION',
  'LOADING_WORKSPACE',
  'INITIALIZING_RBAC',
  'REDIRECTING',
  'READY'
]

export default function AuthProgressOverlay({ phase }: AuthProgressOverlayProps) {
  const currentIdx = PHASES_ORDER.indexOf(phase)

  const steps = [
    { key: 'sec_interface', label: 'Security Interface', activeAfter: 0, doneAfter: 1 },
    { key: 'platform', label: 'Platform Verification', activeAfter: 1, doneAfter: 2 },
    { key: 'credentials', label: 'Operator Credentials', activeAfter: 2, doneAfter: 3 },
    { key: 'org', label: 'Organization Databases', activeAfter: 4, doneAfter: 5 },
    { key: 'workspace', label: 'Active Workspace context', activeAfter: 5, doneAfter: 6 },
    { key: 'rbac', label: 'RBAC Policies Compilation', activeAfter: 6, doneAfter: 7 }
  ]

  const getStepStatus = (activeAfter: number, doneAfter: number) => {
    if (currentIdx > doneAfter) return 'done'
    if (currentIdx >= activeAfter) return 'active'
    return 'pending'
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05070a] text-slate-300 font-sans px-4 selection:bg-cyan-500/20">
      <SoftAurora colorStops={AURORA_COLORS} amplitude={0.8} />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-[#0c0d14]/90 border border-white/[0.08] rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden font-mono"
      >
        {/* Glow edge accent */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">YOWON AI SECURE OPERATING SYSTEM</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Terminal size={12} className="text-slate-400" />
            <span>v2.2.0</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-[11px] text-slate-400 leading-relaxed uppercase tracking-wide">
            Initializing Unified Multi-Agent Identity Tunnel...
          </div>
          
          <div className="h-[1px] bg-white/[0.05] my-2" />

          <div className="space-y-2.5">
            {steps.map((step) => {
              const status = getStepStatus(step.activeAfter, step.doneAfter)
              return (
                <div key={step.key} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-3">
                    {status === 'done' ? (
                      <div className="w-4 h-4 rounded border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    ) : status === 'active' ? (
                      <div className="w-4 h-4 flex items-center justify-center text-cyan-400">
                        <Loader2 size={12} className="animate-spin" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded border border-white/5 bg-white/[0.01]" />
                    )}
                    <span className={status === 'done' ? 'text-slate-400' : status === 'active' ? 'text-cyan-300 font-bold' : 'text-slate-600'}>
                      {step.label}
                    </span>
                  </div>
                  <div className="text-[9px] uppercase tracking-wider">
                    {status === 'done' ? (
                      <span className="text-emerald-400 font-bold">✓ VERIFIED</span>
                    ) : status === 'active' ? (
                      <span className="text-cyan-400 animate-pulse">PROCESSING...</span>
                    ) : (
                      <span className="text-slate-700">PENDING</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="h-[1px] bg-white/[0.05] my-2" />

          {phase === 'REDIRECTING' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center pt-2 text-[10px] text-cyan-400 uppercase tracking-widest animate-pulse font-bold"
            >
              Opening Command Center Dashboard...
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
