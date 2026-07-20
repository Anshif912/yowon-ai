import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FolderGit2,
  Brain,
  Play,
  FileText,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Folder,
  LogOut,
  Trophy,
  Gavel,
  Plus,
  Users,
  Home,
  Link2,
  Key,
  ShoppingBag,
  Blocks,
  Webhook,
  Activity,
  Bot,
  Search,
  BarChart3,
  Radio,
  Network,
  TrendingUp,
  FolderOpen,
  Scale,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../../api/api'

interface Project {
  id: string
  name: string
  project_type: string
}

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
  active: boolean
  disabled?: boolean
  color?: string
  badge?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('yowon_sidebar_collapsed') === 'true'
  )
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  
  // Judge/Demo Mode state
  const [judgeMode, setJudgeMode] = useState(() => {
    const val = localStorage.getItem('yowon_judge_mode')
    return val !== 'false' // default is true
  })

  useEffect(() => {
    localStorage.setItem('yowon_sidebar_collapsed', String(collapsed))
  }, [collapsed])

  useEffect(() => {
    localStorage.setItem('yowon_judge_mode', String(judgeMode))
    // Dispatch a custom event to notify other components (like Command Palette)
    window.dispatchEvent(new Event('yowon_judge_mode_changed'))
  }, [judgeMode])

  // Extract projectId from URL
  const pathParts = pathname.split('/')
  let urlProjectId = ''
  if (pathParts[1] && ['intelligence', 'evaluate', 'report', 'authenticity'].includes(pathParts[1])) {
    urlProjectId = pathParts[2] || ''
  }

  useEffect(() => {
    const fetchProject = async (id: string) => {
      try {
        const res = await api.get(`/status/${id}`)
        if (res.data) {
          setActiveProject({
            id: res.data.project_id,
            name: res.data.name,
            project_type: res.data.project_type || 'Unspecified'
          })
        }
      } catch (err) {
        try {
          const evalRes = await api.get(`/evaluations/${id}`)
          if (evalRes.data && evalRes.data.project_id) {
            const pId = evalRes.data.project_id
            const res = await api.get(`/status/${pId}`)
            if (res.data) {
              setActiveProject({
                id: res.data.project_id,
                name: res.data.name,
                project_type: res.data.project_type || 'Unspecified'
              })
            }
          }
        } catch {}
      }
    }

    if (urlProjectId) {
      localStorage.setItem('yowon_active_project_id', urlProjectId)
      fetchProject(urlProjectId)
    } else {
      const storedId = localStorage.getItem('yowon_active_project_id')
      if (storedId && !activeProject) fetchProject(storedId)
    }
  }, [urlProjectId])

  const projectId = urlProjectId || activeProject?.id || ''

  // Compile navigation links dynamically
  const navGroups: NavGroup[] = judgeMode
    ? [
        {
          label: 'AI Command OS',
          items: [
            {
              label: 'Home',
              icon: Home,
              to: '/dashboard', // The Home Command Center will map to dashboard page
              active: pathname === '/dashboard' || pathname === '/',
              color: '#00E5FF'
            },
            {
              label: 'Repositories',
              icon: FolderGit2,
              to: '/projects',
              active: pathname.startsWith('/projects') || pathname.startsWith('/repositories'),
              color: '#3B82F6'
            },
            {
              label: 'Intelligence',
              icon: Brain,
              to: '/intelligence',
              active: pathname === '/intelligence' || pathname.startsWith('/intelligence/copilot') || pathname.startsWith('/intelligence/search') || pathname.startsWith('/intelligence/predictions') || pathname.startsWith('/intelligence/digital-twin'),
              color: '#8B5CF6'
            },
            {
              label: 'Evaluate',
              icon: Play,
              to: '/submit',
              active: pathname.startsWith('/submit') || pathname.startsWith('/evaluate'),
              color: '#EAB308'
            },
            {
              label: 'Dashboard',
              icon: TrendingUp,
              to: '/intelligence/executive',
              active: pathname.startsWith('/intelligence/executive'),
              color: '#EF4444'
            },
            {
              label: 'Settings',
              icon: Settings,
              to: '/settings',
              active: pathname.startsWith('/settings'),
              color: '#71717A'
            }
          ]
        }
      ]
    : [
        {
          label: 'Workspace',
          items: [
            {
              label: 'Dashboard',
              icon: LayoutDashboard,
              to: '/dashboard',
              active: pathname === '/dashboard',
              color: '#00E5FF',
            },
            {
              label: 'Projects',
              icon: FolderGit2,
              to: '/projects',
              active: pathname.startsWith('/projects') && !pathname.match(/\/projects\/.+/),
              color: '#3B82F6',
            },
            {
              label: 'Teams',
              icon: Users,
              to: '/teams',
              active: pathname.startsWith('/teams'),
              color: '#8B5CF6',
            },
          ]
        },
        {
          label: 'Repository',
          items: [
            {
              label: 'Repository Intel',
              icon: Brain,
              to: projectId ? `/intelligence/${projectId}` : '/projects',
              active: pathname.startsWith('/intelligence/') && !['copilot', 'search', 'predictions', 'digital-twin', 'executive'].includes(pathname.split('/')[2]),
              disabled: !projectId,
              color: '#8B5CF6',
              badge: 'AI',
            },
            {
              label: 'Project DNA',
              icon: FolderOpen,
              to: projectId ? `/intelligence/${projectId}/story` : '/projects',
              active: pathname.startsWith('/intelligence/') && pathname.split('/')[3] === 'story',
              disabled: !projectId,
              color: '#A855F7',
            },
            {
              label: 'Authenticity',
              icon: Shield,
              to: projectId ? `/authenticity/${projectId}` : '/projects',
              active: pathname.startsWith('/authenticity'),
              disabled: !projectId,
              color: '#EF4444',
            },
            {
              label: 'Decision Intelligence',
              icon: Gavel,
              to: '/jury',
              active: pathname.startsWith('/jury'),
              color: '#F97316',
            },
            {
              label: 'Governance',
              icon: Scale,
              to: '/leaderboard',
              active: pathname.startsWith('/leaderboard'),
              color: '#EAB308',
            },
          ]
        },
        {
          label: 'Enterprise',
          items: [
            {
              label: 'Enterprise Overview',
              icon: Home,
              to: '/enterprise',
              active: pathname === '/enterprise',
              color: '#10B981',
            },
            {
              label: 'Connectors',
              icon: Link2,
              to: '/enterprise/connectors',
              active: pathname.startsWith('/enterprise/connectors'),
              color: '#3B82F6',
            },
            {
              label: 'Secrets Vault',
              icon: Key,
              to: '/enterprise/secrets',
              active: pathname.startsWith('/enterprise/secrets'),
              color: '#EF4444',
            },
            {
              label: 'Marketplace',
              icon: ShoppingBag,
              to: '/enterprise/marketplace',
              active: pathname.startsWith('/enterprise/marketplace'),
              color: '#F97316',
            },
            {
              label: 'Plugins',
              icon: Blocks,
              to: '/enterprise/plugins',
              active: pathname.startsWith('/enterprise/plugins'),
              color: '#8B5CF6',
            },
            {
              label: 'Webhooks',
              icon: Webhook,
              to: '/enterprise/webhooks',
              active: pathname.startsWith('/enterprise/webhooks'),
              color: '#00E5FF',
            },
            {
              label: 'Operations',
              icon: Activity,
              to: '/enterprise/operations',
              active: pathname.startsWith('/enterprise/operations'),
              color: '#10B981',
            },
          ]
        },
        {
          label: 'Enterprise AI',
          items: [
            {
              label: 'AI Overview',
              icon: Home,
              to: '/intelligence',
              active: pathname === '/intelligence',
              color: '#00E5FF',
            },
            {
              label: 'Copilot',
              icon: Bot,
              to: '/intelligence/copilot',
              active: pathname.startsWith('/intelligence/copilot'),
              color: '#8B5CF6',
            },
            {
              label: 'Knowledge Search',
              icon: Search,
              to: '/intelligence/search',
              active: pathname.startsWith('/intelligence/search'),
              color: '#A855F7',
            },
            {
              label: 'Predictions',
              icon: BarChart3,
              to: '/intelligence/predictions',
              active: pathname.startsWith('/intelligence/predictions'),
              color: '#EAB308',
            },
            {
              label: 'Digital Twin',
              icon: Radio,
              to: '/intelligence/digital-twin',
              active: pathname.startsWith('/intelligence/digital-twin'),
              color: '#00E5FF',
            },
            {
              label: 'Workflow Studio',
              icon: Network,
              to: '/enterprise/workflows',
              active: pathname.startsWith('/enterprise/workflows'),
              color: '#10B981',
            },
            {
              label: 'Executive Dashboard',
              icon: TrendingUp,
              to: '/intelligence/executive',
              active: pathname.startsWith('/intelligence/executive'),
              color: '#EF4444',
            },
          ]
        },
        {
          label: 'Manage',
          items: [
            {
              label: 'Reports',
              icon: FileText,
              to: projectId ? `/report/${projectId}` : '/projects',
              active: pathname.startsWith('/report'),
              disabled: !projectId,
              color: '#6366F1',
            },
            {
              label: 'Settings',
              icon: Settings,
              to: '/settings',
              active: pathname.startsWith('/settings'),
              color: '#71717A',
            },
          ]
        }
      ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sidebarW = collapsed ? 72 : 280

  return (
    <motion.aside
      className="h-screen shrink-0 flex flex-col relative z-40"
      style={{ background: 'var(--sidebar-bg)' }}
      animate={{ width: sidebarW }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Inner border */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-white/[0.06]" />

      {/* ── Brand Header ── */}
      <div className="flex items-center px-4 h-12 shrink-0 border-b border-white/[0.05]">
        <Link to="/" className="flex items-center gap-3 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #00E5FF 0%, #00FFA3 50%, #7C3AED 100%)',
              boxShadow: '0 0 16px rgba(0,229,255,0.3)',
            }}
          >
            <Shield size={16} className="text-[#04111F]" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="leading-none overflow-hidden"
              >
                <div className="font-display font-bold text-sm text-white tracking-tight whitespace-nowrap">
                  YOWON AI
                </div>
                <div className="text-[8.5px] font-mono text-cyan-400 uppercase tracking-[0.22em] mt-0.5">
                  Intelligence OS
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* ── Scrollable Nav Area ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4 custom-scrollbar">

        {/* Active Project Card */}
        <AnimatePresence>
          {!collapsed && activeProject && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-3 overflow-hidden"
            >
              <div
                className="rounded-xl border p-3 space-y-1.5"
                style={{
                  background: 'rgba(0,229,255,0.04)',
                  borderColor: 'rgba(0,229,255,0.12)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(0,229,255,0.12)' }}
                  >
                    <Folder size={12} className="text-cyan-400" />
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-[0.2em]">
                    Active Project
                  </span>
                </div>
                <p className="text-xs font-semibold text-white truncate pl-0.5">{activeProject.name}</p>
                <div className="flex items-center gap-1.5 pl-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                    {activeProject.project_type}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Groups */}
        {navGroups
          .filter((group) => {
            if (group.label === 'Enterprise') {
              return user && ['SUPER_ADMIN', 'ORG_OWNER', 'WORKSPACE_ADMIN'].includes(user.role)
            }
            return true
          })
          .map((group) => (
            <div key={group.label} className="space-y-0.5">
              {/* Group label */}
              {!collapsed && (
                <div className="sidebar-nav-group-label px-4 mb-1">
                  {group.label}
                </div>
              )}

            <nav className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.active
                const color = item.color || '#71717A'

                return (
                  <div key={item.label} className="relative group">
                    <Link
                      to={item.to}
                      className={`sidebar-nav-item ${isActive ? 'active' : ''} ${item.disabled ? 'opacity-40 pointer-events-none' : ''}`}
                      onClick={e => { if (item.disabled) e.preventDefault() }}
                    >
                      {/* Active left bar is rendered by CSS ::before on .active */}

                      {/* Icon with semantic color */}
                      <span
                        className="shrink-0 transition-colors duration-150"
                        style={{ color: isActive ? color : undefined }}
                      >
                        <Icon size={18} />
                      </span>

                      {/* Label */}
                      <AnimatePresence mode="wait">
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="truncate flex-1 text-[0.8125rem]"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Badge */}
                      {!collapsed && item.badge && (
                        <span
                          className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0"
                          style={{ color, background: color + '18', border: `1px solid ${color}30` }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>

                    {/* Collapsed tooltip */}
                    {collapsed && (
                      <div className="absolute left-14 top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <div className="bg-zinc-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg shadow-2xl whitespace-nowrap">
                          {item.label}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Group divider */}
            <div className="mx-4 mt-2 h-px bg-white/[0.04]" />
          </div>
        ))}
      </div>

      {/* ── Bottom User Section ── */}
      <div className="shrink-0 border-t border-white/[0.05] p-3 space-y-2.5">
        {/* Judge Mode Switcher */}
        {!collapsed ? (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.04] select-none">
            <div className="flex items-center gap-2">
              <Shield size={12} className={judgeMode ? 'text-cyan-400 animate-pulse' : 'text-zinc-600'} />
              <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">Judge Mode</span>
            </div>
            <button
              onClick={() => setJudgeMode(!judgeMode)}
              className={`w-7 h-4 rounded-full relative p-0.5 transition-colors duration-150 cursor-pointer ${judgeMode ? 'bg-cyan-500' : 'bg-zinc-800'}`}
              title="Toggle Judge/Demo Mode"
            >
              <div className={`w-3 h-3 rounded-full bg-black shadow transition-transform duration-150 ${judgeMode ? 'translate-x-3' : 'translate-x-0'}`} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setJudgeMode(!judgeMode)}
            className={`w-8 h-8 mx-auto rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
              judgeMode 
                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' 
                : 'bg-zinc-950 border-white/[0.06] text-zinc-600'
            }`}
            title={`Judge Mode: ${judgeMode ? 'On' : 'Off'}`}
          >
            <Shield size={14} className={judgeMode ? 'animate-pulse' : ''} />
          </button>
        )}

        {/* Ctrl + K command palette hint */}
        {!collapsed && (
          <div className="flex items-center justify-between px-2 text-[9px] font-mono text-zinc-500">
            <span>Actions menu</span>
            <span className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-[8px]">Ctrl + K</span>
          </div>
        )}

        {/* User profile card */}
        {user && (
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full border border-white/10 bg-gradient-to-tr from-cyan-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                : (user.full_name?.charAt(0) || 'U').toUpperCase()
              }
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider truncate">{user.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center justify-center h-8 rounded-xl border border-white/[0.06] text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer ${collapsed ? 'w-full' : 'w-full'}`}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600">
              <ChevronLeft size={14} />
              <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
