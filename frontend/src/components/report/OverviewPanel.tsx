import React, { useMemo, useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Compass, BookOpen, Layers, Cpu, PlayCircle, Brain, Activity,
  ShieldCheck, FileText, Wrench, Map, ArrowRight, CheckCircle2
} from 'lucide-react'
import ScoreRing from '../ScoreRing'
import { useSharedIntelligenceContext } from './RepositoryIntelligenceWrapper'
import { useIntelStatus, useEvaluationReport } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import PremiumWorkspaceCard, {
  WorkspaceHeader,
  WorkspaceBody,
  WorkspaceFooter
} from './PremiumWorkspaceCard'
import { BentoCard, BentoCardGrid, GlobalSpotlight, useMobileDetection } from '../graphs/MagicBento'

interface OverviewPanelProps {
  projectId: string
}

// Particle drift component for key cards with mouse drift response
function LiveIntelligenceParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0, active: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = canvas.width = canvas.offsetWidth || 300
    let height = canvas.height = canvas.offsetHeight || 240

    // Slow drifting particle settings
    const particleCount = 20
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      radius: Math.random() * 1.8 + 1.2,
      alpha: Math.random() * 0.22 + 0.15
    }))

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const w = entry.contentRect.width
        const h = entry.contentRect.height
        if (w > 0 && h > 0) {
          width = canvas.width = w
          height = canvas.height = h
          
          particles.forEach(p => {
            if (p.x === 0 || p.x > w) p.x = Math.random() * w
            if (p.y === 0 || p.y > h) p.y = Math.random() * h
          })
        }
      }
    })
    resizeObserver.observe(canvas)

    // Track mouse move inside key card
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
      mouseRef.current.active = true
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    const parent = canvas.parentElement
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove)
      parent.addEventListener('mouseleave', handleMouseLeave)
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      particles.forEach(p => {
        // Slow drift
        p.x += p.vx
        p.y += p.vy

        // Subtle response to cursor
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x
          const dy = mouseRef.current.y - p.y
          const dist = Math.hypot(dx, dy)
          if (dist < 80) {
            const force = (80 - dist) / 80
            p.x -= dx * force * 0.02
            p.y -= dy * force * 0.02
          }
        }

        // Wrap around boundaries
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha})` // Cyan/teal particles
        ctx.shadowBlur = 6
        ctx.shadowColor = 'rgba(6, 182, 212, 0.6)'
        ctx.fill()
      })
      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove)
        parent.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: 'screen', opacity: 0.5 }}
    />
  )
}

function OverviewContent({ projectId }: { projectId: string }) {
  const context = useSharedIntelligenceContext()
  const navigate = useNavigate()
  const { data: statusData } = useIntelStatus(projectId)
  const { data: report } = useEvaluationReport(projectId)
  const rkm = context.rkm
  const status = statusData
  const project = report as any
  const vd = report?.verdict_data as any
  const diag = status?.diagnostics
  const gridRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobileDetection()

  // Extract statistics dynamically from RKM and context
  const stats = useMemo(() => {
    if (!rkm) return null

    const entities = Object.values(rkm.entities)
    
    // Count different entity types
    const archCount = entities.filter(e => ['service', 'database', 'controller', 'deployment', 'subsystem'].includes(e.type)).length
    const techCount = entities.filter(e => e.type === 'technology').length
    const depCount = entities.filter(e => e.type === 'package').length
    const knowCount = entities.filter(e => ['class', 'function', 'module', 'subsystem'].includes(e.type)).length
    
    // Compute average scores
    const avgHealth = Math.round(entities.reduce((sum, e) => sum + (e.health ?? 80), 0) / (entities.length || 1))
    
    // Filter warnings/evidence
    const evidenceCount = entities.filter(e => e.type === 'package' && e.health && e.health < 80).length

    return {
      archCount,
      techCount,
      depCount,
      knowCount,
      avgHealth,
      evidenceCount
    }
  }, [rkm])

  if (!rkm) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(12)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    )
  }

  const overallScore = rkm.metadata.overallScore || null

  // Aligned asymmetric card configurations answering user questions
  const cards = [
    {
      id: 'architecture',
      title: 'Architecture View',
      description: 'How is this repository structured?',
      icon: Layers,
      color: 'text-blue-400 border-zinc-800 bg-[#0c1017]',
      rgb: '59, 130, 246',
      desktopStyle: { gridColumn: 'span 2', minHeight: '300px' },
      scoreChip: `${stats?.avgHealth || 0}% Health`,
      featured: true,
      titleSize: '32px',
      badge: 'structure',
      keyMetrics: [
        `${stats?.archCount || 0} Architecture Services`,
        `${(context.rkm?.relationships || []).length || 0} System Connections`,
        `${Object.values(context.rkm?.entities || {}).filter(e => e.type === 'subsystem').length || 0} Subsystems Mapped`,
      ]
    },
    {
      id: 'technology',
      title: 'Technology View',
      description: 'Which technologies are used and why?',
      icon: Cpu,
      color: 'text-cyan-400 border-zinc-800 bg-[#0c1017]',
      rgb: '6, 182, 212',
      desktopStyle: { gridColumn: 'span 1', minHeight: '300px' },
      scoreChip: `${stats?.techCount || 0} Stacks`,
      featured: false,
      titleSize: '24px',
      badge: 'implementation',
      keyMetrics: (
        Object.values(context.rkm?.entities || {})
          .filter(e => e.type === 'technology')
          .slice(0, 3)
          .map(e => e.label)
      ).length > 0
        ? Object.values(context.rkm?.entities || {}).filter(e => e.type === 'technology').slice(0, 3).map(e => e.label)
        : [`${stats?.techCount || 0} Technologies Detected`, 'Run evaluation for details', '']
    },
    {
      id: 'dependency',
      title: 'Dependency View',
      description: 'Which modules are tightly coupled?',
      icon: PlayCircle,
      color: 'text-amber-400 border-zinc-800 bg-[#0c1017]',
      rgb: '245, 158, 11',
      desktopStyle: { gridColumn: 'span 1', minHeight: '300px' },
      scoreChip: `${stats?.depCount || 0} Packages`,
      featured: false,
      titleSize: '24px',
      badge: 'relationships',
      keyMetrics: [
        `${stats?.depCount || 0} Packages Detected`,
        `${Object.values(context.rkm?.entities || {}).filter(e => e.type === 'package' && (e.health || 100) < 80).length || 0} At-Risk Packages`,
        'Dependency graph available',
      ]
    },
    {
      id: 'knowledge',
      title: 'Knowledge Graph',
      description: 'Where should a new developer begin?',
      icon: Brain,
      color: 'text-purple-400 border-zinc-800 bg-[#0c1017]',
      rgb: '168, 85, 247',
      desktopStyle: { gridColumn: 'span 2', minHeight: '300px' },
      scoreChip: 'Hierarchy Mind Map',
      featured: true,
      titleSize: '32px',
      badge: 'relationships',
      keyMetrics: [
        `${stats?.knowCount || 0} AST Nodes Indexed`,
        `${(context.rkm?.relationships || []).length || 0} Code Relationships`,
        `${Object.values(context.rkm?.entities || {}).filter(e => e.type === 'class').length || 0} Classes Mapped`,
      ]
    },
    {
      id: 'runtime',
      title: 'Execution Pipeline',
      description: 'How does the system process requests?',
      icon: Activity,
      color: 'text-emerald-400 border-zinc-800 bg-[#0c1017]',
      rgb: '16, 185, 129',
      desktopStyle: { gridColumn: 'span 2', minHeight: '300px' },
      scoreChip: 'Pipeline active',
      featured: true,
      titleSize: '32px',
      badge: 'implementation',
      keyMetrics: [
        'Execution pipeline mapped',
        `${Object.values(context.rkm?.entities || {}).filter(e => e.type === 'service').length || 0} Services Detected`,
        'Flow analysis available',
      ]
    },
    {
      id: 'deployment',
      title: 'Deployment Roadmap',
      description: 'What should be improved next?',
      icon: Map,
      color: 'text-yellow-400 border-zinc-800 bg-[#0c1017]',
      rgb: '234, 179, 8',
      desktopStyle: { gridColumn: 'span 1', minHeight: '300px' },
      scoreChip: 'Roadmap Generated',
      featured: false,
      titleSize: '24px',
      badge: 'implementation',
      keyMetrics: [
        'Deployment configuration analyzed',
        `${Object.values(context.rkm?.entities || {}).filter(e => e.type === 'deployment').length || 0} Deployment Targets`,
        'Roadmap generated from evidence',
      ]
    },
    {
      id: 'evidence',
      title: 'Evidence Explorer',
      description: 'Which findings support the AI verdict?',
      icon: ShieldCheck,
      color: 'text-red-400 border-zinc-800 bg-[#0c1017]',
      rgb: '239, 68, 68',
      desktopStyle: { gridColumn: 'span 1', minHeight: '220px' },
      scoreChip: 'SAST Audit',
      featured: false,
      titleSize: '20px',
      badge: 'quality',
      keyMetrics: [
        `${stats?.evidenceCount || 0} Evidence Records`,
        `${Object.values(context.rkm?.entities || {}).filter(e => (e.type as string) === 'vulnerability').length || 0} Security Findings`,
        'Evidence-backed analysis',
      ]
    },
    {
      id: 'agents',
      title: 'AI Agents',
      description: 'Who evaluated the codebase?',
      icon: Cpu,
      color: 'text-fuchsia-400 border-zinc-800 bg-[#0c1017]',
      rgb: '217, 70, 239',
      desktopStyle: { gridColumn: 'span 1', minHeight: '220px' },
      scoreChip: '8 Evaluators Ready',
      featured: false,
      titleSize: '20px',
      badge: 'evaluation',
      keyMetrics: [
        `${Object.keys(vd?.agent_scores || {}).length || 8} Council Agents`,
        'Multi-agent consensus',
        'Reasoning trails mapped'
      ]
    },
    {
      id: 'files',
      title: 'Repository Overview',
      description: 'Where are the code components located?',
      icon: FileText,
      color: 'text-indigo-400 border-zinc-800 bg-[#0c1017]',
      rgb: '99, 102, 241',
      desktopStyle: { gridColumn: 'span 1', minHeight: '220px' },
      scoreChip: 'Explorer Active',
      featured: false,
      titleSize: '20px',
      badge: 'structure',
      keyMetrics: [
        'Virtual directory outlines',
        'Method outlines list',
        'Outline view symbol jumps'
      ]
    }
  ]

  const handleCardClick = (id: string) => {
    navigate(`/intelligence/${projectId}/${id}`)
  }

  // Explicit CSS grid inline rules to avoid Tailwind columns compile errors
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
    gap: '24px',
    width: '100%',
    maxWidth: 'none'
  }

  return (
    <DashboardSection id="overview" title="Consensus Overview Dashboard" icon={Compass}>
      <div className="space-y-12 font-sans text-white">
        
        {/* RICH REPOSITORY HERO SECTION */}
        <PremiumWorkspaceCard accent="executive">
          <WorkspaceBody className="flex flex-col lg:flex-row gap-8 justify-between">
            {/* Left Info: Name, Type, Tech Stack */}
            <div className="space-y-4 flex-1">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">
                    {rkm?.metadata?.name || 'Yowon AI'}
                  </h1>
                  <span className="text-[12px] px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 font-extrabold uppercase tracking-widest font-mono">
                    {rkm?.metadata?.projectType || project?.project_type || 'Repository'}
                  </span>
                </div>
                <p className="text-[16px] text-zinc-400 font-sans leading-relaxed">
                  {(rkm?.metadata as any)?.description || (report as any)?.summary || 'Repository intelligence analysis.'}
                </p>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-[12px] pt-4 border-t border-white/[0.04]">
                <div>
                  <span className="text-zinc-500 uppercase tracking-widest block font-bold select-none">Languages</span>
                  <span className="text-white font-bold block mt-1">{vd?.detected_technologies?.slice(0, 2).join(', ') || 'Auto-detected'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase tracking-widest block font-bold select-none">Frameworks</span>
                  <span className="text-white font-bold block mt-1">{vd?.detected_technologies?.slice(2, 5).join(', ') || 'Mapped'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase tracking-widest block font-bold select-none">AI Stack</span>
                  <span className="text-white font-bold block mt-1">{vd?.ai_intelligence ? 'Present' : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase tracking-widest block font-bold select-none">Size</span>
                  <span className="text-white font-bold block mt-1">{diag?.total_loc ? `${diag.total_loc.toLocaleString()} LOC` : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Right Info: Overall Health score ring and quick status metrics */}
            <div className="flex gap-8 items-center lg:border-l lg:border-white/[0.04] lg:pl-8 shrink-0">
              {/* Health Score Ring */}
              <div className="relative flex items-center justify-center shrink-0 w-[110px] h-[110px] rounded-full border-[3px] border-cyan-400/25 bg-zinc-950/60 shadow-[0_0_24px_rgba(6,182,212,0.15)]">
                <div className="absolute inset-0 rounded-full border border-cyan-400/35 animate-ping opacity-60 pointer-events-none" />
                <div className="text-center select-none">
                  <span className="font-mono font-black text-white leading-none block" style={{ fontSize: '38px' }}>{overallScore != null ? overallScore : '—'}</span>
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black font-mono block mt-0.5">Health</span>
                </div>
              </div>

              {/* Verdict and facts */}
              <div className="space-y-2 font-mono text-[12px]">
                <div>
                  <span className="text-zinc-500 uppercase tracking-widest block font-bold select-none">Overall Verdict</span>
                  <span className="text-[20px] font-black text-emerald-400 block mt-0.5 leading-none">
                    {vd?.overall_verdict?.toUpperCase() || vd?.verdict?.toUpperCase() || 'EVALUATED'}
                  </span>
                </div>
                <div className="space-y-1 text-zinc-400 select-none">
                  <span className="block">• {Object.keys(vd?.agent_scores || {}).length || 0} Council Agents</span>
                  <span className="block">• {diag?.evidence_count || 0} Findings Map</span>
                  <span className="block">• {status?.health?.security_score || 0} Security Score</span>
                </div>
              </div>
            </div>
          </WorkspaceBody>
        </PremiumWorkspaceCard>

        {/* Global spotlight cursor following effect for cards grid */}
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={isMobile}
          enabled={true}
          spotlightRadius={300}
          glowColor="6, 182, 212"
        />

        {/* Premium Bento Grid - Spacing: 24px gap, perfect grid alignment */}
        <BentoCardGrid gridRef={gridRef} style={gridStyle} className="!p-0 !max-w-none">
          {cards.map(card => {
            const Icon = card.icon
            const cardStyle = (isMobile 
              ? { minHeight: '220px', '--glow-color': card.rgb }
              : { ...card.desktopStyle, '--glow-color': card.rgb }) as any

            return (
              <BentoCard
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`magic-bento-card magic-bento-card--border-glow ${card.color} text-left rounded-[18px] p-9 relative flex flex-col justify-between overflow-hidden cursor-pointer group`}
                style={cardStyle}
                glowColor={card.rgb}
                enableTilt={true}
                enableMagnetism={true}
                clickEffect={true}
              >
                {/* Featured Particle Background (Live Intelligence Sparkle) */}
                {card.featured && <LiveIntelligenceParticles />}

                {/* Top Row: Icon + Badges */}
                <div className="flex items-center justify-between w-full relative z-10">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                    <Icon size={18} />
                  </span>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-0.5 rounded border border-white/5 bg-zinc-900 text-zinc-400 font-mono text-[12px] uppercase tracking-wider">
                      {card.badge}
                    </span>
                    {card.scoreChip && (
                      <span className="px-2.5 py-0.5 rounded border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 font-bold uppercase tracking-wider font-mono">
                        {card.scoreChip}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content: Title + Description */}
                <div className="space-y-3 relative z-10 mt-4 flex-1 flex flex-col justify-center">
                  <h3 
                    className="font-extrabold text-white group-hover:text-cyan-300 transition-colors font-display leading-tight line-clamp-2" 
                    style={{ fontSize: card.titleSize }}
                  >
                    {card.title}
                  </h3>
                  <p className="leading-relaxed font-sans text-zinc-400 pr-2 line-clamp-2" style={{ fontSize: '16px' }}>
                    {card.description}
                  </p>
                  
                  {/* Standardized 3-5 Metrics */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-3 border-t border-white/[0.04] text-[12px] font-mono text-zinc-500">
                    {card.keyMetrics.map((met, idx) => (
                      <span key={idx} className="truncate">• {met}</span>
                    ))}
                  </div>
                </div>

                {/* Footer action preview */}
                <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between font-mono relative z-10 mt-4 text-[12px] text-zinc-500">
                  <span>Explore Module</span>
                  <ArrowRight size={14} className="text-cyan-400 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </BentoCard>
            )
          })}
        </BentoCardGrid>

      </div>
    </DashboardSection>
  )
}

export default function OverviewPanel({ projectId }: OverviewPanelProps) {
  return (
    <ErrorBoundary name="Overview Panel">
      <OverviewContent projectId={projectId} />
    </ErrorBoundary>
  )
}
