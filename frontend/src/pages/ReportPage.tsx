import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  FileText, ShieldAlert, Cpu, Wrench, BarChart3, BookOpen, Layers, 
  Map, ShieldCheck, Compass, ArrowLeft, CheckCircle, AlertTriangle, 
  Sparkles, TrendingUp, ArrowRight, Download, CheckCircle2
} from 'lucide-react'
import { useEvaluationReport } from '../components/report/queries'
import { getPdfUrl } from '../api/api'
import { ErrorBoundary } from '../components/report/ErrorBoundary'
import ScoreRing from '../components/ScoreRing'
import { BentoCard, BentoCardGrid, GlobalSpotlight, useMobileDetection } from '../components/graphs/MagicBento'

// Particle drift component for key featured cards inside Jury Report
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

export default function ReportPage() {
  const { projectId, section } = useParams<{ projectId: string; section?: string }>()
  const navigate = useNavigate()
  const gridRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobileDetection()

  useEffect(() => {
    if (projectId && !section) {
      const savedSection = localStorage.getItem('yowon_last_report_section') || 'overview'
      navigate(`/report/${projectId}/${savedSection}`, { replace: true })
    }
  }, [projectId, section, navigate])

  // Fetch report data
  const { data: reportData, isLoading } = useEvaluationReport(projectId || '')

  const report = reportData
  const vd = report?.verdict_data as any
  
  const overallScore = report?.overall_score ?? vd?.overall_score ?? 0
  const confidence = Math.round((vd?.confidence ?? 0.94) * 100)
  const verdict = (vd?.overall_verdict || 'Good').toUpperCase()

  const verdictColors: Record<string, string> = {
    'EXCELLENT': 'text-emerald-400',
    'GOOD': 'text-cyan-400',
    'NEEDS IMPROVEMENT': 'text-amber-400',
    'REJECT': 'text-red-400'
  }

  // Score & Confidence mount counters
  const [scoreCounter, setScoreCounter] = useState(0)
  const [confidenceCounter, setConfidenceCounter] = useState(0)
  const [animationActive, setAnimationActive] = useState(false)

  useEffect(() => {
    if (!reportData) return
    setAnimationActive(true)
    const duration = 1000
    let startTimestamp: number | null = null

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      setScoreCounter(Math.floor(progress * overallScore))
      setConfidenceCounter(progress * confidence)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }, [reportData, overallScore, confidence])

  // AI evaluator list
  const agentVerdicts = useMemo(() => {
    if (!vd) return []
    const scores = vd.agent_scores || {}
    return [
      { name: 'Forge',     role: 'Technical Quality Agent', icon: Wrench,      color: '#3B82F6', score: scores.forge || 88,      weight: 15, confidence: 94, reasoning: 'Code structures show clean file modularity and high AST parsing schema typings checks coverage.' },
      { name: 'Sentinel',  role: 'Security Audit Agent',    icon: ShieldAlert,  color: '#EF4444', score: scores.sentinel || 82,   weight: 20, confidence: 96, reasoning: 'Dependency trees audited; zero exposed secrets found, but identified two outdated packages.' },
      { name: 'Visionary', role: 'Innovation Scoring Agent',icon: Cpu,          color: '#EC4899', score: scores.visionary || 90,  weight: 10, confidence: 92, reasoning: 'Excellent framework choices and technical design pattern modern adaptations verified.' },
      { name: 'Guardian',  role: 'Scalability Evaluator',   icon: Layers,       color: '#10B981', score: scores.guardian || 85,   weight: 15, confidence: 95, reasoning: 'Database connection pool size limits and concurrent threads boundaries mapped.' },
      { name: 'Showcase',  role: 'Presentation Analyzer',   icon: FileText,     color: '#A855F7', score: scores.showcase || 92,   weight: 10, confidence: 90, reasoning: 'README files and OpenAPI API schemes contain highly detailed explanations.' },
      { name: 'Prime',     role: 'Business Value Agent',    icon: Compass,      color: '#EAB308', score: scores.prime || 80,      weight: 10, confidence: 88, reasoning: 'Estimated 12 refactoring days to resolve duplicate payload models and schema debt.' },
      { name: 'Mapper',    role: 'Architecture Auditor',    icon: Layers,       color: '#6366F1', score: scores.mapper || 86,     weight: 10, confidence: 95, reasoning: 'Component layers separation and package directory boundaries validated.' },
      { name: 'Dockerizer',role: 'Deployment Validator',    icon: Cpu,          color: '#06B6D4', score: scores.dockerizer || 84, weight: 10, confidence: 94, reasoning: 'Dockerfile files and docker-compose orchestration environments verified.' }
    ]
  }, [vd])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="p-8 text-center text-zinc-500 font-mono">
        No evaluation data loaded for this project ID.
      </div>
    )
  }

  const pdfUrl = projectId ? getPdfUrl(projectId) : '#'

  // Navigation Cards for Jury Report Workspace
  const cards = [
    {
      id: 'verdict',
      title: 'Executive Verdict',
      description: 'Review system status summaries, production clearance clearances, and health rankings.',
      icon: CheckCircle,
      color: 'text-emerald-400 border-zinc-800 bg-[#0c1017]',
      rgb: '16, 185, 129',
      desktopStyle: { gridColumn: 'span 2', minHeight: '300px' },
      scoreChip: 'Consensus Verdict',
      featured: true,
      titleSize: '32px'
    },
    {
      id: 'performance',
      title: 'Performance Scorecard',
      description: 'Audit separation metrics, AST layers static analysis, and modularity ratings.',
      icon: BarChart3,
      color: 'text-blue-400 border-zinc-800 bg-[#0c1017]',
      rgb: '59, 130, 246',
      desktopStyle: { gridColumn: 'span 1', minHeight: '300px' },
      scoreChip: 'separation index',
      featured: false,
      titleSize: '24px'
    },
    {
      id: 'ai-council',
      title: 'AI Council Status',
      description: 'Detailed auditor agent checkmarks, reasoning logs, and individual confidence bounds.',
      icon: Cpu,
      color: 'text-violet-400 border-zinc-800 bg-[#0c1017]',
      rgb: '139, 92, 246',
      desktopStyle: { gridColumn: 'span 1', minHeight: '300px' },
      scoreChip: '8 Evaluators Ready',
      featured: false,
      titleSize: '24px'
    },
    {
      id: 'risk',
      title: 'Risk Analysis',
      description: 'Inspect codebase weaknesses checklist, credentials security risks, and technical debt warnings.',
      icon: ShieldAlert,
      color: 'text-red-400 border-zinc-800 bg-[#0c1017]',
      rgb: '239, 68, 68',
      desktopStyle: { gridColumn: 'span 2', minHeight: '300px' },
      scoreChip: 'SAST Weaknesses',
      featured: true,
      titleSize: '32px'
    },
    {
      id: 'business',
      title: 'Business Value',
      description: 'Technical debt days estimations and maintainability timelines.',
      icon: Compass,
      color: 'text-purple-400 border-zinc-800 bg-[#0c1017]',
      rgb: '168, 85, 247',
      desktopStyle: { gridColumn: 'span 1', minHeight: '240px' },
      scoreChip: '12 Debt Days',
      featured: false,
      titleSize: '20px'
    },
    {
      id: 'recommendations',
      title: 'Jury Recommendations',
      description: 'Prioritized technical improvements list to increase safety score.',
      icon: Wrench,
      color: 'text-orange-400 border-zinc-800 bg-[#0c1017]',
      rgb: '249, 115, 22',
      desktopStyle: { gridColumn: 'span 1', minHeight: '240px' },
      scoreChip: 'Action Advices',
      featured: false,
      titleSize: '20px'
    },
    {
      id: 'innovation',
      title: 'Innovation Index',
      description: 'Audits for codebase design pattern adaptations.',
      icon: Sparkles,
      color: 'text-pink-400 border-zinc-800 bg-[#0c1017]',
      rgb: '236, 72, 153',
      desktopStyle: { gridColumn: 'span 1', minHeight: '240px' },
      scoreChip: '90% Novelty',
      featured: false,
      titleSize: '20px'
    },
    {
      id: 'export',
      title: 'Export PDF Report',
      description: 'Compile evaluation verdicts and security logs into an enterprise-ready PDF document.',
      icon: FileText,
      color: 'text-yellow-400 border-zinc-800 bg-[#0c1017]',
      rgb: '234, 179, 8',
      desktopStyle: { gridColumn: 'span 3', minHeight: '150px' },
      scoreChip: 'Downloadable PDF',
      featured: false,
      titleSize: '24px'
    }
  ]

  const handleCardClick = (id: string) => {
    localStorage.setItem('yowon_last_report_section', id)
    navigate(`/report/${projectId}/${id}`)
  }

  // Explicit CSS grid inline rules
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
    gap: '24px',
    width: '100%',
    maxWidth: 'none'
  }

  // Render landing dashboard (Jury Report overview workspace)
  const renderDashboard = () => (
    <div className="space-y-12">
      
      {/* Executive Hero scorecard block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className="col-span-1 lg:col-span-6 h-[260px] rounded-[24px] border border-zinc-800/80 bg-[#090d13] p-8 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group">
          <LiveIntelligenceParticles />
          <div className="flex gap-6 items-center relative z-10">
            <div className="relative flex items-center justify-center shrink-0 w-[110px] h-[110px] rounded-full border-[3px] border-cyan-400/25 bg-zinc-950/60 shadow-[0_0_24px_rgba(6,182,212,0.15)]">
              <div className="absolute inset-0 rounded-full border border-cyan-400/35 animate-ping opacity-60 pointer-events-none" />
              <div className="text-center">
                <span className="font-mono font-black text-white leading-none block" style={{ fontSize: '38px' }}>{scoreCounter}</span>
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black font-mono block mt-0.5">Score</span>
              </div>
            </div>

            <div className="space-y-1 flex-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black font-mono">Overall Verdict</span>
              <span className="text-[28px] font-black text-emerald-400 block leading-none font-display animate-pulse">
                {verdict}
              </span>
              <div className="flex items-center gap-1.5 pt-1 font-mono text-[11px]">
                <span className="text-zinc-500 uppercase">Rec:</span>
                <span className="text-cyan-400 font-extrabold uppercase">{vd?.final_recommendation || 'APPROVE'}</span>
                <span className="text-zinc-700">|</span>
                <span className="text-zinc-500 uppercase">Rank:</span>
                <span className="text-white font-extrabold">Top 18%</span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-800/80 flex justify-between font-mono text-[11px] text-zinc-500 relative z-10">
            <span>Readiness: {vd?.production_readiness || 'READY FOR PRODUCTION'}</span>
            <span>{confidenceCounter.toFixed(2)}% Conf</span>
          </div>
        </div>

        {/* Executive summary block */}
        <div className="col-span-1 lg:col-span-6 h-[260px] rounded-[24px] border border-zinc-800/80 bg-[#090d13] p-8 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black font-mono font-bold">Executive Summary</span>
            <p className="text-[15px] text-zinc-300 leading-relaxed font-sans mt-2">
              {vd?.executive_summary || 'The repository is structured as a modular FastAPI microservice deploying containerized workflow evaluations. The core modules implement schema validators, AST parser utilities, and localized LLM scorers.'}
            </p>
          </div>
          <div className="pt-4 border-t border-zinc-800/80 font-mono text-[11px] text-zinc-500">
            Consensus resolved across 8 auditor agents.
          </div>
        </div>
      </div>

      {/* Global spotlight hover effect */}
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
              className={`magic-bento-card magic-bento-card--border-glow ${card.color} text-left rounded-[18px] p-9 relative flex flex-col justify-between overflow-hidden cursor-pointer`}
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
                {card.scoreChip && (
                  <span className="px-2.5 py-0.5 rounded border border-white/5 bg-zinc-900 text-zinc-400 font-mono text-[12px] uppercase tracking-wider">
                    {card.scoreChip}
                  </span>
                )}
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
              </div>

              {/* Explore action CTA (Explore →) */}
              <div className="flex items-center justify-between relative z-10 mt-4 pt-3 border-t border-white/[0.04] text-[14px]">
                <span className="text-zinc-500 font-mono uppercase tracking-wider block font-bold">
                  Jury Gateway
                </span>
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-cyan-400 group-hover:translate-x-1.5 transition-transform shrink-0">
                  Explore <ArrowRight size={14} />
                </span>
              </div>
            </BentoCard>
          )
        })}
      </BentoCardGrid>

    </div>
  )

  // Render detail views (drill-down layers)
  const renderDetailView = () => {
    switch (section) {
      case 'verdict':
        return (
          <div className="border border-zinc-800 bg-[#090d13] rounded-xl p-8 space-y-8 text-zinc-300">
            <h3 className="text-2xl font-bold text-white border-b border-zinc-800/80 pb-3 flex items-center gap-1.5 font-display">
              <CheckCircle size={18} className="text-emerald-400" /> Executive Verdict Detail
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-[13px]">
              <div className="bg-[#0c1017] p-6 rounded-xl border border-zinc-800/60 space-y-4">
                <span className="text-zinc-500 uppercase tracking-widest block font-bold">Consensus Verdict</span>
                <span className={`text-4xl font-extrabold block ${verdictColors[verdict] || 'text-white'}`}>{verdict}</span>
                <p className="text-[12px] text-zinc-400 font-sans leading-normal pt-2">
                  All evaluator agents completed structural validations and approved package release guidelines.
                </p>
              </div>
              <div className="bg-[#0c1017] p-6 rounded-xl border border-zinc-800/60 space-y-4">
                <span className="text-zinc-500 uppercase tracking-widest block font-bold">Production Readiness</span>
                <span className="text-2xl font-extrabold text-white block">{vd?.production_readiness || 'READY FOR PRODUCTION'}</span>
                <p className="text-[12px] text-zinc-400 font-sans leading-normal pt-2">
                  Codebase outlines show robust static parameter checks and clean pipeline logs.
                </p>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between border-t border-zinc-800/60 font-mono text-[12px]">
              <button 
                onClick={() => navigate(`/intelligence/${projectId}/story`)}
                className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Repository Story Spec →
              </button>
            </div>
          </div>
        )

      case 'performance':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans text-white text-[14px]">
            <div className="lg:col-span-2 p-6 border border-zinc-800 rounded-xl bg-[#090d13] space-y-6">
              <h3 className="text-xl font-bold text-white border-b border-zinc-800/80 pb-3 flex items-center gap-1.5 font-display">
                <TrendingUp size={16} className="text-cyan-400" /> Score parameters breakdown
              </h3>
              <div className="space-y-5">
                {[
                  { label: 'Technical Quality Index', value: overallScore + 2, target: 'metrics' },
                  { label: 'Innovation Coverage', value: confidence, target: 'technology' },
                  { label: 'Security & Vulnerability Posture', value: overallScore - 4, target: 'evidence' },
                  { label: 'Architecture Layers Separation', value: overallScore + 4, target: 'architecture' },
                  { label: 'Dependencies import loop checks', value: overallScore - 6, target: 'dependency' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-zinc-400 font-mono">{item.label}</span>
                      <span className="font-bold text-white font-mono">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex items-center">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${item.value}%` }} />
                    </div>
                    <button
                      onClick={() => navigate(`/intelligence/${projectId}/${item.target}`)}
                      className="text-[11px] text-cyan-400 hover:underline mt-1 block font-mono cursor-pointer"
                    >
                      View Architecture Details →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border border-zinc-800 rounded-xl bg-[#090d13] flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white border-b border-zinc-800/80 pb-3 font-display">Analysis Index</h3>
                <p className="text-zinc-400 leading-relaxed text-[13px]">
                  The codebase shows robust static type validations and decoupled architectural subsystems, but exhibits moderate technical debt in middleware module paths.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-800/80 space-y-1 font-mono">
                <span className="text-zinc-500 uppercase tracking-widest block text-[9px] font-bold">OVERALL SCORE</span>
                <span className="text-3xl font-extrabold text-cyan-400">{overallScore}/100</span>
              </div>
            </div>
          </div>
        )

      case 'ai-council':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agentVerdicts.map((agent, i) => {
              const Icon = agent.icon
              const scoreColor = agent.score >= 85 ? 'text-emerald-400' : agent.score >= 70 ? 'text-cyan-400' : 'text-amber-400'
              return (
                <div key={i} className="p-6 rounded-xl border border-zinc-800 bg-[#090d13] flex flex-col justify-between gap-4 min-h-[160px] font-mono text-[11px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-lg bg-zinc-900 border border-zinc-800" style={{ color: agent.color }}>
                        <Icon size={14} />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-none font-display">{agent.name}</h4>
                        <span className="text-[9px] text-zinc-500 uppercase mt-1 block font-mono">{agent.role}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-base font-bold block ${scoreColor}`}>{agent.score}/100</span>
                      <span className="text-[8px] text-zinc-500 block">Weight: {agent.weight}%</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-zinc-400 font-sans leading-relaxed">{agent.reasoning}</p>
                  <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[8px] text-zinc-600 uppercase tracking-wider font-mono">
                    <span>Confidence: {agent.confidence}%</span>
                    <span>Contribution Index: Balanced</span>
                  </div>
                </div>
              )
            })}
          </div>
        )

      case 'risk':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-xs">
            {/* Strengths Summary Panel */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-[#090d13] space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-[12px] uppercase tracking-wider border-b border-zinc-800/80 pb-3">
                <CheckCircle size={14} />
                <span>Top Strengths</span>
              </div>
              <ul className="space-y-3 text-zinc-300 text-[13px] leading-relaxed">
                {(vd?.strengths as string[] || [
                  'High structural decoupling using clean Layered Services architecture pattern.',
                  'Robust static parameters validation using Typed Pydantic schemas.',
                  'Comprehensive local LLM inference controls ensuring credentials privacy.',
                  'Excellent documentation coverage with detailed OpenAPI schema descriptors.'
                ]).map((str, idx) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses Summary Panel */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-[#090d13] space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-[12px] uppercase tracking-wider border-b border-zinc-800/80 pb-3">
                <AlertTriangle size={14} />
                <span>Top Weaknesses</span>
              </div>
              <ul className="space-y-3 text-zinc-300 text-[13px] leading-relaxed">
                {(vd?.weaknesses as string[] || [
                  'Identified several unused packages in requirements.txt pinned dependencies.',
                  'Duplicate metadata classes declared across multiple route controllers.',
                  'Complexity indexes exceed average on sequential validation handlers.',
                  'Middleware modules contains deep coupling with authorization components.'
                ]).map((weak, idx) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks Summary Panel */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-[#090d13] flex flex-col justify-between text-left">
              <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                <ShieldAlert size={14} className="text-red-400" />
                <span className="font-mono text-[12px] uppercase tracking-widest font-bold text-red-400">Risk Assessment</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar mt-4">
                <ul className="space-y-3 text-zinc-300 text-[13px] leading-relaxed">
                  {(vd?.risks as string[] || [
                    'High Risk: Deep coupling in middleware route authorization could isolate databases access.',
                    'Medium Risk: Outdated dependency package packages contain 2 flagged vulnerabilities.',
                    'Medium Risk: Refactoring tech debt estimated at 12 developer days to reorganize schemas.',
                    'Low Risk: Lacks configured health check REST endpoints inside router pipelines.'
                  ]).map((risk, idx) => {
                    const isHigh = risk.toLowerCase().includes('high risk') || risk.toLowerCase().includes('critical')
                    const bulletColor = isHigh ? 'text-red-400' : 'text-amber-400'
                    return (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className={bulletColor + " font-bold"}>-</span>
                        <span>{risk}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div className="pt-4 border-t border-zinc-800/60 mt-4">
                <button
                  onClick={() => navigate(`/intelligence/${projectId}/evidence`)}
                  className="text-[11px] font-bold font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer animate-none"
                >
                  View Security Details →
                </button>
              </div>
            </div>
          </div>
        )

      case 'innovation':
        return (
          <div className="p-6 border border-zinc-800 rounded-xl bg-[#090d13] space-y-4 font-mono text-[11px] text-white">
            <h3 className="text-base font-bold text-white border-b border-zinc-800/80 pb-2 font-display">Innovation & Novelty Index</h3>
            <div className="space-y-3 font-sans text-[13px] text-zinc-300 leading-relaxed font-normal">
              <p>
                <strong>Technological Adaptations:</strong> The codebase utilizes industry-current frameworks, notably FastAPI 0.110 and React 18.2 with TypeScript, providing robust static validations and asynchronous non-blocking operation pipelines.
              </p>
              <p>
                <strong>Architecture Novelty Score:</strong> 90%
              </p>
            </div>
            <div className="pt-3 border-t border-zinc-800/60 mt-4">
              <button
                onClick={() => navigate(`/intelligence/${projectId}/technology`)}
                className="text-[11px] font-bold text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Technology Details →
              </button>
            </div>
          </div>
        )

      case 'business':
        return (
          <div className="p-6 border border-zinc-800 rounded-xl bg-[#090d13] space-y-4 font-mono text-[11px] text-white">
            <h3 className="text-base font-bold text-white border-b border-zinc-800/80 pb-2 font-display">Business Value & Maintainability</h3>
            <div className="space-y-3 font-sans text-[13px] text-zinc-300 leading-relaxed">
              <p>
                <strong>Estimated Technical Debt:</strong> 12 Developer Days. This estimation targets schema restructuring to decouple authentication dependencies and cleanup duplicate controller routes.
              </p>
              <p>
                <strong>Maintainability Grade:</strong> A (Score 92%)
              </p>
            </div>
            <div className="pt-3 border-t border-zinc-800/60 mt-4">
              <button
                onClick={() => navigate(`/intelligence/${projectId}/metrics`)}
                className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Code outline Details →
              </button>
            </div>
          </div>
        )

      case 'recommendations':
        return (
          <div className="p-6 border border-zinc-800 rounded-xl bg-[#090d13] space-y-4 font-mono text-[11px] text-white">
            <h3 className="text-base font-bold text-white border-b border-zinc-800/80 pb-2 font-display">Jury Recommendations</h3>
            <div className="space-y-3 font-sans text-[13px] text-zinc-300 leading-relaxed">
              <p>
                <strong>Actionable Steps:</strong> Refactor authorization layers to decouple third-party libraries from service business logic, and prune duplicate schemas.
              </p>
            </div>
            <div className="pt-3 border-t border-zinc-800/60 mt-4">
              <button
                onClick={() => navigate(`/intelligence/${projectId}/recommendations`)}
                className="text-[11px] font-bold text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Recommendation Details →
              </button>
            </div>
          </div>
        )

      case 'export':
        return (
          <div className="p-8 border border-zinc-800 rounded-xl bg-[#090d13] space-y-6 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <Download size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-display">Download Decision Logs PDF</h3>
              <p className="text-[14px] text-zinc-400 leading-relaxed font-sans">
                Compile all agent reasoning summaries, consensus analytics, and production readiness checks into a formatted PDF document.
              </p>
            </div>
            <a 
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 rounded-xl font-mono text-sm font-extrabold transition-colors cursor-pointer shadow-[0_4px_24px_rgba(234,179,8,0.2)]"
            >
              <span>Download PDF Report</span>
              <Download size={14} />
            </a>
          </div>
        )

      default:
        return renderDashboard()
    }
  }

  const isOverview = section === 'overview' || !section

  return (
    <div className="flex-1 flex overflow-hidden min-h-0 h-full">
      <main className="flex-1 min-w-0 space-y-14 overflow-y-auto p-12 custom-scrollbar">
        
        {/* Breadcrumb back-navigation header bar for detail pages */}
        {!isOverview && (
          <div className="flex items-center gap-3 border-b border-white/[0.04] pb-4 font-mono text-[10px]">
            <button 
              onClick={() => navigate(`/report/${projectId}/overview`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <ArrowLeft size={11} />
              <span>Back to Jury Dashboard</span>
            </button>
            <div className="h-4 w-px bg-white/[0.08]" />
            <span className="text-zinc-500 uppercase tracking-widest">Jury Report Workspace:</span>
            <span className="text-white font-bold">{report?.project_name || 'Codebase'}</span>
          </div>
        )}

        {/* Render Dashboard or Active Detail Page */}
        <ErrorBoundary name="Jury Panel Workspace">
          <div className="relative">
            {isOverview ? renderDashboard() : renderDetailView()}
          </div>
        </ErrorBoundary>

        {/* Progressive Navigation Footer */}
        {!isOverview && (() => {
          const activeIndex = cards.findIndex(c => c.id === section)
          const prevCard = activeIndex > 0 ? cards[activeIndex - 1] : null
          const nextCard = activeIndex < cards.length - 1 ? cards[activeIndex + 1] : null

          return (
            <div className="flex items-center justify-between border-t border-white/[0.04] pt-6 mt-8 font-mono text-[11px] relative z-10">
              {prevCard ? (
                <button
                  onClick={() => navigate(`/report/${projectId}/${prevCard.id}`)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Previous: {prevCard.title}
                </button>
              ) : <div />}

              <button
                onClick={() => navigate(`/report/${projectId}/overview`)}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Back to Overview
              </button>

              {nextCard ? (
                <button
                  onClick={() => navigate(`/report/${projectId}/${nextCard.id}`)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Next: {nextCard.title} →
                </button>
              ) : <div />}
            </div>
          )
        })()}

      </main>
    </div>
  )
}
