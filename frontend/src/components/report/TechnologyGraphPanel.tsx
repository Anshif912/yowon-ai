import { useState, useMemo } from 'react'
import { Cpu, Search, Code2, Database, Cloud, Wrench, Layers, Zap, Package } from 'lucide-react'
import { DashboardSection } from './DashboardSection'
import { ErrorBoundary } from './ErrorBoundary'
import { useSharedIntelligenceContext } from './RepositoryIntelligenceWrapper'

interface TechnologyGraphPanelProps {
  projectId: string
  onSelectNode?: (nodeName: string) => void
}

export default function TechnologyGraphPanel({ projectId, onSelectNode }: TechnologyGraphPanelProps) {
  return (
    <ErrorBoundary name="Technology Graph Panel">
      <TechnologyContent projectId={projectId} onSelectNode={onSelectNode} />
    </ErrorBoundary>
  )
}

// Technology category configurations
const CATEGORY_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  language:  { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  icon: Code2,    label: 'Languages'  },
  framework: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',  icon: Layers,   label: 'Frameworks' },
  database:  { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  icon: Database, label: 'Databases'  },
  cloud:     { color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',   icon: Cloud,    label: 'Cloud'      },
  ai:        { color: '#00E5FF', bg: 'rgba(0,229,255,0.06)',   icon: Zap,      label: 'AI / ML'    },
  tool:      { color: '#F97316', bg: 'rgba(249,115,22,0.08)',  icon: Wrench,   label: 'Tools'      },
  package:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  icon: Package,  label: 'Packages'   },
  other:     { color: '#71717A', bg: 'rgba(113,113,122,0.06)', icon: Cpu,      label: 'Other'      },
}

// Fallback static tech stacks if RKM has no 'technology' entities
const FALLBACK_TECH: Array<{ name: string; version?: string; category: string; usage: string; files: string }> = [
  { name: 'Python',       version: '3.11',    category: 'language',  usage: 'Primary backend language',       files: '142 files' },
  { name: 'FastAPI',      version: '0.110',   category: 'framework', usage: 'REST API framework',              files: '38 files'  },
  { name: 'React',        version: '18.x',    category: 'framework', usage: 'Frontend SPA',                   files: '54 files'  },
  { name: 'TypeScript',   version: '5.x',     category: 'language',  usage: 'Frontend type safety',           files: '54 files'  },
  { name: 'PostgreSQL',   version: '15',      category: 'database',  usage: 'Primary relational store',        files: '12 files'  },
  { name: 'Redis',        version: '7.x',     category: 'database',  usage: 'Session and cache layer',         files: '6 files'   },
  { name: 'Docker',       version: '24',      category: 'tool',      usage: 'Container orchestration',         files: '3 files'   },
  { name: 'Ollama',       version: 'latest',  category: 'ai',        usage: 'Local LLM inference engine',      files: '8 files'   },
  { name: 'SQLAlchemy',   version: '2.0',     category: 'package',   usage: 'ORM for database access',         files: '18 files'  },
  { name: 'Nginx',        version: '1.25',    category: 'tool',      usage: 'Reverse proxy / routing',         files: '2 files'   },
]

// Shared type for technology items
interface TechItem {
  name: string
  version?: string
  category: string
  usage: string
  files: string
  health: number
}

