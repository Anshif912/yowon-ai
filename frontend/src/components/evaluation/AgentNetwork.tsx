import { motion } from 'framer-motion'
import {
  Cpu, Shield, Presentation, Lightbulb, Globe, Gavel, Brain,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AgentStateEntry, AgentStatus } from '../../types'

const PIPELINE = [
  { id: 'coordinator', icon: Brain, label: 'Coordinator', role: 'Evaluation Orchestrator', color: '#00E5FF' },
  { id: 'technical', icon: Cpu, label: 'Engineering Agent', role: 'Architecture Analysis', color: '#00E5FF' },
  { id: 'security', icon: Shield, label: 'Security Agent', role: 'Security Review', color: '#EF4444' },
  { id: 'presentation', icon: Presentation, label: 'Presentation Agent', role: 'Pitch Evaluation', color: '#7C3AED' },
  { id: 'innovation', icon: Lightbulb, label: 'Innovation Agent', role: 'Novelty Analysis', color: '#00FFA3' },
  { id: 'risk', icon: Globe, label: 'Risk Agent', role: 'Risk Assessment', color: '#00FFA3' },
  { id: 'chief', icon: Gavel, label: 'Chief Evaluation Agent', role: 'Verdict Synthesis', color: '#7C3AED' },
] as const

const STATUS_LABEL: Record<AgentStatus, string> = {
  waiting: 'Waiting',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
}

interface AgentNetworkProps {
  activeAgent: string
  agentStates?: Record<string, AgentStateEntry>
  statuses: AgentStatus[]
}

function nodeStatus(
  id: string,
  agentStates?: Record<string, AgentStateEntry>,
  statuses?: AgentStatus[],
  index?: number,
): AgentStatus {
  const state = agentStates?.[id]
  if (state?.status === 'failed') return 'failed'
  if (state?.status === 'completed') return 'completed'
  if (state?.status === 'running') return 'running'
  return statuses?.[index ?? 0] ?? 'waiting'
}

function statusStyles(status: AgentStatus) {
  if (status === 'completed') {
    return {
      card: 'border-emerald-300/50 bg-emerald-400/[0.10] shadow-[0_0_24px_rgba(0,255,163,0.22)]',
      dot: 'bg-emerald-300 shadow-[0_0_12px_rgba(0,255,163,0.9)]',
      text: 'text-emerald-200',
      line: 'from-emerald-300 via-cyan-300 to-cyan-300',
    }
  }

  if (status === 'running') {
    return {
      card: 'border-cyan-300/65 bg-cyan-300/[0.12] shadow-[0_0_30px_rgba(0,229,255,0.32)]',
      dot: 'bg-cyan-300 shadow-[0_0_14px_rgba(0,229,255,0.95)]',
      text: 'text-cyan-200',
      line: 'from-cyan-300 via-cyan-100 to-violet-300',
    }
  }

  if (status === 'failed') {
    return {
      card: 'border-red-300/55 bg-red-500/[0.12] shadow-[0_0_24px_rgba(239,68,68,0.22)]',
      dot: 'bg-red-300 shadow-[0_0_12px_rgba(239,68,68,0.9)]',
      text: 'text-red-200',
      line: 'from-red-300 via-red-300 to-red-300',
    }
  }

  return {
    card: 'border-white/10 bg-white/[0.035] opacity-65',
    dot: 'bg-slate-500',
    text: 'text-slate-400',
    line: 'from-white/10 via-white/10 to-white/10',
  }
}

function isActiveAgent(activeAgent: string, id: string) {
  return activeAgent === id || (activeAgent === 'brief' && id === 'coordinator')
}

