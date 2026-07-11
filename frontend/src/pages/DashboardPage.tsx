import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Terminal,
  Folder,
  Trophy,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  Cpu,
  Layers,
  Activity,
  Plus
} from 'lucide-react'
import { api } from '../api/api'
import { useAuth } from '../components/auth/AuthContext'
import ScoreRing from '../components/ScoreRing'

interface Project {
  id: string
  name: string
  project_type: string
  overall_score?: number
  status: string
  created_at: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/projects?page=1&size=10')
      .then(res => {
        if (res.data && res.data.items) {
          setProjects(res.data.items)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const evaluated = projects.filter(p => p.overall_score !== undefined)
  const averageScore = evaluated.length > 0
    ? Math.round(evaluated.reduce((acc, p) => acc + (p.overall_score || 0), 0) / evaluated.length)
    : 0

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 space-y-10 font-mono text-xs text-white">
      {/* ── Welcome Header Section (Linear style, spacious) ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">OPERATOR CONSOLE ONLINE</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">
              Welcome back, <span className="gradient-text">{user?.full_name || 'Operator'}</span>
            </h1>
            <p className="text-zinc-500 text-xs font-sans max-w-xl">
              YOWON AI has synchronized all static analyzers and semantic mappers. Begin by submitting a new codebase or opening an active workspace analysis below.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/submit')}
              className="yowon-btn-primary flex items-center gap-2 h-9 text-xs"
            >
              <Plus size={14} /> Analyze Repository
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="yowon-btn-secondary flex items-center gap-2 h-9 text-xs"
            >
              <Folder size={14} /> Browse Workspace
            </button>
          </div>
        </div>
      </section>

      {/* ── KPI Metric Strip (Translucent cards, single row) ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'total repositories', value: projects.length, desc: 'Registered in network', color: 'text-blue-400' },
          { label: 'average health', value: `${averageScore}%`, desc: 'Calculated across runs', color: 'text-cyan-400' },
          { label: 'clearance level', value: user?.role || 'Guest', desc: 'Active operator role', color: 'text-violet-400' },
          { label: 'evaluations', value: evaluated.length, desc: 'Completed jury verdicts', color: 'text-emerald-400' }
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.01] border border-white/[0.06] rounded-xl p-4 space-y-1 hover:border-white/10 transition-colors">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">{stat.label}</span>
            <span className={`text-2xl font-bold tracking-tight block ${stat.color}`}>{stat.value}</span>
            <span className="text-[9px] text-zinc-600 block">{stat.desc}</span>
          </div>
        ))}
      </section>

      {/* ── Core Workspace: Health Index + Recent Repositories (50-50 split) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Health Index Card */}
        <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
            <Shield size={16} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Repository Health Summary</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
            <div className="w-28 h-28 shrink-0">
              <ScoreRing score={averageScore} size={112} />
            </div>
            <div className="space-y-2 text-center sm:text-left min-w-0">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-mono">system average index</span>
              <span className="text-3xl font-display font-bold text-white block">{averageScore}%</span>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-sans max-w-xs">
                Codebases with an overall index score above 70% are automatically cleared for production release. Refactor recommendations are generated for low-scoring dimensions.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Repositories */}
        <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Folder size={16} className="text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Recent Projects</h2>
            </div>
            <Link to="/projects" className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
              View All <ArrowRight size={10} />
            </Link>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-44 pr-1">
            {loading ? (
              <div className="py-8 text-center text-zinc-600 animate-pulse">Synchronizing metadata...</div>
            ) : projects.length > 0 ? (
              projects.slice(0, 3).map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/intelligence/${p.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/[0.05] hover:bg-white/[0.02] hover:border-white/10 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                      <Layers size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                      <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider truncate mt-0.5">{p.project_type || 'Unspecified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {p.overall_score !== undefined ? (
                      <span className="font-mono font-bold text-cyan-400 text-xs">
                        {Math.round(p.overall_score)}%
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-amber-400 uppercase">
                        {p.status}
                      </span>
                    )}
                    <span className="text-[9px] text-zinc-600">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-zinc-600 italic">
                No active repositories. Submit a codebase to generate intelligence profiles.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Bottom Section: Logs & Updates ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Updates Card */}
        <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
            <Sparkles size={16} className="text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">System Changelog</h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded">NEW</span>
                <span className="text-xs font-bold text-zinc-300">Case-File Workspace Redesign</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                Replaced the fragmented layout panels with 6 scrollable Acts mapping the narrative flow of repository analysis.
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold text-violet-400 bg-violet-400/10 border border-violet-400/20 px-1.5 py-0.5 rounded">UPDATE</span>
                <span className="text-xs font-bold text-zinc-300">Force-Directed Cluster Halos</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                Optimized visual layouts for SVG graph components, resolving rectangular constraints to circular glowing nodes.
              </p>
            </div>
          </div>
        </div>

        {/* Operator Logs */}
        <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
            <Activity size={16} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">System Logs</h2>
          </div>
          <div className="space-y-3 font-mono text-[10px]">
            {[
              { time: '15:48:02', msg: 'Operator context synchronized from session state', color: 'text-cyan-400' },
              { time: '12:30:10', msg: 'Database connection verified successfully', color: 'text-emerald-400' },
              { time: '10:45:22', msg: 'WebGL canvas context orbital mapping active', color: 'text-violet-400' },
              { time: '08:00:00', msg: 'Automatic scheduled trace integrity checks completed', color: 'text-zinc-600' }
            ].map((log, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className={`${log.color} shrink-0`}>{log.time}</span>
                <span className="text-zinc-500 leading-relaxed">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
