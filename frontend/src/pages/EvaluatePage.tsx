import { useCallback, useMemo, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Cpu, Shield, Lightbulb, Globe, Gavel, Scale,
  Fingerprint, Brain, Network, Check, Loader2, AlertCircle,
  Clock, Activity, Layers, type LucideIcon,
} from 'lucide-react'
import AgentNetwork from '../components/evaluation/AgentNetwork'
import TerminalLog from '../components/evaluation/TerminalLog'
import { useEvaluationProgress } from '../hooks/useEvaluationProgress'
import { useEvaluationLock } from '../hooks/useEvaluationLock'
import type { AgentStatus } from '../types'
import BackgroundParticleField from '../components/effects/BackgroundParticleField'
import { api, triggerEvaluation } from '../api/api'
import ProjectClassificationWizard from '../components/evaluation/ProjectClassificationWizard'

/* ── Design Tokens ───────────────────────────────────────── */
const C = {
  cyan  : '#31E6FF', green : '#10B981', red  : '#FF5C5C',
  amber : '#F5B942', bg    : '#050608', panel: '#070A0F',
  border: '#111C27', text  : '#F3F4F6', muted: '#4B5563',
  sub   : '#9CA3AF',
  mono  : "'IBM Plex Mono', monospace",
  sans  : "'Inter', sans-serif",
}

/* ── Pipeline Steps ─────────────────────────────────────── */
const PIPELINE: Array<{ id: string; label: string; desc: string; icon: LucideIcon; accent: string }> = [
  { id: 'clone',        label: 'Repository Clone',     desc: 'Cloning source files',        icon: Globe,       accent: C.cyan          },
  { id: 'dependencies', label: 'Dependency Discovery', desc: 'Parsing manifests',           icon: Fingerprint, accent: C.cyan          },
  { id: 'ast',          label: 'AST Parsing',          desc: 'Building syntax tree',        icon: Cpu,         accent: '#7EB8FF'       },
  { id: 'dna',          label: 'Project DNA',          desc: 'Measuring complexity',        icon: Scale,       accent: C.amber         },
  { id: 'kg',           label: 'Knowledge Graph',      desc: 'Indexing semantics',          icon: Network,     accent: '#8D6BFF'       },
  { id: 'technical',    label: 'Technical Jury',        desc: 'Architecture review',        icon: Brain,       accent: C.cyan          },
  { id: 'security',     label: 'Security Jury',        desc: 'Vulnerability audit',         icon: Shield,      accent: C.red           },
  { id: 'innovation',   label: 'Innovation Jury',      desc: 'Novelty & impact',            icon: Lightbulb,   accent: '#F5A623'       },
  { id: 'decision',     label: 'Decision Engine',      desc: 'Final verdict',               icon: Gavel,       accent: C.amber         },
]

/* ── Stage Status Resolver ───────────────────────────────── */
function resolveStage(id: string, progress: any, globalStatus: string): AgentStatus {
  if (globalStatus === 'done') return 'completed'
  const step = progress?.step ?? 0
  const task = (progress?.current_task || '').toLowerCase()
  const ag   = progress?.agent_states || {}
  switch (id) {
    case 'clone':
      if (globalStatus === 'failed' && step === 0 && (task.includes('cloning') || task.includes('fetching'))) return 'failed'
      if (step > 0 || (step === 0 && !task.includes('fetching') && !task.includes('cloning') && task)) return 'completed'
      return 'running'
    case 'dependencies':
      if (step > 0) return 'completed'
      if (task.includes('dependency') || task.includes('building context') || task.includes('brief')) return 'running'
      return 'waiting'
    case 'ast':
      if (step > 0) return 'completed'
      if (task.includes('ast') || task.includes('parsing') || task.includes('intelligence')) return 'running'
      return 'waiting'
    case 'dna':
      if (step > 0) return 'completed'
      if (task.includes('dna') || task.includes('intelligence')) return 'running'
      return 'waiting'
    case 'kg':
      if (step > 0) return 'completed'
      if (task.includes('embeddings') || task.includes('knowledge') || task.includes('graph')) return 'running'
      return 'waiting'
    case 'technical':
      return (ag?.technical?.status || ag?.engineering?.status || (step === 1 ? 'running' : step > 1 ? 'completed' : 'waiting')) as AgentStatus
    case 'security':
      return (ag?.security?.status || (step === 2 ? 'running' : step > 2 ? 'completed' : 'waiting')) as AgentStatus
    case 'innovation':
      return (ag?.innovation?.status || (step === 4 ? 'running' : step > 4 ? 'completed' : 'waiting')) as AgentStatus
    case 'decision':
      return (ag?.chief?.status || ag?.scoring?.status || (step >= 6 ? 'running' : 'waiting')) as AgentStatus
    default: return 'waiting'
  }
}