function AgentNode({
  id,
  label,
  role,
  color,
  icon: Icon,
  status,
  active,
  duration,
}: {
  id: string
  label: string
  role: string
  color: string
  icon: LucideIcon
  status: AgentStatus
  active: boolean
  duration?: number | null
}) {
  const styles = statusStyles(status)

  return (
    <motion.div
      className="relative z-10 flex w-[150px] shrink-0 flex-col items-center"
      animate={active ? { y: [0, -4, 0] } : { y: 0 }}
      transition={{ duration: 1.4, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
    >
      {status === 'running' && (
        <motion.div
          className="absolute -top-2 h-[72px] w-[72px] rounded-full border border-t-cyan-200/80 border-r-transparent border-b-violet-300/50 border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <motion.div
        className={`relative flex h-[68px] w-[68px] items-center justify-center rounded-2xl border backdrop-blur-xl transition-all duration-300 ${styles.card}`}
        animate={active ? {
          boxShadow: [
            `0 0 18px ${color}44`,
            `0 0 38px ${color}66`,
            `0 0 18px ${color}44`,
          ],
        } : undefined}
        transition={{ duration: 1.8, repeat: active ? Infinity : 0 }}
      >
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_34%),linear-gradient(135deg,rgba(0,229,255,0.08),rgba(124,58,237,0.08))]" />
        <Icon size={24} className="relative" style={{ color: status === 'waiting' ? '#64748B' : color }} />
      </motion.div>

      <div className="mt-3 min-h-[74px] text-center">
        <p className="text-[11px] font-display font-semibold leading-tight text-yowon-text">{label}</p>
        <p className="mt-1 text-[8px] font-mono uppercase tracking-widest text-yowon-muted">{role}</p>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
          <span className={`text-[9px] font-mono uppercase ${styles.text}`}>{STATUS_LABEL[status]}</span>
        </div>
        {duration != null && status === 'completed' && (
          <p className="mt-1 text-[8px] font-mono text-emerald-300/75">{duration}s</p>
        )}
      </div>

      <span className="sr-only">{id}</span>
    </motion.div>
  )
}

function FlowConnector({
  fromStatus,
  toStatus,
  active,
}: {
  fromStatus: AgentStatus
  toStatus: AgentStatus
  active: boolean
}) {
  const lineStyle = statusStyles(active ? 'running' : fromStatus === 'completed' ? 'completed' : toStatus === 'failed' ? 'failed' : 'waiting')

  return (
    <div className="relative mt-[31px] h-8 min-w-[74px] flex-1">
      <div className={`absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r ${lineStyle.line}`} />
      <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-r border-t border-cyan-200/50" />
      {active && (
        <>
          <motion.span
            className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,0.95)]"
            initial={{ left: 0, opacity: 0 }}
            animate={{ left: ['0%', '96%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.15, repeat: Infinity, ease: 'linear' }}
          />
          <motion.span
            className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-200 shadow-[0_0_10px_rgba(167,139,250,0.9)]"
            initial={{ left: 0, opacity: 0 }}
            animate={{ left: ['0%', '96%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.15, repeat: Infinity, ease: 'linear', delay: 0.45 }}
          />
        </>
      )}
    </div>
  )
}

export default function AgentNetwork({ activeAgent, agentStates, statuses }: AgentNetworkProps) {
  const resolved = PIPELINE.map((agent, index) => ({
    ...agent,
    status: nodeStatus(agent.id, agentStates, statuses, index),
    duration: agentStates?.[agent.id]?.duration_sec,
  }))

  return (
    <div className="relative mx-auto w-full max-w-[980px] overflow-hidden rounded-[8px] border border-cyan-300/10 bg-[#06101D]/80 p-5 shadow-[inset_0_0_70px_rgba(0,229,255,0.06)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(0,229,255,0.14),transparent_28%),radial-gradient(circle_at_88%_78%,rgba(124,58,237,0.16),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="relative mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyan-300">YOWON AI Architecture Flow</p>
          <p className="mt-1 text-xs text-yowon-muted">Sequential judge simulation pipeline and verdict synthesis path.</p>
        </div>
        <div className="hidden rounded-lg border border-cyan-300/15 bg-slate-950/50 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-100 sm:block">
          Live Data Flow
        </div>
      </div>

      <div className="relative overflow-x-auto pb-1">
        <div className="flex min-w-[980px] items-start">
          {resolved.map((agent, index) => {
            const next = resolved[index + 1]
            const active = isActiveAgent(activeAgent, agent.id)
            const connectorActive = agent.status === 'running'
              || agent.status === 'completed'
              || next?.status === 'running'

            return (
              <div key={agent.id} className="flex items-start">
                <AgentNode
                  id={agent.id}
                  label={agent.label}
                  role={agent.role}
                  color={agent.color}
                  icon={agent.icon}
                  status={agent.status}
                  active={active}
                  duration={agent.duration}
                />
                {next && (
                  <FlowConnector
                    fromStatus={agent.status}
                    toStatus={next.status}
                    active={connectorActive}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
