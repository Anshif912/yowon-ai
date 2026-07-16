import React from 'react'

export interface SplitViewProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  
  // Custom widths or styles
  leftWidth?: string // e.g. "w-full md:w-1/3 lg:w-96"
  rightWidth?: string // e.g. "flex-1"
  gap?: string // e.g. "gap-6"
  className?: string
  
  // Options
  stickyRight?: boolean
  divider?: boolean
}

export default function SplitView({
  leftPanel,
  rightPanel,
  leftWidth = 'w-full lg:w-96',
  rightWidth = 'flex-1 min-w-0',
  gap = 'gap-6',
  className = '',
  stickyRight = true,
  divider = true,
}: SplitViewProps) {
  return (
    <div className={`flex flex-col lg:flex-row w-full h-full min-h-0 ${gap} ${className}`}>
      
      {/* Left panel container (e.g. list, controls) */}
      <div className={`shrink-0 flex flex-col min-w-0 ${leftWidth}`}>
        {leftPanel}
      </div>

      {/* Vertical divider line */}
      {divider && (
        <div className="hidden lg:block w-px bg-white/5 self-stretch shrink-0 pointer-events-none" />
      )}

      {/* Right panel container (e.g. details, visualization) */}
      <div
        className={`flex flex-col min-w-0 ${rightWidth} ${
          stickyRight ? 'lg:sticky lg:top-0 lg:max-h-full lg:overflow-y-auto' : ''
        }`}
      >
        {rightPanel}
      </div>
    </div>
  )
}
