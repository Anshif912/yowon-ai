import type { DashboardTab, LayoutDensity } from '../../hooks/useDashboardState'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface WorkspaceTabsProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  layoutDensity: LayoutDensity
  onLayoutChange: (density: LayoutDensity) => void
}

const TABS: { key: DashboardTab; label: string }[] = [
  { key: 'overview',     label: 'Overview'      },
  { key: 'repositories', label: 'Repositories'  },
  { key: 'operations',   label: 'Operations'    },
  { key: 'security',     label: 'Security'      },
  { key: 'portfolio',    label: 'Portfolio'     },
]

const DENSITIES: { key: LayoutDensity; label: string }[] = [
  { key: 'compact',     label: 'Compact'     },
  { key: 'comfortable', label: 'Comfortable' },
  { key: 'dense',       label: 'Dense'       },
]

export default function WorkspaceTabs({ activeTab, onTabChange, layoutDensity, onLayoutChange }: WorkspaceTabsProps) {
  const [densityOpen, setDensityOpen] = useState(false)

  return (
    <div className="flex items-center h-9 px-4 border-b border-white/[0.05]">
      {/* Tabs */}
      <nav className="flex items-center gap-0 h-full flex-1">
        {TABS.map((tab) => {
          const active = tab.key === activeTab
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`relative h-full px-3.5 text-[11px] font-medium transition-colors duration-100 ${
                active ? 'text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {tab.label}
              {active && (
                <span className="absolute bottom-0 left-3.5 right-3.5 h-[1.5px] bg-zinc-300 rounded-t-full" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Layout density */}
      <div className="relative">
        <button
          onClick={() => setDensityOpen((o) => !o)}
          className="flex items-center gap-1 h-6 px-2 rounded text-zinc-700 hover:text-zinc-500 transition-colors text-[10px]"
        >
          {DENSITIES.find((d) => d.key === layoutDensity)?.label}
          <ChevronDown size={9} />
        </button>

        {densityOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDensityOpen(false)} />
            <div className="absolute right-0 mt-1 w-32 bg-[#0d0f16] border border-white/[0.07] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
              {DENSITIES.map((d) => (
                <button
                  key={d.key}
                  onClick={() => { onLayoutChange(d.key); setDensityOpen(false) }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-white/[0.03] transition-colors ${
                    d.key === layoutDensity ? 'text-zinc-200 font-semibold' : 'text-zinc-500'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
