import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Folder,
  Terminal,
  Cpu,
  Brain,
  Layers,
  Sparkles,
  Settings,
  HelpCircle,
  FileText
} from 'lucide-react'
import { api } from '../../api/api'

interface CommandItem {
  icon: any
  title: string
  subtitle: string
  action: () => void
  category: string
}

export default function CommandPalette() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CommandItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Listen for Ctrl+K / Cmd+K and custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    const handleCustomToggle = () => {
      setIsOpen(prev => !prev)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('toggle-command-palette', handleCustomToggle)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('toggle-command-palette', handleCustomToggle)
    }
  }, [isOpen])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Static core commands
  const coreCommands: CommandItem[] = [
    {
      icon: Folder,
      title: 'Go to Projects',
      subtitle: 'Browse all analyzed repositories',
      action: () => navigate('/projects'),
      category: 'Navigation'
    },
    {
      icon: Terminal,
      title: 'Analyze New Repository',
      subtitle: 'Upload or clone codebase for evaluation',
      action: () => navigate('/submit'),
      category: 'Navigation'
    },
    {
      icon: Settings,
      title: 'Operator Settings',
      subtitle: 'Edit clearance name, timezone, preferences, or password',
      action: () => navigate('/settings'),
      category: 'Navigation'
    },
    {
      icon: HelpCircle,
      title: 'Open AI Jury Chamber',
      subtitle: 'Meet the 7 autonomous AI agents',
      action: () => navigate('/jury'),
      category: 'Navigation'
    }
  ]

  // Dynamic query search
  useEffect(() => {
    if (!isOpen) return

    const activeProjectId = localStorage.getItem('yowon_active_project_id') || ''

    // Quick filter core commands
    const filteredCore = coreCommands.filter(c => 
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(query.toLowerCase())
    )

    // Append project-specific workspace actions if project exists
    const projectActions: CommandItem[] = []
    if (activeProjectId) {
      const paths = [
        { title: 'Open Software Intelligence', path: `/intelligence/${activeProjectId}`, icon: Brain, subtitle: 'View graphs, diagnostics, architecture metrics' },
        { title: 'Open AI Jury Verdict', path: `/report/${activeProjectId}/overview`, icon: FileText, subtitle: 'Overall verdict, Innovation, and agent findings' },
        { title: 'View Code Metrics', path: `/intelligence/${activeProjectId}#metrics`, icon: Layers, subtitle: 'LOC count, language distribution, hotspots' },
        { title: 'Open Diagnostics Workspace', path: `/intelligence/${activeProjectId}#diagnostics`, icon: Cpu, subtitle: 'Parsing logs, execution durations, LLM latency' }
      ]
      paths.forEach(p => {
        if (p.title.toLowerCase().includes(query.toLowerCase()) || p.subtitle.toLowerCase().includes(query.toLowerCase())) {
          projectActions.push({
            icon: p.icon,
            title: p.title,
            subtitle: p.subtitle,
            action: () => {
              navigate(p.path)
              // Scroll to hash if exists
              if (p.path.includes('#')) {
                const hash = p.path.split('#')[1]
                setTimeout(() => {
                  document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
                }, 200)
              }
            },
            category: 'Active Project Workspace'
          })
        }
      })
    }

    // Fetch projects dynamically matching query
    if (query.trim().length > 1) {
      api.get(`/projects?page=1&size=5&search=${encodeURIComponent(query)}`)
        .then(res => {
          if (res.data && res.data.items) {
            const projectResults = res.data.items.map((item: any) => ({
              icon: Folder,
              title: `Select Project: ${item.name}`,
              subtitle: `Switch current workspace context (${item.project_type || 'Unspecified'})`,
              action: () => {
                localStorage.setItem('yowon_active_project_id', item.id)
                navigate(`/intelligence/${item.id}`)
              },
              category: 'Projects'
            }))
            setResults([...projectActions, ...filteredCore, ...projectResults])
          } else {
            setResults([...projectActions, ...filteredCore])
          }
        })
        .catch(() => {
          setResults([...projectActions, ...filteredCore])
        })
    } else {
      setResults([...projectActions, ...filteredCore])
    }
  }, [query, isOpen])

  // Key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length))
      // Scroll into view
      setTimeout(() => {
        const selectedEl = listRef.current?.querySelector('[aria-selected="true"]')
        selectedEl?.scrollIntoView({ block: 'nearest' })
      }, 10)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length))
      setTimeout(() => {
        const selectedEl = listRef.current?.querySelector('[aria-selected="true"]')
        selectedEl?.scrollIntoView({ block: 'nearest' })
      }, 10)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        results[selectedIndex].action()
        setIsOpen(false)
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Palette Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-xl glass-card bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-0 overflow-hidden font-mono text-xs"
          >
            {/* Search Input bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
              <Search size={16} className="text-cyan-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search projects, diagnostics, metrics, or run shortcut commands..."
                className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs"
              />
              <span className="text-[10px] text-slate-500 border border-white/10 px-1.5 py-0.5 rounded uppercase">ESC</span>
            </div>

            {/* Results scroll pane */}
            <div
              ref={listRef}
              className="max-h-[360px] overflow-y-auto p-2 space-y-3 custom-scrollbar"
            >
              {results.length > 0 ? (
                // Group by category
                Object.entries(
                  results.reduce((acc, item) => {
                    acc[item.category] = acc[item.category] || []
                    acc[item.category].push(item)
                    return acc
                  }, {} as Record<string, CommandItem[]>)
                ).map(([category, items]) => (
                  <div key={category} className="space-y-1">
                    <div className="px-2.5 py-1 text-[9px] text-yowon-muted uppercase tracking-wider font-bold">
                      {category}
                    </div>
                    {items.map((item, idx) => {
                      const absoluteIndex = results.indexOf(item)
                      const isSelected = absoluteIndex === selectedIndex
                      const Icon = item.icon
                      
                      return (
                        <button
                          key={item.title}
                          onClick={() => {
                            item.action()
                            setIsOpen(false)
                          }}
                          aria-selected={isSelected}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-cyan-500/10 text-cyan-200 border border-cyan-500/15'
                              : 'border border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg border ${
                            isSelected ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-white/5 border-white/5 text-slate-400'
                          }`}>
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white truncate">{item.title}</p>
                            <p className="text-[10px] text-yowon-muted truncate">{item.subtitle}</p>
                          </div>
                          {isSelected && (
                            <span className="text-[9px] bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest shrink-0">
                              Execute
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-yowon-muted italic">
                  No matching workspace actions or projects found.
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-t border-white/5 text-[9px] text-slate-500">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>Enter Select</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles size={10} className="text-cyan-400" />
                <span>YOWON Command center</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
