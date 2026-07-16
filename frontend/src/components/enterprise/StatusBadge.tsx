import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Loader2, Info, LucideIcon } from 'lucide-react'

export type StatusType = 'success' | 'warning' | 'error' | 'pending' | 'info' | 'neutral'

export interface StatusBadgeProps {
  status: StatusType | string
  customLabel?: string
  pulse?: boolean
  variant?: 'solid' | 'outline' | 'glass'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const statusConfig: Record<
  StatusType,
  {
    icon: LucideIcon
    label: string
    solid: string
    outline: string
    glass: string
    dot: string
  }
> = {
  success: {
    icon: CheckCircle2,
    label: 'Success',
    solid: 'bg-emerald-600 text-white border-emerald-500',
    outline: 'border-emerald-500/50 text-emerald-400 bg-transparent',
    glass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    dot: 'bg-emerald-400 shadow-[0_0_8px_#10b981]',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    solid: 'bg-amber-600 text-white border-amber-500',
    outline: 'border-amber-500/50 text-amber-400 bg-transparent',
    glass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    dot: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    solid: 'bg-red-600 text-white border-red-500',
    outline: 'border-red-500/50 text-red-400 bg-transparent',
    glass: 'bg-red-500/10 border-red-500/20 text-red-400',
    dot: 'bg-red-400 shadow-[0_0_8px_#ef4444]',
  },
  pending: {
    icon: Loader2,
    label: 'Pending',
    solid: 'bg-cyan-600 text-white border-cyan-500',
    outline: 'border-cyan-500/50 text-cyan-400 bg-transparent',
    glass: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    dot: 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]',
  },
  info: {
    icon: Info,
    label: 'Info',
    solid: 'bg-indigo-600 text-white border-indigo-500',
    outline: 'border-indigo-500/50 text-indigo-400 bg-transparent',
    glass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    dot: 'bg-indigo-400 shadow-[0_0_8px_#6366f1]',
  },
  neutral: {
    icon: HelpCircle,
    label: 'Neutral',
    solid: 'bg-zinc-700 text-white border-zinc-650',
    outline: 'border-zinc-550/50 text-zinc-400 bg-transparent',
    glass: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
    dot: 'bg-zinc-400 shadow-[0_0_8px_#a1a1aa]',
  },
}

const sizeStyles = {
  xs: 'px-1.5 py-0.5 text-[9px] rounded-md gap-1',
  sm: 'px-2 py-0.5 text-[10px] rounded-lg gap-1.5',
  md: 'px-2.5 py-1 text-xs rounded-xl gap-1.5',
  lg: 'px-3.5 py-1.5 text-sm rounded-xl gap-2',
}

const iconSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
}

export default function StatusBadge({
  status,
  customLabel,
  pulse = false,
  variant = 'glass',
  size = 'sm',
}: StatusBadgeProps) {
  const sanitizedStatus = status.toLowerCase() as StatusType
  const config = statusConfig[sanitizedStatus] || statusConfig.neutral
  const Icon = config.icon
  const labelText = customLabel || config.label

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider border select-none transition-all duration-150 ${
        config[variant]
      } ${sizeStyles[size]}`}
    >
      {/* Icon section (spinning for pending, static otherwise) */}
      {Icon && (
        <Icon
          className={`shrink-0 ${sanitizedStatus === 'pending' ? 'animate-spin' : ''}`}
          size={iconSizes[size]}
        />
      )}

      {/* Label Text */}
      <span>{labelText}</span>

      {/* Pulse Dot */}
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`} />
        </span>
      )}
    </span>
  )
}
