import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderGit2,
  Search,
  ArrowUpDown,
  ExternalLink,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Sparkles,
  Play,
  Brain,
  FileText,
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react'
import { api } from '../api/api'
import { scoreColor } from '../utils/reportParser'
import ScoreRing from '../components/ScoreRing'

interface ProjectItem {
  id: string
  name: string
  project_type: string
  github_url?: string
  status: string
  created_at: string
  overall_score?: number
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(6) // 6 items per page fits grid perfectly
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    setLoading(true)
    api.get(`/projects?page=${page}&size=${size}&search=${encodeURIComponent(search)}&sort_by=${sortBy}&sort_order=${sortOrder}`)
      .then(({ data }) => {
        setProjects(data.items || [])
        setTotal(data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, size, search, sortBy, sortOrder])

  const totalPages = Math.ceil(total / size)

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  // Filter projects by type locally (since backend API doesn't support direct status filter in standard pagination fields, local subsetting is fast and responsive)
  const filteredProjects = typeFilter === 'all'
    ? projects
    : projects.filter(p => p.project_type?.toLowerCase().includes(typeFilter.toLowerCase()))

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
      <div className="space-y-6 font-mono text-xs text-white">
      {/* Title */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 glass-pill px-3.5 py-1.5 mb-3 border-cyan-500/15">
            <FolderGit2 size={13} className="text-cyan-400" />
            <span className="text-[10px] text-yowon-muted uppercase tracking-[0.22em]">
              Archives Registry
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Repository <span className="text-cyan-400">Inventory</span>
          </h1>
          <p className="text-yowon-muted text-[11px] mt-1 max-w-xl">
            Browse, search, and manage all evaluated codebases. Switch between grid and list visualizations to verify overall verdicts.
          </p>
        </div>

        {/* Action button */}
        <Link to="/submit" className="yowon-btn-primary flex items-center gap-2 text-xs font-display">
          <Sparkles size={14} /> Analyze New Repo
        </Link>
      </section>

      {/* Toolbar Options (Filters / Grid Toggle / Search) */}
      <section className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="bg-[#05070a] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56 sm:w-64"
            />
          </div>

          {/* Type filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#05070a] border border-white/10 rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
            >
              <option value="all">All Stack Types</option>
              <option value="javascript">JavaScript / TS</option>
              <option value="python">Python</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
            </select>
            <Filter size={11} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* View Mode & Sorting */}
        <div className="flex items-center gap-3">
          {/* Sort control button */}
          <button
            onClick={() => toggleSort('overall_score')}
            className={`px-3 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] flex items-center gap-1.5 transition-colors cursor-pointer ${
              sortBy === 'overall_score' ? 'text-cyan-400 border-cyan-500/10' : 'text-slate-300'
            }`}
          >
            <ArrowUpDown size={12} />
            <span>Score</span>
          </button>
          
          <button
            onClick={() => toggleSort('created_at')}
            className={`px-3 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] flex items-center gap-1.5 transition-colors cursor-pointer ${
              sortBy === 'created_at' ? 'text-cyan-400 border-cyan-500/10' : 'text-slate-300'
            }`}
          >
            <Calendar size={12} />
            <span>Date</span>
          </button>

          {/* Grid/List Toggle */}
          <div className="flex items-center bg-[#05070a] border border-white/10 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-white'
              }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-white'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Main projects grid/list display */}
      <section className="relative z-10">
        {loading ? (
          <div className="py-24 text-center text-slate-500 animate-pulse">Tracing repository inventory...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-24 text-center text-yowon-muted border border-white/5 bg-white/[0.01] rounded-2xl">
            No evaluated repos match the filter parameters.
          </div>
        ) : viewMode === 'grid' ? (
          // Grid view Mode (Raycast/Linear card layout)
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((proj, idx) => (
                <motion.div
                  key={proj.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.28, delay: idx * 0.05 }}
                  className="glass-card flex flex-col justify-between h-72 border-cyan-500/10 relative group overflow-hidden"
                >
                  {/* Colored card top header accent */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Top content */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold font-display text-white truncate group-hover:text-cyan-400 transition-colors">
                          {proj.name}
                        </h3>
                        <span className="inline-block mt-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] text-cyan-300 font-mono uppercase">
                          {proj.project_type || 'Unspecified'}
                        </span>
                      </div>

                      {/* Small health gauge */}
                      {proj.overall_score !== undefined && (
                        <div className="w-12 h-12 shrink-0">
                          <ScoreRing score={proj.overall_score} size={48} />
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-yowon-muted leading-relaxed font-sans line-clamp-3">
                      Analyzed codebase footprints. Visualized calling hierarchies, circular import patterns, developer diagnostics, and agent verdicts.
                    </p>
                  </div>

                  {/* Bottom details & Actions */}
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <div className="flex justify-between items-center text-[10px] text-yowon-muted font-mono">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(proj.created_at).toLocaleDateString()}</span>
                      {proj.github_url && (
                        <a
                          href={proj.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-white inline-flex items-center gap-1"
                        >
                          <ExternalLink size={10} /> GitHub
                        </a>
                      )}
                    </div>

                    {/* Quick Access panel buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <Link
                        to={`/projects/${proj.id}`}
                        className="py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-cyan-500 hover:text-black font-bold text-center transition-all text-[9.5px] uppercase"
                      >
                        Open OS
                      </Link>
                      <Link
                        to={`/report/${proj.id}/overview`}
                        className="py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-indigo-500 hover:text-black font-bold text-center transition-all text-[9.5px] uppercase"
                      >
                        Report
                      </Link>
                      <Link
                        to={`/evaluate/${proj.id}`}
                        className="py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-emerald-500 hover:text-black font-bold text-center transition-all text-[9.5px] uppercase"
                      >
                        Re-run
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          // List View Mode
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((proj, idx) => (
                <motion.div
                  key={proj.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.2 }}
                  className="glass-card !p-4 border-cyan-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Score Ring indicator */}
                    {proj.overall_score !== undefined ? (
                      <div className="w-10 h-10 shrink-0">
                        <ScoreRing score={proj.overall_score} size={40} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-yowon-muted shrink-0">
                        <Clock size={16} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold font-display text-white truncate group-hover:text-cyan-400 transition-colors">
                        {proj.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 font-mono text-[9px] text-yowon-muted">
                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-cyan-300 uppercase">{proj.project_type || 'Unspecified'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(proj.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-3">
                    {proj.github_url && (
                      <a
                        href={proj.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:text-white transition-colors"
                        title="GitHub Code"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <Link
                      to={`/projects/${proj.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-cyan-500 hover:text-black font-bold transition-all text-[10px]"
                    >
                      Open OS
                    </Link>
                    <Link
                      to={`/report/${proj.id}/overview`}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-indigo-500 hover:text-black font-bold transition-all text-[10px]"
                    >
                      AI Verdict
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Pagination control */}
      {totalPages > 1 && (
        <section className="flex items-center justify-between border-t border-white/5 pt-6 mt-4">
          <span className="text-yowon-muted font-mono">
            Page {page} of {totalPages} ({total} analyzed)
          </span>
          
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </section>
      )}
      </div>
    </div>
  )
}
