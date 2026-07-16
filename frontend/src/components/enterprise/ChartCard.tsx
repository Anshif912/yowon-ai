import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Loader2 } from 'lucide-react'

export interface ChartCardProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  loading?: boolean
  error?: string | null
  isEmpty?: boolean
  emptyMessage?: string
  children: React.ReactNode
  height?: number | string
}

export default function ChartCard({
  title,
  subtitle,
  actions,
  loading = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'No analytical data available for this selection',
  children,
  height = 320,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative flex flex-col rounded-xl border border-white/5 bg-[#0b0c10]/80 backdrop-blur-md overflow-hidden w-full select-none"
      style={{
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.03)',
      }}
    >
      {/* Premium subtle glow accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      {/* Decorative cyber corner ticks */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 rounded-tl" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 rounded-tr" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10 rounded-bl" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 rounded-br" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-white/5">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-bold tracking-wider text-zinc-300 font-mono uppercase">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-zinc-500 font-sans font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Card Body / Chart Area */}
      <div
        className="relative w-full p-6 flex flex-col items-center justify-center"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        {loading ? (
          <div className="absolute inset-0 bg-[#0b0c10]/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-cyan-400" size={32} />
            <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400 animate-pulse">
              FETCHING LIVE METRICS...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center px-4 max-w-md">
            <div className="p-3 rounded-full bg-rose-500/10 text-rose-400">
              <AlertCircle size={24} />
            </div>
            <p className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
              DATASTREAM DISRUPTED
            </p>
            <p className="text-xs text-zinc-400 font-medium">
              {error}
            </p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center px-4 max-w-md">
            <div className="p-3 rounded-full bg-zinc-800/20 text-zinc-500">
              <AlertCircle size={24} className="stroke-[1.5]" />
            </div>
            <p className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider">
              NO METRICS FOUND
            </p>
            <p className="text-xs text-zinc-500 font-medium">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  )
}