/* ── Timeline Compact Stage Tile ──────────────────────────  */
function StepTile({ label, desc, status, icon: Icon, accent, index, durationSec }: {
  label: string
  desc: string
  status: AgentStatus
  icon: LucideIcon
  accent: string
  index: number
  durationSec?: number
}) {
  const reduced = useReducedMotion()
  const isDone = status === 'completed'
  const isRun  = status === 'running'
  const isFail = status === 'failed'
  const isWait = status === 'waiting'

  /* Waiting: 15% opacity, muted border */
  const opacity = isWait ? 0.45 : 1

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.22, ease: 'easeOut' }}
      style={{
        display      : 'flex',
        alignItems   : 'center',
        gap          : 9,
        padding      : isWait ? '6px 8px' : '8px 10px',
        borderRadius : 8,
        position     : 'relative',
        background   : isDone ? 'rgba(16, 185, 129, 0.06)' : isRun ? `${accent}0D` : 'transparent',
        border       : `1px solid ${
          isDone
            ? 'rgba(16, 185, 129, 0.45)'
            : isRun
            ? `${accent}66`
            : isFail
            ? `${C.red}50`
            : '#1A2535'
        }`,
        boxShadow    : isRun ? `0 0 14px ${accent}20` : 'none',
        transition   : 'border-color 200ms ease, background-color 250ms ease, box-shadow 250ms ease',
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width         : 24,
          height        : 24,
          borderRadius  : 6,
          background    : isDone ? 'rgba(16, 185, 129, 0.15)' : isRun ? `${accent}18` : '#111827',
          border        : `1px solid ${isDone ? C.green : isRun ? accent : '#1F2937'}`,
          display       : 'flex',
          alignItems    : 'center',
          justifyContent: 'center',
          flexShrink    : 0,
          transition    : 'all 200ms ease',
        }}
      >
        {isDone && (
          <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.18 }}>
            <Check size={11} style={{ color: C.green, strokeWidth: 3 }} />
          </motion.div>
        )}
        {isRun && (
          <motion.div animate={reduced ? {} : { rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
            <Loader2 size={11} style={{ color: accent }} />
          </motion.div>
        )}
        {isFail && <AlertCircle size={11} style={{ color: C.red }} />}
        {isWait && <Icon size={11} style={{ color: C.muted }} />}
      </div>

      {/* Label & Description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{
            fontFamily : C.sans, fontSize: isWait ? 10 : 10.5, fontWeight: isRun || isDone ? 600 : 500,
            color      : isWait ? C.muted : isDone ? C.text : isRun ? C.text : C.sub,
            lineHeight : 1.2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {label}
          </p>
        </div>
        <p style={{
          fontFamily : C.mono, fontSize: 7.5,
          color      : isDone ? C.green : isRun ? accent : '#374151',
          lineHeight : 1.2, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {isDone
            ? durationSec != null ? `Completed in ${durationSec}s` : 'Completed'
            : isRun
            ? 'Executing...'
            : desc}
        </p>
      </div>
    </motion.div>
  )
}

/* ── Header Metrics Component ────────────────────────────── */
function HeaderMetrics({
  statuses, agentStates, startTime,
}: {
  statuses: AgentStatus[]
  agentStates?: Record<string, any>
  startTime: number
}) {
  const [elapsedSec, setElapsedSec] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}m ${s < 10 ? '0' : ''}${s}s`
  }

  const completedStages = statuses.filter(s => s === 'completed').length
  const totalStages     = statuses.length

  const activeAgentsCount = agentStates
    ? Object.values(agentStates).filter((a: any) => a?.status === 'running' || a?.status === 'completed').length
    : 0
  const totalAgents = 6

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: C.mono, fontSize: 9 }}>
      {/* Elapsed Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.cyan, background: 'rgba(49, 230, 255, 0.06)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(49, 230, 255, 0.2)' }}>
        <Clock size={10} />
        <span>Evaluation {formatElapsed(elapsedSec)}</span>
      </div>

      {/* Active Agents */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.text, background: '#090F17', padding: '3px 8px', borderRadius: 6, border: '1px solid #1A2535' }}>
        <Activity size={10} style={{ color: C.cyan }} />
        <span>Active Agents <strong style={{ color: C.cyan }}>{activeAgentsCount}</strong> / {totalAgents}</span>
      </div>

      {/* Completed Stages */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.text, background: '#090F17', padding: '3px 8px', borderRadius: 6, border: '1px solid #1A2535' }}>
        <Layers size={10} style={{ color: C.green }} />
        <span>Completed <strong style={{ color: C.green }}>{completedStages}</strong> / {totalStages} stages</span>
      </div>
    </div>
  )
}

/* ── Main Evaluate Page ─────────────────────────────────── */
export default function EvaluatePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate      = useNavigate()
  const [startTime]   = useState<number>(Date.now())

  const { setLock, unlock, updateProgress } = useEvaluationLock()

  const onComplete = useCallback((id: string) => {
    setTimeout(() => { unlock(); navigate(`/report/${id}/overview`) }, 1600)
  }, [navigate, unlock])

  const [wizardCompleted, setWizardCompleted] = useState(false)
  const [triggering, setTriggering] = useState(false)

  const handleWizardComplete = async (data: any) => {
    setTriggering(true)
    try {
      await api.post(`/api/v1/evaluation/project-context/${projectId}`, data)
      await triggerEvaluation(projectId!)
      setWizardCompleted(true)
    } catch (err) {
      console.error('Failed to trigger evaluation:', err)
    } finally {
      setTriggering(false)
    }
  }

  const { 
    status, 
    reportStatus, 
    reportError, 
    projectType, 
    projectDomain,
    progress 
  } = useEvaluationProgress(projectId, onComplete)

  const isDone = status === 'done', isFailed = status === 'failed'

  const showWizard = !projectDomain && !wizardCompleted && status !== 'running' && status !== 'done' && status !== 'failed'

  if (showWizard) {
    return <ProjectClassificationWizard onComplete={handleWizardComplete} />
  }

  if (triggering) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050608] text-white space-y-4">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
        <p className="font-mono text-xs text-zinc-400">Initializing workspace calibration context...</p>
      </div>
    )
  }

  useEffect(() => {
    if (projectId) setLock(projectId, 'Initializing...', 0)
    const guard = (e: BeforeUnloadEvent) => {
      if (!isDone && !isFailed) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [isDone, isFailed, projectId, setLock])

  useEffect(() => {
    if (progress) updateProgress(progress.current_task || 'Processing...', progress.completion_percent || 0)
  }, [progress, updateProgress])

  const activeAgent   = progress.agent === 'brief' ? 'coordinator' : progress.agent
  const agentStatuses = useMemo<AgentStatus[]>(
    () => PIPELINE.map(p => resolveStage(p.id, progress, status)),
    [progress, status],
  )

  return (
    <motion.div
      className="flex-1 overflow-hidden min-h-0 flex flex-row"
      style={{ background: C.bg }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
    >
      {/* ═══════════════════════════════════
          LEFT — Timeline ~22% width
      ═══════════════════════════════════ */}
      <div
        className="shrink-0 flex flex-col h-full"
        style={{ width: '22%', minWidth: 220, maxWidth: 300, borderRight: `1px solid ${C.border}`, background: C.panel }}
      >
        <div className="px-3.5 pt-4 pb-2.5 shrink-0 border-b border-[#111C27]">
          <p style={{ fontFamily: C.mono, fontSize: 8.5, color: C.muted, letterSpacing: '0.24em', textTransform: 'uppercase', margin: 0 }}>
            Pipeline Timeline
          </p>
        </div>

        {/* Stage List */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <div className="overflow-y-auto px-2.5 py-2 space-y-1.5 custom-scrollbar" style={{ maxHeight: '100%' }}>
            {PIPELINE.map((p, i) => {
              const stateEntry = progress?.agent_states?.[p.id]
              return (
                <StepTile
                  key={p.id}
                  label={p.label}
                  desc={p.desc}
                  status={agentStatuses[i]}
                  icon={p.icon}
                  accent={p.accent}
                  index={i}
                  durationSec={stateEntry?.duration_sec ?? undefined}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════
          CENTER — Hero ~56% width (flex-1)
      ═══════════════════════════════════ */}
      <div className="flex-1 min-w-0 relative flex flex-col">
        {/* Top Header with Runtime Feedback Bar */}
        <div className="shrink-0 px-6 pt-4 pb-1 relative z-10 flex items-center justify-between">
          <div>
            <p style={{ fontFamily: C.sans, fontSize: 11, fontWeight: 700, color: C.text, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
              AI Council Network
            </p>
            <p style={{ fontFamily: C.mono, fontSize: 8.5, color: C.sub, marginTop: 2 }}>
              Live agent topology & execution telemetry
            </p>
          </div>

          {/* Runtime Feedback Component */}
          <HeaderMetrics
            statuses={agentStatuses}
            agentStates={progress.agent_states}
            startTime={startTime}
          />
        </div>

        {/* Graph Hero Canvas */}
        <div className="flex-1 min-h-0 relative">
          <BackgroundParticleField />
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <AgentNetwork
              activeAgent={activeAgent}
              agentStates={progress.agent_states}
              statuses={agentStatuses}
              showPresentation={projectType === 'Hackathon Project'}
              status={status}
            />
          </div>
        </div>

        {/* Session ID */}
        {projectId && (
          <div className="shrink-0 flex justify-center pb-2.5 relative z-10">
            <p style={{ fontFamily: C.mono, fontSize: 7.5, color: '#1B2936' }}>
              Session {projectId}
            </p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════
          RIGHT — System Log ~22% width (340-360px)
      ═══════════════════════════════════ */}
      <div
        className="shrink-0 flex flex-col h-full"
        style={{ width: '22%', minWidth: 240, maxWidth: 360, borderLeft: `1px solid ${C.border}`, background: C.panel }}
      >
        <div className="flex-1 min-h-0 p-2.5">
          <TerminalLog logs={progress.logs} />
        </div>
      </div>
    </motion.div>
  )
}
