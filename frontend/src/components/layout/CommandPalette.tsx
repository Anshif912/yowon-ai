import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  FolderGit2,
  Play,
  Bot,
  BookOpen,
  TrendingUp,
  Shield,
  Layers,
  ArrowRight,
  Terminal
} from 'lucide-react'
import { api } from '../../api/api'

interface CommandPaletteProps {
  onClose?: () => void
}

interface CommandItem {
  id: string
  label: string
  subtitle: string
  icon: React.ElementType
  action: () => void
  color?: string
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [repos, setRepos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [judgeMode, setJudgeMode] = useState(() => {
    return localStorage.getItem('yowon_judge_mode') !== 'false'
  })

  // Listen to judge mode changes from other components
  useEffect(() => {
    const handleJudgeModeChanged = () => {
      setJudgeMode(localStorage.getItem('yowon_judge_mode') !== 'false')
    }
    window.addEventListener('yowon_judge_mode_changed', handleJudgeModeChanged)
    return () => {
      window.removeEventListener('yowon_judge_mode_changed', handleJudgeModeChanged)
    }
  }, [])

  // Listen for Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      fetchRepos()
    } else {
      setQuery('')
    }
  }, [isOpen])

  // Fetch repositories for search context
  const fetchRepos = async () => {
    try {
      setLoading(true)
      const res = await api.get('/git/repositories')
      if (Array.isArray(res.data)) {
        setRepos(res.data)
      }
    } catch (err) {
      console.error('Failed to load repositories in command palette:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const toggleJudgeModeAction = () => {
    const newVal = !judgeMode
    localStorage.setItem('yowon_judge_mode', String(newVal))
    window.dispatchEvent(new Event('yowon_judge_mode_changed'))
    setJudgeMode(newVal)
    setIsOpen(false)
  }

  // Define static commands
  const commands: CommandItem[] = [
    {
      id: 'goto-home',
      label: 'Navigate to AI Command Center',
      subtitle: 'Open the main system dashboard overview',
      icon: TrendingUp,
      action: () => { navigate('/dashboard'); setIsOpen(false); },
      color: 'text-cyan-400'
    },
    {
      id: 'run-eval',
      label: 'Run New Codebase Evaluation',
      subtitle: 'Upload a ZIP archive or connect a repository for analysis',
      icon: Play,
      action: () => { navigate('/submit'); setIsOpen(false); },
      color: 'text-yellow-400'
    },
    {
      id: 'open-copilot',
      label: 'Open AI Copilot Chat Workspace',
      subtitle: 'Ask the intelligence engine details about active repositories',
      icon: Bot,
      action: () => { navigate('/intelligence'); setIsOpen(false); },
      color: 'text-violet-400'
    },
    {
      id: 'toggle-judge',
      label: `Toggle Judge/Demo Mode (${judgeMode ? 'Currently Active' : 'Inactive'})`,
      subtitle: 'Hide or reveal full enterprise connector configurations',
      icon: Shield,
      action: toggleJudgeModeAction,
      color: 'text-emerald-400'
    }
  ]

  // Filter items based on query
  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.subtitle.toLowerCase().includes(query.toLowerCase())
  )

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(query.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(query.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm px-4">
      <div
        ref={containerRef}
        className="w-full max-w-xl bg-zinc-950/95 border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[460px] animate-in fade-in zoom-in-95 duration-150"
        style={{
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 229, 255, 0.03)'
        }}
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.05] gap-3">
          <Search size={16} className="text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or repository name..."
            className="flex-1 bg-transparent border-0 outline-none text-white text-xs font-mono placeholder-zinc-600 focus:ring-0 p-0"
          />
          <span className="text-[9px] font-mono text-zinc-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded shrink-0">ESC</span>
        </div>

        {/* Results body */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2.5 custom-scrollbar min-h-[200px]">
          {/* Static Commands Group */}
          {filteredCommands.length > 0 && (
            <div className="space-y-1">
              <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-600 px-2.5 block mb-1">
                System Commands
              </span>
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/[0.04] transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.04] group-hover:border-white/[0.06] transition-all">
                      <cmd.icon size={14} className={cmd.color} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-semibold text-white tracking-wide">{cmd.label}</h4>
                      <p className="text-[9px] text-zinc-500 font-sans leading-relaxed mt-0.5">{cmd.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight size={10} className="text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}

          {/* Repositories Group */}
          {filteredRepos.length > 0 && (
            <div className="space-y-1">
              <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-600 px-2.5 block mb-1 mt-1.5">
                Repositories
              </span>
              {filteredRepos.map((repo) => (
                <button
                  key={repo.uuid}
                  onClick={() => {
                    navigate(`/repositories/${repo.uuid}`)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/[0.04] transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.04]">
                      <FolderGit2 size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-semibold text-white tracking-wide">{repo.full_name}</h4>
                      <p className="text-[9px] text-zinc-500 font-sans leading-relaxed mt-0.5 truncate max-w-sm">
                        Health: {repo.statistics?.health_score || 80}% • {repo.html_url}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={10} className="text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {filteredCommands.length === 0 && filteredRepos.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <Terminal size={24} className="text-zinc-700 mx-auto" />
              <p className="text-xs text-zinc-500 font-mono">No matching commands or codebases found.</p>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 bg-black/40 border-t border-white/[0.04] flex items-center justify-between text-[8.5px] font-mono text-zinc-600">
          <span>Use <span className="text-zinc-500">↑↓</span> to navigate</span>
          <span>Press <span className="text-zinc-500">Enter</span> to select</span>
        </div>
      </div>
    </div>
  )
}
export default CommandPalette
