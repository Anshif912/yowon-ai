import { CheckCircle2, Loader2, XCircle, type LucideIcon } from 'lucide-react'
import type { AgentStatus } from '../../types'

interface AgentPipelineCardProps {
  label: string
  description: string
  status: AgentStatus
  index: number
  icon: LucideIcon
  color: string
}

export default function AgentPipelineCard({
  label, description, status, icon: Icon, color,
}: AgentPipelineCardProps) {
  const isCompleted = status === 'completed'
  const isRunning   = status === 'running'
  const isFailed    = status === 'failed'
  const isWaiting   = status === 'waiting'

  // Matte high-contrast styling matching #0C1015 panel colors
  const bgStyle = isRunning
    ? 'rgba(49, 230, 255, 0.04)' // Subtle Accent
    : isCompleted
    ? 'rgba(0, 208, 132, 0.03)'  // Subtle Success
    : isFailed
    ? 'rgba(255, 92, 92, 0.04)'   // Subtle Failure
    : '#080B0F'                  // Clean dark background

  const borderStyle = isRunning
    ? '1px solid #31E6FF'        // Accent
    : isCompleted
    ? '1px solid #00D084'        // Success
    : isFailed
    ? '1px solid #FF5C5C'        // Warning/Error
    : '1px solid #1B2735'        // Muted Border

  return (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-300"
      style={{
        background: bgStyle,
        border: borderStyle,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: isRunning ? 'rgba(49, 230, 255, 0.08)' : isCompleted ? 'rgba(0, 208, 132, 0.06)' : '#0C1015',
            border: `1px solid ${
              isRunning ? '#31E6FF' : isCompleted ? '#00D084' : '#1B2735'
            }`,
          }}
        >
          {isCompleted && <CheckCircle2 size={15} style={{ color: '#00D084' }} />}
          {isRunning   && <Loader2 size={14} className="animate-spin" style={{ color: '#31E6FF' }} />}
          {isFailed    && <XCircle size={15} style={{ color: '#FF5C5C' }} />}
          {isWaiting   && <Icon size={14} style={{ color: '#9CA3AF' }} />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold truncate"
              style={{
                color: isWaiting ? '#9CA3AF' : '#ffffff',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {label}
            </span>
          </div>
          <p
            className="text-[10px] truncate max-w-[200px] mt-0.5"
            style={{
              color: '#9CA3AF',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Enterprise status chips (styled with solid colors) */}
      <div className="shrink-0 ml-2">
        {isRunning && (
          <span
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#0C1E26] text-[#31E6FF] border border-[#31E6FF]/35"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            RUNNING
          </span>
        )}
        {isCompleted && (
          <span
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#0C1F17] text-[#00D084] border border-[#00D084]/25"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            DONE
          </span>
        )}
        {isFailed && (
          <span
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#221013] text-[#FF5C5C] border border-[#FF5C5C]/35"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            FAILED
          </span>
        )}
        {isWaiting && (
          <span
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#080B0F] text-[#9CA3AF] border border-[#1B2735]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            QUEUED
          </span>
        )}
      </div>
    </div>
  )
}
