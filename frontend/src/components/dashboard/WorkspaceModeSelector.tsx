import type { WorkspaceMode } from '../../hooks/useDashboardState'
import { Cpu, Shield, BarChart2, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface WorkspaceModeSelectorProps {
  mode: WorkspaceMode
  onChange: (mode: WorkspaceMode) => void
}

const MODES: { key: WorkspaceMode; label: string; icon: typeof Cpu; desc: string }[] = [
  { key: 'engineering', label: 'Engineering', icon: Cpu,      desc: 'Repos, Architecture, Pipelines' },
  { key: 'security',    label: 'Security',    icon: Shield,   desc: 'Alerts, Vulnerabilities, Risk' },
  { key: 'executive',   label: 'Executive',   icon: BarChart2, desc: 'Briefing, Trends, Readiness' },
]

export default function WorkspaceModeSelector({ mode, onChange }: WorkspaceModeSelectorProps) {
  const [open, setOpen] = useState(false)
  const current = MODES.find((m) => m.key === mode) ?? MODES[0]
  const Icon = current.icon

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-120 text-white select-none"
      >
        <Icon size={11} className="text-cyan-400 shrink-0" />
        <span className="text-[10px] font-bold font-mono">{current.label}</span>
        <ChevronDown size={9} className="text-zinc-500 ml-0.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-52 bg-[#0c0e16] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden py-1">
            {MODES.map((m) => {
              const MIcon = m.icon
              const active = m.key === mode
              return (
                <button
                  key={m.key}
                  onClick={() => { onChange(m.key); setOpen(false) }}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 hover:bg-white/[0.03] transition-colors text-left ${
                    active ? 'bg-cyan-400/[0.04]' : ''
                  }`}
                >
                  <MIcon size={12} className={active ? 'text-cyan-400 mt-0.5' : 'text-zinc-500 mt-0.5'} />
                  <div>
                    <p className={`text-[10.5px] font-bold ${active ? 'text-white' : 'text-zinc-400'}`}>{m.label}</p>
                    <p className="text-[9px] text-zinc-600 mt-0.5">{m.desc}</p>
                  </div>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
