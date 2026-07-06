import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FolderGit2, Search, ArrowUpDown, ExternalLink, Calendar, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { api } from '../api/api'
import { scoreColor } from '../utils/reportParser'

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
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(10)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [loading, setLoading] = useState(true)

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

  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 font-mono text-xs text-white">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 glass-pill px-3.5 py-1.5 mb-3 border-cyan-500/15">
              <FolderGit2 size={13} className="text-cyan-400" />
              <span className="text-[10px] font-mono text-yowon-muted uppercase tracking-[0.22em]">
                System Archives
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
              Projects <span className="gradient-text">Hub</span>
            </h1>
            <p className="text-yowon-muted text-[11px] mt-1">
              Browse, search, and manage all evaluated codebases in the persistent database.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="bg-white/[0.03] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 w-64"
              />
            </div>
          </div>
        </div>

        {/* List Grid */}
        {loading ? (
          <div className="text-center py-24 text-yowon-muted">Loading projects registry...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 text-yowon-muted border border-white/5 bg-white/[0.01] rounded-2xl">
            No projects found in search archives.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Headers */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 px-4 py-2 text-[10px] uppercase text-yowon-muted border-b border-white/5">
              <div className="md:col-span-2 cursor-pointer flex items-center gap-1 hover:text-white" onClick={() => toggleSort('name')}>
                Project Name <ArrowUpDown size={10} />
              </div>
              <div className="cursor-pointer flex items-center gap-1 hover:text-white" onClick={() => toggleSort('project_type')}>
                Type <ArrowUpDown size={10} />
              </div>
              <div className="md:col-span-2 cursor-pointer flex items-center gap-1 hover:text-white" onClick={() => toggleSort('created_at')}>
                Created At <ArrowUpDown size={10} />
              </div>
              <div className="text-right cursor-pointer flex items-center gap-1 justify-end hover:text-white" onClick={() => toggleSort('overall_score')}>
                Score <ArrowUpDown size={10} />
              </div>
            </div>

            {/* Project rows */}
            <div className="space-y-2">
              {projects.map((proj) => (
                <motion.div
                  key={proj.id}
                  className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:bg-white/[0.04] transition-all"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="md:col-span-2 space-y-1">
                    <Link to={`/report/${proj.id}`} className="font-bold text-white hover:text-cyan-400 hover:underline text-sm truncate block">
                      {proj.name}
                    </Link>
                    {proj.github_url && (
                      <a
                        href={proj.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-yowon-muted hover:text-white inline-flex items-center gap-1"
                      >
                        <ExternalLink size={10} /> Github Repo
                      </a>
                    )}
                  </div>

                  <div>
                    <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/10 uppercase font-mono text-cyan-200">
                      {proj.project_type}
                    </span>
                  </div>

                  <div className="md:col-span-2 text-yowon-muted flex items-center gap-1.5">
                    <Calendar size={11} /> {new Date(proj.created_at).toLocaleString()}
                  </div>

                  <div className="flex items-center justify-end gap-4">
                    {proj.overall_score != null ? (
                      <span
                        className="font-black font-mono text-sm px-2.5 py-0.5 rounded-lg"
                        style={{
                          backgroundColor: `${scoreColor(proj.overall_score)}15`,
                          color: scoreColor(proj.overall_score),
                          border: `1px solid ${scoreColor(proj.overall_score)}30`
                        }}
                      >
                        {proj.overall_score}/100
                      </span>
                    ) : (
                      <span className="text-[10px] text-yowon-muted italic">Incomplete</span>
                    )}

                    <Link
                      to={`/report/${proj.id}`}
                      className="bg-cyan-500 hover:bg-cyan-600 text-black px-3 py-1.5 rounded-lg font-bold text-[10px] transition-colors"
                    >
                      View Report
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                <span className="text-yowon-muted">
                  Showing page {page} of {totalPages} ({total} total projects)
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </AppShell>
  )
}
