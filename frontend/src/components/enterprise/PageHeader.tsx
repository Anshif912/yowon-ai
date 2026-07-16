import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { motion } from 'framer-motion'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  status?: {
    label: string
    type: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  }
}

const statusStyles = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  info: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  neutral: 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400',
}

const dotStyles = {
  success: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
  warning: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
  error: 'bg-red-400 shadow-[0_0_8px_#f87171]',
  info: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
  neutral: 'bg-zinc-400 shadow-[0_0_8px_#a1a1aa]',
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  status,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative w-full border-b border-white/5 bg-[#05070a]/75 backdrop-blur-md px-6 py-5 sm:px-8 sm:py-6 flex flex-col gap-4 select-none shrink-0"
    >
      {/* Decorative neon top bar */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/0" />

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-zinc-400/80 font-mono tracking-wide">
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-white transition-colors duration-150"
          >
            <Home size={12} className="shrink-0" />
            <span className="sr-only">Home</span>
          </Link>
          
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight size={12} className="text-zinc-600 shrink-0" />
              {item.href ? (
                <Link
                  to={item.href}
                  className="hover:text-white transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-zinc-500 font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5 max-w-3xl">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              {title}
            </h1>
            
            {status && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold font-mono tracking-wider uppercase ${statusStyles[status.type]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status.type]} animate-pulse`} />
                {status.label}
              </span>
            )}
          </div>

          {description && (
            <p className="text-sm text-zinc-400 font-sans leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Actions container */}
        {actions && (
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}
