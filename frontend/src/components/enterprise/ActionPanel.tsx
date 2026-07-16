import React from 'react'
import { LucideIcon, Loader2 } from 'lucide-react'

export interface ActionItem {
  label: string
  onClick: () => void
  icon?: LucideIcon
  intent?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  loading?: boolean
}

export interface ActionPanelProps {
  title: string
  description?: string
  status?: React.ReactNode
  actions?: ActionItem[]
  children?: React.ReactNode
  className?: string
  isDangerous?: boolean
}

const intentStyles = {
  primary: 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_12px_rgba(34,211,238,0.2)]',
  secondary: 'bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white',
  danger: 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300',
}

export default function ActionPanel({
  title,
  description,
  status,
  actions = [],
  children,
  className = '',
  isDangerous = false,
}: ActionPanelProps) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-[#0b0c10]/80 backdrop-blur-md p-6 select-none overflow-hidden ${
        isDangerous ? 'border-red-500/30' : 'border-white/5'
      } ${className}`}
    >
      {/* Dynamic top-edge light strip */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] ${
          isDangerous
            ? 'bg-gradient-to-r from-red-500/40 via-red-500/20 to-transparent'
            : 'bg-gradient-to-r from-cyan-500/25 via-indigo-500/25 to-transparent'
        }`}
      />

      {/* Header Info */}
      <div className="flex flex-col gap-1.5 mb-5 text-left">
        <h3 className="text-sm font-bold text-white tracking-wider font-mono uppercase">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium">
            {description}
          </p>
        )}
      </div>

      {/* Optional Status Row */}
      {status && (
        <div className="mb-5 flex items-center justify-between border-y border-white/5 py-3 text-xs text-left">
          <span className="font-mono text-zinc-500 tracking-wider">STATE:</span>
          {status}
        </div>
      )}

      {/* Main custom content body */}
      {children && <div className="mb-5 text-left">{children}</div>}

      {/* Standardized Action Buttons Stack */}
      {actions.length > 0 && (
        <div className="flex flex-col gap-2.5 mt-auto">
          {actions.map((act, index) => {
            const btnIntent = act.intent || 'secondary'
            const CustomIcon = act.icon

            return (
              <button
                key={index}
                onClick={act.onClick}
                disabled={act.disabled || act.loading}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono font-bold rounded-lg disabled:opacity-40 transition-all duration-150 ${intentStyles[btnIntent]}`}
              >
                {act.loading ? (
                  <Loader2 className="animate-spin" size={13} />
                ) : (
                  CustomIcon && <CustomIcon size={13} className="shrink-0" />
                )}
                <span>{act.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
