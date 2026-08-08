import { motion } from 'framer-motion'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import type { ProgressEvent } from '../../types'

const AGENT_LABELS: Record<string, string> = {
  coordinator: 'Coordinator',
  brief: 'Coordinator',
  technical: 'Forge',
  security: 'Sentinel',
  presentation: 'Showcase',
  innovation: 'Visionary',
  risk: 'Guardian',
  scoring: 'Score Engine',
  chief: 'YOWON Prime',
}

interface EvaluationTimelineProps {
  events?: ProgressEvent[]
  elapsedSeconds?: number
}

export default function EvaluationTimeline({ events = [], elapsedSeconds = 0 }: EvaluationTimelineProps) {
  const formatTime = (ts: number) => {
    const offset = Math.max(0, Math.round(ts - (events[0]?.ts ?? ts)))
    const m = Math.floor(offset / 60)
    const s = offset % 60
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
  }

  const displayEvents = events.filter(e => e.type === 'agent_start' || e.type === 'agent_complete')

  const cardStyle = {
    background: 'rgba(11, 16, 22, 0.82)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    boxShadow: '0 15px 45px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
  }

  if (displayEvents.length === 0) {
    return (
      <div className="p-6 flex flex-col justify-between h-full animate-pulse" style={cardStyle}>
        <div>
          <h2 className="text-xs font-mono text-yowon-muted uppercase tracking-[0.2em] mb-3">
            Live Timeline
          </h2>
          <p className="text-xs text-yowon-muted font-mono">Awaiting agent events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col justify-between h-full" style={cardStyle}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono text-yowon-muted uppercase tracking-[0.2em]">
            Live Timeline
          </h2>
          <span className="text-[10px] font-mono text-violet-400/80 bg-[#161224]/80 px-2 py-0.5 rounded-md border border-[#8D6BFF]/20">
            {elapsedSeconds}s elapsed
          </span>
        </div>
        <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
          {displayEvents.slice(-12).map((event, i) => {
            const label = event.label ?? AGENT_LABELS[event.agent] ?? event.agent
            const isComplete = event.type === 'agent_complete'
            const isFailed = isComplete && !!event.error

            return (
              <motion.div
                key={`${event.agent}-${event.type}-${i}`}
                className="flex items-center gap-2 text-[11px] font-mono py-0.5 border-b border-white/[0.02]"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {isFailed ? (
                  <XCircle size={12} className="text-red-400 shrink-0" />
                ) : isComplete ? (
                  <CheckCircle size={12} className="text-[#39FFB3] shrink-0" />
                ) : (
                  <Loader2 size={12} className="text-[#4BE7FF] shrink-0 animate-spin" />
                )}
                <span className="text-yowon-muted w-14 shrink-0">{formatTime(event.ts)}</span>
                <span className={isFailed ? 'text-red-300/80' : 'text-zinc-200'}>
                  {label}
                  {isComplete && event.duration_sec != null && (
                    <span className="text-[#39FFB3] ml-1.5 font-bold">({event.duration_sec}s)</span>
                  )}
                  {!isComplete && event.model && (
                    <span className="text-zinc-500 ml-1.5 text-[9px]">({event.model})</span>
                  )}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