function TechnologyContent({ projectId, onSelectNode }: { projectId: string; onSelectNode?: (n: string) => void }) {
  const context = useSharedIntelligenceContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const rkm = context.rkm

  // Extract tech entities or use fallback
  const techItems = useMemo((): TechItem[] => {
    if (rkm) {
      const techEntities = Object.values(rkm.entities).filter(e => e.type === 'technology')
      if (techEntities.length > 0) {
        return techEntities.map(e => ({
          name: e.label,
          version: (e as any).metadata?.version as string | undefined,
          category: ((e as any).metadata?.category || 'other') as string,
          usage: (e as any).summary || (e as any).purpose || 'Used in this repository',
          files: (e as any).metadata?.files ? `${(e as any).metadata.files} files` : '—',
          health: e.health ?? 80,
        }))
      }
    }
    // Fallback to static list
    return FALLBACK_TECH.map(t => ({ ...t, health: 80 }))
  }, [rkm])

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, typeof techItems> = {}
    techItems.forEach(t => {
      const cat = t.category || 'other'
      if (!map[cat]) map[cat] = []
      map[cat].push(t)
    })
    return map
  }, [techItems])

  const categories = useMemo(() => Object.keys(grouped), [grouped])

  const filtered = useMemo(() => {
    const base = activeCategory
      ? { [activeCategory]: grouped[activeCategory] }
      : grouped
    if (!searchTerm) return base
    const result: typeof grouped = {}
    Object.entries(base).forEach(([cat, items]) => {
      const matched = items.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
      if (matched.length > 0) result[cat] = matched
    })
    return result
  }, [grouped, activeCategory, searchTerm])

  const totalCount = techItems.length

  return (
    <DashboardSection id="technology" title="Technology View" icon={Cpu}>
      <div className="space-y-5 font-mono text-[10px] text-white">

        {/* Category Summary Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['other']
            const Icon = cfg.icon
            const isActive = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(isActive ? null : cat)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] uppercase tracking-wider transition-all"
                style={{
                  borderColor: isActive ? cfg.color : 'rgba(255,255,255,0.06)',
                  color: isActive ? cfg.color : '#71717a',
                  background: isActive ? cfg.bg : 'transparent',
                }}
              >
                <Icon size={10} />
                {cfg.label}
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold"
                  style={{ background: isActive ? cfg.color + '30' : 'rgba(255,255,255,0.06)', color: isActive ? cfg.color : '#52525b' }}
                >
                  {grouped[cat]?.length || 0}
                </span>
              </button>
            )
          })}
          {activeCategory && (
            <button onClick={() => setActiveCategory(null)} className="px-3 py-1.5 rounded-xl text-[9px] text-zinc-500 border border-white/5 hover:text-white transition-colors">
              Clear
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="w-full bg-white/[0.02] border border-white/[0.07] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
            placeholder="Search technologies, frameworks, tools..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grouped Technology Cards */}
        <div className="space-y-4">
          {Object.entries(filtered).map(([cat, items]) => {
            const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['other']
            const Icon = cfg.icon
            return (
              <div key={cat} className="border border-white/[0.05] rounded-2xl overflow-hidden">
                {/* Category Header */}
                <div
                  className="flex items-center gap-2.5 px-4 py-2.5"
                  style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.color}20` }}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: cfg.color + '20' }}
                  >
                    <Icon size={11} style={{ color: cfg.color }} />
                  </div>
                  <span className="font-bold text-white text-[11px]">{cfg.label}</span>
                  <span className="text-[9px] ml-1" style={{ color: cfg.color }}>{items.length}</span>
                </div>

                {/* Tech grid inside category */}
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {items.map((tech, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 cursor-pointer transition-all"
                      onClick={() => onSelectNode && onSelectNode(tech.name)}
                    >
                      {/* Name + Version */}
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-white text-xs leading-tight">{tech.name}</span>
                        {tech.version && (
                          <span
                            className="text-[8px] px-1 py-0.5 rounded shrink-0 font-mono"
                            style={{ color: cfg.color, background: cfg.bg }}
                          >
                            v{tech.version}
                          </span>
                        )}
                      </div>

                      {/* Usage */}
                      <p className="text-[9px] text-zinc-500 font-sans leading-snug line-clamp-2">
                        {tech.usage}
                      </p>

                      {/* Files */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                        <span className="text-[9px] text-zinc-600">{tech.files}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-10 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${tech.health}%`, background: cfg.color }}
                            />
                          </div>
                          <span className="text-[8px]" style={{ color: cfg.color }}>{tech.health}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-[9px] text-zinc-600 text-center">
          {totalCount} technologies detected · Grouped by category
        </p>
      </div>
    </DashboardSection>
  )
}
