import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Clock,
  Folder,
  ChevronDown,
  Activity,
  History
} from 'lucide-react'
import { api } from '../api/api'
import TimelinePanel from '../components/report/TimelinePanel'

interface Project {
  id: string
  name: string
  project_type: string
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string>('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Load projects list
  useEffect(() => {
    api.get('/projects?page=1&size=100')
      .then(res => {
        if (res.data && res.data.projects) {
          const mapped = res.data.projects.map((item: any) => ({
            id: item.id,
            name: item.name,
            project_type: item.project_type || 'Unspecified'
          }))
          setProjects(mapped)
          
          // Select last active project or the first one
          const storedId = localStorage.getItem('yowon_active_project_id')
          if (storedId && mapped.some((p: any) => p.id === storedId)) {
            setActiveProjectId(storedId)
          } else if (mapped.length > 0) {
            setActiveProjectId(mapped[0].id)
          }
        }
      })
      .catch(() => {})
  }, [])

  const currentProject = projects.find(p => p.id === activeProjectId)

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id)
    setDropdownOpen(false)
    localStorage.setItem('yowon_active_project_id', id)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
      <div className="space-y-8 font-mono text-xs text-white">
      {/* Title & Selector */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 glass-pill px-3 py-1.5 border-cyan-500/15 mb-3">
            <Clock size={13} className="text-cyan-400" />
            <span className="text-[10px] text-yowon-muted uppercase tracking-widest">Evaluation History</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Repository Evolution Timeline
          </h1>
          <p className="text-yowon-muted text-[11px] mt-1 max-w-xl leading-relaxed">
            Trace evaluation score metrics deltas, subsystem drift, code size updates, and structural mutations over multiple runs.
          </p>
        </div>

        {/* Project Selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold text-white transition-all focus:outline-none cursor-pointer"
          >
            <Folder size={14} className="text-cyan-400" />
            <span className="truncate max-w-[150px]">
              {currentProject ? currentProject.name : 'Select Project'}
            </span>
            <ChevronDown size={12} className="text-yowon-muted" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-slate-950/95 border border-white/10 rounded-xl shadow-2xl p-1.5 space-y-1 z-50">
                <div className="px-2.5 py-1.5 text-[9px] text-yowon-muted uppercase tracking-wider border-b border-white/5">
                  Select Project to view History
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProject(p.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left cursor-pointer transition-colors ${
                        p.id === activeProjectId
                          ? 'bg-cyan-500/10 text-cyan-200 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-[9px] text-yowon-muted uppercase">{p.project_type}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Timeline Panel container */}
      <section className="relative z-10">
        {activeProjectId ? (
          <div className="glass-card !p-0 overflow-hidden border-cyan-500/10">
            {/* Colored top border bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-cyan-400 to-indigo-600" />
            <div className="p-6">
              <TimelinePanel projectId={activeProjectId} />
            </div>
          </div>
        ) : (
          <div className="glass-card text-center p-12 space-y-6 border border-white/5 flex flex-col items-center max-w-md mx-auto">
            <History size={36} className="text-zinc-500 animate-pulse" />
            <div className="space-y-2">
              <p className="text-white font-display text-sm font-bold">No evaluations found</p>
              <p className="text-zinc-400 font-sans text-xs leading-relaxed">
                Submit a repository to begin building your evaluation history.
              </p>
            </div>
            <button
              onClick={() => navigate('/submit')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-zinc-950 rounded-xl font-mono text-xs font-extrabold transition-colors cursor-pointer"
            >
              Submit Repository
            </button>
          </div>
        )}
      </section>
      </div>
    </div>
  )
}
