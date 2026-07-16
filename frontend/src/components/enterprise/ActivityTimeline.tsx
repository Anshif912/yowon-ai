import React from 'react'
import { LucideIcon, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export interface ActivityItem {
  id: string | number
  title: string
  description?: React.ReactNode
  timestamp: string
  type?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  icon?: LucideIcon
  tags?: string[]
  action?: React.ReactNode
}

export interface ActivityTimelineProps {
  items: ActivityItem[]
  loading?: boolean
}

const statusConfig = {
  success: {
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]',
  },
  warning: {
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]',
  },
  error: {
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
  },
  info: {
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    glow: 'shadow-[0_0_10px_rgba(34,211,238,0.3)]',
  },
  neutral: {
    color: 'text-zinc-400',
    border: 'border-zinc-500/30',
    bg: 'bg-zinc-800/40',
    glow: 'shadow-none',
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
}

export default function ActivityTimeline({ items, loading = false }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 relative">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-white/5" />
              <div className="flex-1 w-px bg-white/5 my-2" />
            </div>
            <div className="flex-1 flex flex-col gap-2 pt-1 pb-4">
              <div className="h-4 w-1/4 rounded bg-white/5" />
              <div className="h-3 w-3/4 rounded bg-white/5" />
              <div className="h-3 w-1/2 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 font-sans">
        <Clock size={32} className="text-zinc-600 mb-2 stroke-[1.5]" />
        <p className="text-xs font-mono tracking-wider uppercase font-bold text-zinc-400 mb-1">
          TIMELINE EMPTY
        </p>
        <p className="text-xs">No historical events recorded.</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative flex flex-col w-full px-2 py-4"
    >
      {/* Central continuous thread line */}
      <div className="absolute top-6 bottom-6 left-7 w-[2px] bg-gradient-to-b from-cyan-500/20 via-zinc-800 to-zinc-800/10 pointer-events-none" />

      {items.map((item, index) => {
        const status = item.type || 'neutral'
        const config = statusConfig[status]
        const CustomIcon = item.icon

        return (
          <motion.div
            key={item.id}
            variants={itemVariants}
            className="group relative flex gap-6 pb-8 last:pb-2 text-left"
          >
            {/* Timeline dot / Icon container */}
            <div className="relative z-10 flex items-center justify-center shrink-0">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border bg-[#05070a] transition-all duration-300 group-hover:scale-105 ${config.border} ${config.color} ${config.glow}`}
              >
                {CustomIcon ? (
                  <CustomIcon size={16} className="shrink-0" />
                ) : (
                  <div className={`h-2.5 w-2.5 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                )}
              </div>
            </div>

            {/* Event Content Panel */}
            <div className="flex-1 flex flex-col pt-1">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1.5">
                {/* Event Title */}
                <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors duration-200">
                  {item.title}
                </h4>

                {/* Event Timestamp */}
                <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 shrink-0">
                  {item.timestamp}
                </span>
              </div>

              {/* Event Description */}
              {item.description && (
                <div className="text-xs text-zinc-400 leading-relaxed font-sans mb-2">
                  {item.description}
                </div>
              )}

              {/* Tags / Actions footer */}
              {((item.tags && item.tags.length > 0) || item.action) && (
                <div className="flex items-center gap-3 flex-wrap mt-1">
                  {item.tags && item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center text-[10px] font-mono font-semibold tracking-wide text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}

                  {item.action && (
                    <div className="ml-auto flex items-center shrink-0">
                      {item.action}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
