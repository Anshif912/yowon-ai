import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Search, ChevronRight, Home, Brain, FolderGit2, FileText, Slash, Plus, Folder, ChevronDown } from 'lucide-react'
import { api } from '../../api/api'
import { useAuth } from '../auth/AuthContext'
import { useWorkspace } from '../auth/WorkspaceContext'

interface Project {
  id: string
  name: string
  project_type: string
}

const PAGE_LABELS: Record<string, string> = {
  dashboard:    'Dashboard',
  projects:     'Projects',
  submit:       'Submit',
  intelligence: 'Intelligence',
  evaluate:     'Evaluation',
  report:       'Report',
  history:      'History',
  settings:     'Settings',
  leaderboard:  'Leaderboard',
  jury:         'Jury Panel',
}

export default function Topbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { workspaces, currentWorkspace, selectWorkspace } = useWorkspace()

  const [projects, setProjects] = useState<Project[]>([])
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const workspaceDropdownRef = useRef<HTMLDivElement>(null)

  const pathParts = pathname.split('/').filter(Boolean)
  let activeProjectId = ''
  if (pathParts[0] && ['intelligence', 'evaluate', 'report'].includes(pathParts[0])) {
    activeProjectId = pathParts[1] || ''
  }

  // Load projects for dropdown - reloads when workspace changes!
  useEffect(() => {
    setProjects([])
    api.get('/projects?page=1&size=100')
      .then(res => {
        if (res.data?.projects) {
          setProjects(res.data.projects.map((item: any) => ({
            id: item.id,
            name: item.name,
            project_type: item.project_type || 'Unspecified'
          })))
        }
      })
      .catch(() => {})
  }, [currentWorkspace])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false)
      }
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(e.target as Node)) {
        setWorkspaceDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentProject = projects.find(p => p.id === activeProjectId)

  const handleSelectProject = (projectId: string) => {
    setProjectDropdownOpen(false)
    localStorage.setItem('yowon_active_project_id', projectId)
    const view = pathParts[0] || 'intelligence'
    if (['intelligence', 'evaluate', 'report'].includes(view)) {
      navigate(`/${view}/${projectId}`)
    } else {
      navigate(`/intelligence/${projectId}`)
    }
  }

  // Build breadcrumb segments
  const segments: Array<{ label: string; href?: string }> = []
  if (pathParts.length > 0) {
    const root = pathParts[0]
    segments.push({ label: PAGE_LABELS[root] || root, href: `/${root}` })

    // If we're in a project context, show project name
    if (currentProject && pathParts.length >= 2) {
      segments.push({ label: currentProject.name })
    }
  }

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.05] px-5"
      style={{
        height: 'var(--topbar-h, 48px)',
        background: 'var(--topbar-bg, rgba(5,7,10,0.80))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Left: Breadcrumb */}
      <nav className="breadcrumb-nav flex items-center gap-3">
        <Link to="/dashboard" className="text-zinc-600 hover:text-zinc-400 transition-colors">
          <Home size={12} />
        </Link>

        <span className="sep text-zinc-800">/</span>

        {/* Workspace Switcher */}
        <div className="relative" ref={workspaceDropdownRef}>
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.02] border border-white/5 hover:border-white/15 text-zinc-300 transition-all cursor-pointer font-mono text-[10px] font-bold"
          >
            <Brain size={11} className="text-cyan-400" />
            <span className="truncate max-w-[120px]">{currentWorkspace?.name || 'Workspace'}</span>
            <ChevronDown size={8} className="opacity-60" />
          </button>
          {workspaceDropdownOpen && (
            <div className="absolute left-0 top-7 w-60 bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 font-mono text-[11px]">
              <div className="px-2.5 py-1.5 text-[9px] text-zinc-600 uppercase tracking-wider border-b border-white/5 mb-1 flex justify-between items-center">
                <span>Switch Workspace</span>
                {currentWorkspace?.type && (
                  <span className="px-1 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[8px] font-bold uppercase">{currentWorkspace.type}</span>
                )}
              </div>
              <div className="max-h-44 overflow-y-auto space-y-0.5">
                {workspaces.map(w => (
                  <button
                    key={w.workspace_id}
                    onClick={() => {
                      selectWorkspace(w.workspace_id)
                      setWorkspaceDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left cursor-pointer transition-colors ${
                      w.workspace_id === currentWorkspace?.workspace_id
                        ? 'bg-cyan-500/10 text-cyan-200 font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate max-w-[140px]">{w.name}</span>
                    <span className="text-[8px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 uppercase font-black">{w.type.toLowerCase()}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-white/5 pt-1 mt-1">
                <Link
                  to="/settings"
                  onClick={() => setWorkspaceDropdownOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-[10px]"
                >
                  <Plus size={11} />
                  Manage Workspaces
                </Link>
              </div>
            </div>
          )}
        </div>

        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="sep">
              <ChevronRight size={10} />
            </span>
            {seg.href && i < segments.length - 1 ? (
              <Link to={seg.href}>{seg.label}</Link>
            ) : (
              <span className="current">{seg.label}</span>
            )}
          </span>
        ))}

        {/* Project switcher in breadcrumb — only on project-scoped pages */}
        {activeProjectId && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <ChevronDown size={10} />
            </button>
            {projectDropdownOpen && (
              <div className="absolute left-0 top-6 w-56 bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 font-mono text-[11px]">
                <div className="px-2.5 py-1.5 text-[9px] text-zinc-600 uppercase tracking-wider border-b border-white/5 mb-1">
                  Switch Project
                </div>
                <div className="max-h-44 overflow-y-auto space-y-0.5">
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProject(p.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left cursor-pointer transition-colors ${
                        p.id === activeProjectId
                          ? 'bg-cyan-500/10 text-cyan-200 font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Folder size={10} />
                        <span className="truncate max-w-[120px]">{p.name}</span>
                      </span>
                    </button>
                  ))}
                  {projects.length === 0 && (
                    <div className="px-2.5 py-3 text-center text-zinc-600 italic text-[10px]">No projects yet</div>
                  )}
                </div>
                <div className="border-t border-white/5 pt-1 mt-1">
                  <Link
                    to="/submit"
                    onClick={() => setProjectDropdownOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-[11px]"
                  >
                    <Plus size={11} />
                    Analyze New Project
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Right: Search shortcut + Avatar */}
      <div className="flex items-center gap-2">
        {/* Global search shortcut */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-command-palette'))}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:text-white hover:border-white/10 transition-all cursor-pointer text-xs"
        >
          <Search size={12} />
          <span className="hidden sm:inline text-[11px]">Search</span>
          <kbd className="hidden sm:inline-flex items-center bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* User avatar */}
        {user && (
          <Link
            to="/settings"
            className="w-7 h-7 rounded-full border border-white/[0.1] hover:border-cyan-400/40 bg-gradient-to-tr from-cyan-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs overflow-hidden transition-all"
            title="Operator Settings"
          >
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              : (user.full_name?.charAt(0) || 'U').toUpperCase()
            }
          </Link>
        )}
      </div>
    </header>
  )
}
