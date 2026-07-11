import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react'

interface PipelineStage {
  id: string
  label: string
  description: string
  status: 'complete' | 'running' | 'pending' | 'failed'
  duration?: string
  agent?: string
  color: string
}

interface Props {
  stages?: PipelineStage[]
  height?: number
}

const DEMO_STAGES: PipelineStage[] = [
  { id: 'scan',      label: 'Repository Scan',   description: 'Cloning and reading repository structure', status: 'complete', duration: '1.2s',  agent: 'Scanner',   color: '#3B82F6' },
  { id: 'ast',       label: 'AST Parsing',       description: 'Parsing all source files into syntax trees',status: 'complete', duration: '3.8s',  agent: 'Parser',    color: '#8B5CF6' },
  { id: 'tech',      label: 'Tech Detection',    description: 'Identifying languages, frameworks, tools',  status: 'complete', duration: '0.9s',  agent: 'Detector',  color: '#06B6D4' },
  { id: 'arch',      label: 'Architecture',      description: 'Mapping component relationships and layers', status: 'complete', duration: '2.1s',  agent: 'Forge',     color: '#00E5FF' },
  { id: 'knowledge', label: 'Knowledge Graph',   description: 'Building class / function call graph',      status: 'complete', duration: '4.5s',  agent: 'Mapper',    color: '#A855F7' },
  { id: 'security',  label: 'Security Audit',    description: 'Sentinel scanning for vulnerabilities',     status: 'running',  duration: '—',     agent: 'Sentinel',  color: '#EF4444' },
  { id: 'ai',        label: 'AI Evaluation',     description: 'Multi-agent jury deliberation',             status: 'pending',  duration: '—',     agent: 'Prime',     color: '#EAB308' },
  { id: 'verdict',   label: 'Final Verdict',     description: 'Chief Judge Prime renders binding verdict', status: 'pending',  duration: '—',     agent: 'Prime',     color: '#10B981' },
]

const PACKET_COLORS = ['#00E5FF', '#8B5CF6', '#10B981', '#F97316']

function StatusIcon({ status, color }: { status: string; color: string }) {
  if (status === 'complete') return <CheckCircle2 size={16} style={{ color }} />
  if (status === 'running')  return <Loader2 size={16} style={{ color }} className="animate-spin" />
  if (status === 'failed')   return <AlertCircle size={16} className="text-red-400" />
  return <Circle size={16} className="text-zinc-600" />
}

export default function ExecutionPipeline({ stages, height = 480 }: Props) {
  const pipelineStages = stages || DEMO_STAGES
  const [tick, setTick] = useState(0)
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50)
    return () => clearInterval(id)
  }, [])

  // Running stage index
  const runningIdx = pipelineStages.findIndex(s => s.status === 'running')

  return (
    <div className="flex gap-6" style={{ minHeight: height }}>
      {/* Left: Animated pipeline SVG */}
      <div className="w-32 flex-shrink-0 relative flex flex-col items-center">
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          {/* Main vertical pipe */}
          <line
            x1="50%" y1="20" x2="50%" y2="95%"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2"
          />

          {/* Flowing packets between stages */}
          {pipelineStages.map((stage, i) => {
            if (stage.status !== 'complete' && stage.status !== 'running') return null
            const segmentH = (height - 40) / pipelineStages.length
            const startY = 20 + i * segmentH
            const endY = startY + segmentH

            return PACKET_COLORS.map((pColor, pi) => {
              const progress = ((tick * 0.8 + pi * 30) % 100) / 100
              const y = startY + (endY - startY) * progress
              return (
                <circle
                  key={`${stage.id}-packet-${pi}`}
                  cx="50%"
                  cy={y}
                  r={3}
                  fill={pColor}
                  opacity={stage.status === 'running' ? 0.9 : 0.4}
                />
              )
            })
          })}

          {/* Stage dots on pipe */}
          {pipelineStages.map((stage, i) => {
            const segH = (height - 40) / pipelineStages.length
            const y = 20 + i * segH + segH / 2
            const isActive = stage.status === 'running'
            const color = stage.status === 'complete' ? '#10B981' :
                          stage.status === 'running'  ? stage.color :
                          stage.status === 'failed'   ? '#EF4444' : 'rgba(255,255,255,0.15)'
            return (
              <g key={stage.id}>
                {isActive && (
                  <circle cx="50%" cy={y} r="12" fill={stage.color} opacity="0.15" />
                )}
                <circle cx="50%" cy={y} r="6"
                  fill={color}
                  stroke="rgba(5,7,10,0.9)"
                  strokeWidth="2"
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Right: Stage cards */}
      <div className="flex-1 flex flex-col justify-around gap-1">
        {pipelineStages.map((stage, i) => {
          const isActive = stage.status === 'running'
          const isComplete = stage.status === 'complete'
          const isPending = stage.status === 'pending'
          const isFailed = stage.status === 'failed'

          return (
            <motion.div
              key={stage.id}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                isActive ? 'border-current bg-current/5' :
                isComplete ? 'border-emerald-500/15 bg-emerald-500/[0.03]' :
                isFailed ? 'border-red-500/15 bg-red-500/[0.03]' :
                'border-white/[0.04] bg-white/[0.01]'
              }`}
              style={isActive ? { borderColor: stage.color + '40', background: stage.color + '08' } : {}}
              onClick={() => setSelectedStage(selectedStage?.id === stage.id ? null : stage)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <StatusIcon status={stage.status} color={stage.color} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${
                    isActive ? 'text-white' : isComplete ? 'text-zinc-200' : 'text-zinc-500'
                  }`}>
                    {stage.label}
                  </span>
                  {stage.agent && (
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
                      style={{ color: stage.color, background: stage.color + '15', border: `1px solid ${stage.color}30` }}
                    >
                      {stage.agent}
                    </span>
                  )}
                </div>
                {(isActive || selectedStage?.id === stage.id) && (
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{stage.description}</p>
                )}
              </div>

              {/* Duration */}
              <div className="text-right shrink-0">
                {isActive ? (
                  <span className="text-[9px] font-mono text-current" style={{ color: stage.color }}>
                    RUNNING
                  </span>
                ) : isComplete ? (
                  <span className="text-[9px] font-mono text-emerald-500">{stage.duration}</span>
                ) : isPending ? (
                  <span className="text-[9px] font-mono text-zinc-700">QUEUED</span>
                ) : null}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
