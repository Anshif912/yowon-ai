import { useState } from 'react'
import { FolderGit2, Search, Layers, Bot, Plus, RefreshCw, Building2 } from 'lucide-react'

interface MissionHeaderProps {
  onSearchChange: (val: string) => void
  searchVal: string
  onCompareClick: () => void
  onEvaluateClick: () => void
  onAskCopilotClick: () => void
  onSyncClick: () => void
  orgs: string[]
  selectedOrg: string
  onOrgChange: (org: string) => void
}

export default function MissionHeader({
  onSearchChange,
  searchVal,
  onCompareClick,
  onEvaluateClick,
  onAskCopilotClick,
  onSyncClick,
  orgs,
  selectedOrg,
  onOrgChange,
}: MissionHeaderProps) {
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)

  return (
    <header className="flex flex-col gap-4 bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Workspace Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="flex items-center gap-2 bg-[#12131a] hover:bg-[#161822] border border-white/[0.08] hover:border-white/20 transition-all rounded-xl px-4 h-10 text-white text-xs select-none"
          >
            <Building2 size={13} className="text-cyan-400" />
            <span className="font-bold">
              {selectedOrg === 'all' ? 'All Workspaces' : selectedOrg}
            </span>
            <span className="text-[10px] text-zinc-500">▼</span>
          </button>
          
          {showWorkspaceMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowWorkspaceMenu(false)} />
              <div className="absolute left-0 mt-2 w-56 bg-[#0c0d12] border border-white/[0.08] rounded-xl shadow-2xl z-20 py-1.5 overflow-hidden">
                <button
                  onClick={() => {
                    onOrgChange('all')
                    setShowWorkspaceMenu(false)
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-white/[0.03] text-xs transition-colors flex items-center gap-2 ${
                    selectedOrg === 'all' ? 'text-cyan-400 font-bold bg-white/[0.01]' : 'text-zinc-400'
                  }`}
                >
                  <FolderGit2 size={12} />
                  <span>All Workspaces</span>
                </button>
                {orgs.map((org) => (
                  <button
                    key={org}
                    onClick={() => {
                      onOrgChange(org)
                      setShowWorkspaceMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-white/[0.03] text-xs transition-colors flex items-center gap-2 ${
                      selectedOrg === org ? 'text-cyan-400 font-bold bg-white/[0.01]' : 'text-zinc-400'
                    }`}
                  >
                    <FolderGit2 size={12} />
                    <span>{org}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 bg-[#12131a] border border-white/[0.08] focus-within:border-cyan-400/40 focus-within:bg-[#141620] transition-all rounded-xl px-3.5 h-10 max-w-md w-full">
          <Search size={14} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder="Fuzzy search repositories, files, frameworks, findings..."
            value={searchVal}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-white w-full text-xs placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/[0.03]">
        <button
          onClick={onEvaluateClick}
          className="h-10 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 text-[10px] font-bold text-center flex items-center justify-center gap-2 transition-all cursor-pointer text-white"
        >
          <Plus size={13} className="text-cyan-400" /> Connect Repository
        </button>
        <button
          onClick={onCompareClick}
          className="h-10 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 text-[10px] font-bold text-center flex items-center justify-center gap-2 transition-all cursor-pointer text-white"
        >
          <Layers size={13} className="text-cyan-400" /> Compare Codebases
        </button>
        <button
          onClick={onAskCopilotClick}
          className="h-10 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 text-[10px] font-bold text-center flex items-center justify-center gap-2 transition-all cursor-pointer text-white"
        >
          <Bot size={13} className="text-cyan-400" /> Ask AI Copilot
        </button>
        <button
          onClick={onSyncClick}
          className="h-10 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 text-[10px] font-bold text-center flex items-center justify-center gap-2 transition-all cursor-pointer text-white"
        >
          <RefreshCw size={13} className="text-cyan-400" /> Sync Organization
        </button>
      </div>
    </header>
  )
}
