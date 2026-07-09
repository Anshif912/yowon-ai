/**
 * AppShell — Page layout wrapper.
 *
 * The global background (Strands + aurora + noise) is handled by
 * GlobalBackground in App.tsx. AppShell only provides the structural
 * wrapper and optional header. Children are placed at z-index: 10
 * to sit above the background layers.
 */
import type { ReactNode } from 'react'
import Header from './Header'

interface AppShellProps {
  children:   ReactNode
  showHeader?: boolean
  /** @deprecated — particles are now global; this prop is kept for API compat */
  particles?: boolean
}

export default function AppShell({
  children,
  showHeader = true,
}: AppShellProps) {
  return (
    <div className="min-h-screen relative">
      {showHeader && <Header />}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
