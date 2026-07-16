import React, { useState, useMemo } from 'react'
import {
  Search,
  BookOpen,
  Sliders,
  Filter,
  CheckCircle,
  Database,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  FileCode,
  Tag,
  Code
} from 'lucide-react'
import {
  PageHeader,
  SearchToolbar,
  FilterDrawer,
  StatusBadge,
  EmptyState,
  LoadingSkeleton
} from '../../components/enterprise'

interface SearchResult {
  id: string
  fileName: string
  filePath: string
  score: number // Cosine Similarity: 0.0 to 1.0
  snippet: string
  project: string
  tags: string[]
}

const MOCK_RESULTS: SearchResult[] = [
  {
    id: 'res-1',
    fileName: 'VerdictBadge.tsx',
    filePath: 'frontend/src/components/VerdictBadge.tsx',
    score: 0.94,
    snippet: `export default function VerdictBadge({ verdict, large = false, animated = false }: VerdictBadgeProps) {\n  const config = VERDICT_CONFIG[verdict as keyof typeof VERDICT_CONFIG] || VERDICT_CONFIG.IMPROVE\n  const Icon = config.icon\n  const Wrapper = animated ? motion.div : 'div'`,
    project: 'yowon-ai-ui',
    tags: ['React', 'TypeScript', 'UI Badge']
  },
  {
    id: 'res-2',
    fileName: 'TaskQueue.ts',
    filePath: 'backend/src/workers/TaskQueue.ts',
    score: 0.88,
    snippet: `export class TaskQueue {\n  private queue: Task[] = []\n  async enqueue(task: Task): Promise<void> {\n    this.queue.push(task)\n    await this.processQueue()\n  }`,
    project: 'yowon-ai-engine',
    tags: ['NodeJS', 'Workers', 'Queues']
  },
  {
    id: 'res-3',
    fileName: 'AuthContext.tsx',
    filePath: 'frontend/src/components/auth/AuthContext.tsx',
    score: 0.81,
    snippet: `export const AuthProvider = ({ children }: { children: React.ReactNode }) => {\n  const [session, setSession] = useState<Session | null>(null)\n  const [loading, setLoading] = useState(true)`,
    project: 'yowon-ai-ui',
    tags: ['React', 'Security', 'SSO']
  }
]

import { api } from '../../api/api'
import { useWorkspace } from '../../components/auth/WorkspaceContext'

