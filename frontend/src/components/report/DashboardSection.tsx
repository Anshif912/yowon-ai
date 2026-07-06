import React, { ElementType, ReactNode } from 'react'

interface DashboardSectionProps {
  id: string
  title: string
  icon: ElementType
  children: ReactNode
  accent?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'red'
}

export function DashboardSection({
  id,
  title,
  icon: Icon,
  children,
  accent = 'cyan',
}: DashboardSectionProps) {
  const accentClass = {
    cyan: 'text-cyan-300 border-cyan-300/20',
    violet: 'text-violet-300 border-violet-400/20',
    emerald: 'text-emerald-300 border-emerald-300/20',
    accent: 'text-cyan-300 border-cyan-300/20', // fallback
    amber: 'text-amber-300 border-amber-300/20',
    red: 'text-red-300 border-red-300/20',
  }[accent] || 'text-cyan-300 border-cyan-300/20'

  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div className={`flex items-center gap-3 border-l-2 pl-3 ${accentClass}`}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035]">
          <Icon size={17} />
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-yowon-muted">Report Section</p>
          <h2 className="font-display text-xl font-bold text-yowon-text">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}
