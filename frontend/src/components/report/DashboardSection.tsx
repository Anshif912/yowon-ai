import React, { ElementType, ReactNode } from 'react'
import PremiumWorkspaceCard, { AccentTheme } from './PremiumWorkspaceCard'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const I = Icon as any

  const themeMap: Record<string, AccentTheme> = {
    cyan: 'timeline',
    violet: 'architecture',
    emerald: 'business',
    amber: 'recommendation',
    red: 'security',
  }
  const theme = themeMap[accent] || 'neutral'

  return (
    <section id={id} className="scroll-mt-24 w-full">
      <PremiumWorkspaceCard accent={theme}>
        {/* Workspace Title & Icon */}
        <div className="flex items-center gap-3.5 border-b border-white/[0.04] pb-4 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02]">
            <I size={17} className="text-zinc-300" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.28em] text-zinc-500 font-bold">Report Section</p>
            <h2 className="font-display text-xl font-bold text-white leading-tight">{title}</h2>
          </div>
        </div>
        
        {/* Workspace Body */}
        <div className="w-full">
          {children}
        </div>
      </PremiumWorkspaceCard>
    </section>
  )
}