export default function KnowledgeSearchPage() {
  const { currentWorkspace } = useWorkspace()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  
  // Filters Drawer States
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [cosineSimilarity, setCosineSimilarity] = useState(80) // 80% similarity threshold
  const [selectedProject, setSelectedProject] = useState<'all' | 'ui' | 'engine'>('all')
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // Trigger Semantic Search
  const handleTriggerSearch = async (queryStr: string) => {
    setSearchQuery(queryStr)
    if (!queryStr.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    setLoading(true)
    try {
      const res = await api.get('/enterprise-ai/knowledge/search', {
        params: {
          query: queryStr,
          workspace_id: currentWorkspace?.workspace_id || 'default-ws',
          similarity_threshold: cosineSimilarity
        }
      })
      setResults(res.data)
      setHasSearched(true)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Filter apply handles
  const handleApplyFilters = () => {
    setFiltersOpen(false)
    let count = 0
    if (cosineSimilarity !== 80) count++
    if (selectedProject !== 'all') count++
    setActiveFiltersCount(count)
    
    // Rerun search with new criteria if query is set
    if (searchQuery) {
      handleTriggerSearch(searchQuery)
    }
  }

  const handleClearFilters = () => {
    setCosineSimilarity(80)
    setSelectedProject('all')
    setActiveFiltersCount(0)
    if (searchQuery) {
      handleTriggerSearch(searchQuery)
    }
  }

  return (
    <div className="flex-grow overflow-y-auto bg-[#05070a] min-h-full pb-12 select-none custom-scrollbar">
      
      {/* Page Header */}
      <PageHeader
        title="Knowledge Semantic Search"
        description="Search database files, code vectors contexts, security parameters, and historical jury rulings using semantic Cosine Similarity matches."
        breadcrumbs={[
          { label: 'Intelligence', href: '/intelligence' },
          { label: 'Semantic Search' }
        ]}
        status={{ label: 'SEARCH VECTORS ACTIVE', type: 'info' }}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        
        {/* Search Toolbar */}
        <SearchToolbar
          searchQuery={searchQuery}
          onSearchQueryChange={handleTriggerSearch}
          placeholder="Type semantic context queries (e.g. 'PR verdict authorization check rules')..."
          onToggleFilters={() => setFiltersOpen(true)}
          isFilterOpen={filtersOpen}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Content Viewport */}
        {loading ? (
          <LoadingSkeleton variant="list" rows={4} />
        ) : results.length > 0 ? (
          <div className="flex flex-col gap-6 text-left">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
              SEMANTIC SEARCH MATCHES ({results.length})
            </span>

            <div className="flex flex-col gap-4">
              {results.map((res) => (
                <div
                  key={res.id}
                  className="group relative flex flex-col border border-white/5 bg-[#0b0c10]/80 rounded-xl p-6 hover:border-cyan-500/20 transition-all duration-200"
                >
                  {/* Matching score status tag */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 select-none">
                    <div className="flex items-center gap-2">
                      <FileCode size={15} className="text-zinc-500 group-hover:text-cyan-400 transition-colors duration-150" />
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-white text-sm">{res.fileName}</span>
                        <span className="font-mono text-zinc-500 text-[10px] truncate max-w-lg block">{res.filePath}</span>
                      </div>
                    </div>

                    <StatusBadge
                      status="success"
                      customLabel={`${Math.round(res.score * 100)}% Match`}
                      size="xs"
                    />
                  </div>

                  {/* Highlights Code pre snippet */}
                  <pre className="p-3.5 bg-zinc-950/80 border border-white/5 font-mono text-[10px] text-cyan-400 rounded-lg overflow-x-auto leading-relaxed max-w-full mb-4">
                    {res.snippet}
                  </pre>

                  {/* Footer Tags */}
                  <div className="flex items-center justify-between flex-wrap gap-2 select-none">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 border border-white/5 px-2 py-0.5 rounded">
                        PROJECT: {res.project.toUpperCase()}
                      </span>
                      {res.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-transparent px-2 py-0.5 rounded"
                        >
                          <Tag size={9} className="text-zinc-500" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <a
                      href={`https://github.com/yowon-ai/project-sentinel/blob/main/${res.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors duration-150"
                    >
                      VIEW SOURCE FILE
                      <ExternalLink size={10} />
                    </a>
                  </div>

                </div>
              ))}
            </div>
          </div>
        ) : hasSearched ? (
          <EmptyState
            title="NO MATCHES COMPLIED"
            description="Adjust similarity margin levels or type alternate keywords queries to locate vector matches."
            action={
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-xs font-mono font-bold bg-zinc-900 border border-white/10 text-white rounded-lg hover:bg-zinc-800 transition-all duration-150"
              >
                RESET SIMILARITY THRESHOLDS
              </button>
            }
          />
        ) : (
          <EmptyState
            title="SEMANTIC ENGINE IDLE"
            description="Type keywords or natural language context queries to locate codebase citations and security guidelines."
            icon={BookOpen}
          />
        )}

      </div>

      {/* Advanced Filter Drawer */}
      <FilterDrawer
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
        activeFiltersCount={activeFiltersCount}
      >
        <div className="flex flex-col gap-6 text-left select-none">
          
          {/* Cosine Similarity Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">COSINE SIMILARITY</span>
              <span className="text-cyan-400 font-bold">{cosineSimilarity}% Match</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={cosineSimilarity}
              onChange={(e) => setCosineSimilarity(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[10px] text-zinc-500 leading-normal">
              Filters cosine similarity indexes thresholds. Higher values restrict results list to exact syntax matches.
            </span>
          </div>

          {/* Project scopes selector */}
          <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
            <span className="text-zinc-400 font-bold font-mono uppercase tracking-wider text-[10px]">PROJECT SCOPE</span>
            <div className="flex flex-col gap-2 text-xs">
              {(['all', 'ui', 'engine'] as const).map((proj) => (
                <label key={proj} className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer">
                  <input
                    type="radio"
                    name="projectScope"
                    checked={selectedProject === proj}
                    onChange={() => setSelectedProject(proj)}
                    className="h-3.5 w-3.5 text-cyan-600 bg-zinc-950 border-zinc-700 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="capitalize font-mono">{proj === 'all' ? 'All repositories' : proj === 'ui' ? 'yowon-ai-ui' : 'yowon-ai-engine'}</span>
                </label>
              ))}
            </div>
          </div>

        </div>
      </FilterDrawer>
    </div>
  )
}
