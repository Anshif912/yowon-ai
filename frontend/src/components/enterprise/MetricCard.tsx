import React from 'react'
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

export interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  icon?: LucideIcon
  trend?: {
    value: string | number
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  loading?: boolean
  onClick?: () => void
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose'
}

const accentConfig = {
  cyan: {
    border: 'hover:border-cyan-500/30',
    glow: 'rgba(34,211,238,0.15)',
    iconBg: 'bg-cyan-500/10',
    iconText: 'text-cyan-400',
  },
  emerald: {
    border: 'hover:border-emerald-500/30',
    glow: 'rgba(16,185,129,0.15)',
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-400',
  },
  amber: {
    border: 'hover:border-amber-500/30',
    glow: 'rgba(245,158,11,0.15)',
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-400',
  },
  violet: {
    border: 'hover:border-violet-500/30',
    glow: 'rgba(139,92,246,0.15)',
    iconBg: 'bg-violet-500/10',
    iconText: 'text-violet-400',
  },
  rose: {
    border: 'hover:border-rose-500/30',
    glow: 'rgba(244,63,94,0.15)',
    iconBg: 'bg-rose-500/10',
    iconText: 'text-rose-400',
  },
}

export default function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  loading = false,
  onClick,
  accentColor = 'cyan',
}: MetricCardProps) {
  const config = accentConfig[accentColor]

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0b0c10] p-6 flex flex-col gap-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-white/5" />
          <div className="h-8 w-8 rounded-lg bg-white/5" />
        </div>
        <div className="h-8 w-32 rounded bg-white/5" />
        <div className="h-3 w-40 rounded bg-white/5" />
      </div>
    )
  }

  const Wrapper = onClick ? motion.button : motion.div

  return (
    <Wrapper
      onClick={onClick}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-xl border border-white/5 bg-[#0b0c10]/80 backdrop-blur-sm p-6 flex flex-col text-left transition-colors duration-300 w-full select-none ${
        onClick ? 'cursor-pointer ' + config.border : ''
      }`}
      style={
        onClick
          ? {
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.05)`,
            }
          : undefined
      }
    >
      {/* Accent glow on hover */}
      {onClick && (
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${config.glow}, transparent 60%)`,
          }}
        />
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">
          {label}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg ${config.iconBg} ${config.iconText} shrink-0`}>
            <Icon size={16} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-extrabold font-display text-white tracking-tight">
          {value}
        </span>
      </div>

      {/* Footer Info / Trend */}
      {(trend || subtext) && (
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-t border-white/5 pt-3 mt-auto">
          {trend ? (
            <div className="flex items-center gap-1">
              {trend.direction === 'up' && (
                <span className="inline-flex items-center gap-0.5 text-emerald-400 font-semibold font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  <ArrowUpRight size={12} className="shrink-0" />
                  {trend.value}
                </span>
              )}
              {trend.direction === 'down' && (
                <span className="inline-flex items-center gap-0.5 text-rose-400 font-semibold font-mono bg-rose-500/10 px-1.5 py-0.5 rounded">
                  <ArrowDownRight size={12} className="shrink-0" />
                  {trend.value}
                </span>
              )}
              {trend.direction === 'neutral' && (
                <span className="inline-flex items-center gap-0.5 text-zinc-400 font-semibold font-mono bg-zinc-500/10 px-1.5 py-0.5 rounded">
                  <Minus size={12} className="shrink-0" />
                  {trend.value}
                </span>
              )}
              {trend.label && (
                <span className="text-[10px] text-zinc-500 font-mono tracking-wide">
                  {trend.label}
                </span>
              )}
            </div>
          ) : (
            <div />
          )}

          {subtext && (
            <span className="text-[11px] text-zinc-500 font-medium font-sans">
              {subtext}
            </span>
          )}
        </div>
      )}
    </Wrapper>
  )
}
