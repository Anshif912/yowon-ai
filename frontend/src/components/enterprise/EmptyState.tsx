import React from 'react'
import { motion } from 'framer-motion'
import { Inbox, LucideIcon } from 'lucide-react'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  illustration?: React.ReactNode
  variant?: 'panel' | 'simple'
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  illustration,
  variant = 'panel',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative w-full flex flex-col items-center justify-center text-center p-8 select-none ${
        variant === 'panel'
          ? 'border border-white/5 bg-[#0b0c10]/40 backdrop-blur-md rounded-xl py-16'
          : 'py-10'
      }`}
    >
      {/* Decorative cyber lines and ambient glows */}
      {variant === 'panel' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.03),transparent_60%)] pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        </>
      )}

      {/* Main Illustration or Icon */}
      <div className="relative mb-5 flex items-center justify-center">
        {illustration ? (
          <div className="relative z-10">{illustration}</div>
        ) : (
          <div className="relative z-10 flex items-center justify-center h-16 w-16 rounded-full border border-zinc-800 bg-[#05070a]/90 text-zinc-500 shadow-inner">
            <Icon size={28} className="stroke-[1.2]" />
          </div>
        )}
        
        {/* Glow behind the icon */}
        <div className="absolute -inset-1 rounded-full bg-cyan-500/5 blur-lg pointer-events-none" />
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest font-mono mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs text-zinc-500 max-w-sm font-medium font-sans leading-relaxed mb-6">
          {description}
        </p>
      )}

      {/* Action CTA */}
      {action && (
        <div className="relative z-10 flex items-center justify-center shrink-0">
          {action}
        </div>
      )}
    </motion.div>
  )
}
