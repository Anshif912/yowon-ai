import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Wrench, ShieldAlert, Sparkles, Lock, Globe, Layers, Brain, ChevronDown, CheckCircle, Activity, AlertCircle } from 'lucide-react'
import { useCouncilScores } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'

interface AIAgentsPanelProps {
  projectId: string
}

interface ScoreBreakdownItem {
  label: string
  delta: number
  source: string
}

interface ScoreFormulaItem {
  dimension: string
  weight_pct: number
}

interface CouncilAgent {
  score: number
  reason: string
  confidence: number  
  findings: string[]
  metrics_used: string[]
  score_breakdown?: ScoreBreakdownItem[]
  score_formula?: ScoreFormulaItem[]
}

interface CouncilScoresData {
  council_overall: number
  weights: Record<string, number>
  agents: Record<string, CouncilAgent>
  data_quality: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE'
}

const AGENT_UI_META: Record<string, {label: string; role: string; icon: any; color: string; accentBg: string; weight: number}> = {
  forge: { label: 'Forge', role: 'Technical Quality Agent', icon: Wrench, color: '#3B82F6', accentBg: 'rgba(59,130,246,0.07)', weight: 0.25 },
  sentinel: { label: 'Sentinel', role: 'Security Audit Agent', icon: Lock, color: '#EF4444', accentBg: 'rgba(239,68,68,0.07)', weight: 0.20 },
  guardian: { label: 'Guardian', role: 'Scalability Agent', icon: Globe, color: '#10B981', accentBg: 'rgba(16,185,129,0.07)', weight: 0.15 },
  visionary: { label: 'Visionary', role: 'Innovation Agent', icon: Sparkles, color: '#EC4899', accentBg: 'rgba(236,72,153,0.07)', weight: 0.15 },
  prime: { label: 'Prime', role: 'Business Intelligence Agent', icon: Brain, color: '#EAB308', accentBg: 'rgba(234,179,8,0.07)', weight: 0.15 },
  showcase: { label: 'Showcase', role: 'Documentation Agent', icon: Layers, color: '#A855F7', accentBg: 'rgba(168,85,247,0.07)', weight: 0.10 },
}

export function AIAgentsPanel({ projectId }: AIAgentsPanelProps) {
  return (
    <ErrorBoundary name="AI Agents Panel">
      <AIAgentsContent projectId={projectId} />
    </ErrorBoundary>
  )
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 22
  const circumference = 2 * Math.PI * r
  const dash = (score / 100) * circumference
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
      <circle
        cx="28" cy="28" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
      />
      <text x="28" y="32" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">{score}</text>
    </svg>
  )
}

function AgentCard({ id, agent, weight, isExpanded, onToggle }: { id: string, agent: CouncilAgent; weight: number; isExpanded: boolean; onToggle: () => void }) {
  const meta = AGENT_UI_META[id] || { label: id, role: 'Agent', icon: ShieldAlert, color: '#6366F1', accentBg: 'rgba(99,102,241,0.07)', weight: 0 }
  const Icon = meta.icon
  const healthColor = agent.score >= 85 ? '#10b981' : agent.score >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <motion.div
      layout
      className="rounded-xl overflow-hidden cursor-pointer transition-all border border-transparent"
      style={{
        borderLeft: `3px solid ${isExpanded ? meta.color : 'transparent'}`,
        background: isExpanded ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
      }}
      onClick={onToggle}
    >
      {/* Card Header */}
      <div className="flex items-center gap-4 p-4">
        {/* Icon Badge */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: meta.accentBg, border: `1px solid ${meta.color}30` }}
        >
          <Icon size={18} style={{ color: meta.color }} />
        </div>

        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm font-display">{meta.label}</h3>
            <span
              className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-mono"
              style={{ color: meta.color, background: meta.accentBg }}
            >
              {(weight * 100).toFixed(0)}% weight
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">{meta.role}</p>
        </div>

        {/* Score Ring */}
        <div className="shrink-0">
          <ScoreRing score={agent.score} color={meta.color} />
        </div>

        {/* Expand chevron */}
        <ChevronDown
          size={14}
          className="shrink-0 text-zinc-600 transition-transform"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>

      {/* Score bar */}
      <div className="px-4 pb-3">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${meta.color}80, ${meta.color})` }}
            initial={{ width: 0 }}
            animate={{ width: `${agent.score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05] pt-3">
              {/* Reason */}
              <div>
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1 font-mono">Evaluation Reason</p>
                <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">{agent.reason}</p>
              </div>

              {/* Findings */}
              {agent.findings && agent.findings.length > 0 && (
                <div>
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2 font-mono">Findings</p>
                  <div className="space-y-1.5">
                    {agent.findings.map((finding, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px]">
                        <CheckCircle size={11} className="shrink-0 mt-0.5" style={{ color: meta.color }} />
                        <span className="text-zinc-300">{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Breakdown (Why X?) */}
              {agent.score_breakdown && agent.score_breakdown.length > 0 && (
                <div className="border-t border-white/[0.04] pt-2.5">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Score Breakdown (Why {agent.score}?)</p>
                  <div className="space-y-1">
                    {agent.score_breakdown.map((item, i) => {
                      const isPositive = item.delta >= 0
                      return (
                        <div key={i} className="flex items-center justify-between text-[10px] bg-white/[0.01] px-2.5 py-1.5 border border-white/[0.03] rounded-xl font-mono">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'}`}>
                              {isPositive ? '+' : ''}{item.delta}
                            </span>
                            <span className="text-zinc-300 font-sans">{item.label}</span>
                          </div>
                          {item.source && (
                            <span className="text-[8px] bg-white/[0.03] border border-white/[0.05] text-zinc-500 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider scale-90">
                              {item.source}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Score Formula */}
              {agent.score_formula && agent.score_formula.length > 0 && (
                <div className="border-t border-white/[0.04] pt-2.5">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Scoring Formula Weights</p>
                  <div className="flex gap-2">
                    {agent.score_formula.map((f, i) => (
                      <div key={i} className="flex-1 bg-white/[0.01] border border-white/[0.03] rounded-xl p-2 text-center font-mono">
                        <span className="text-[9px] text-zinc-300 block truncate" title={f.dimension}>{f.dimension}</span>
                        <span className="text-[9px] text-zinc-500 mt-0.5 block">{f.weight_pct}% weight</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score breakdown summary */}
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500">
                  <Activity size={10} />
                  <span>Confidence: {agent.confidence?.toFixed(0) ?? 0}%</span>
                </div>
                <span className="text-[9px] font-mono" style={{ color: healthColor }}>
                  {agent.score}/100 — {agent.score >= 85 ? 'Excellent' : agent.score >= 70 ? 'Good' : 'Needs Work'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AIAgentsContent({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useCouncilScores(projectId)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (isLoading) return <CardSkeleton />

  const councilData = data?.data as CouncilScoresData | undefined
  const agents = councilData?.agents || {}
  const agentIds = Object.keys(agents)

  if (error || !councilData || agentIds.length === 0) {
    return (
      <DashboardSection id="ai-agents" title="AI Council — Agent Verdicts" icon={Cpu}>
        <div className="p-8 border border-dashed border-white/[0.05] rounded-2xl flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-8 h-8 text-zinc-600 mb-3" />
          <p className="text-sm text-zinc-400 font-medium">Council analysis unavailable</p>
          <p className="text-xs text-zinc-500 mt-1">Run evaluation to generate scores</p>
        </div>
      </DashboardSection>
    )
  }

  const averageScore = councilData.council_overall ?? 0

  return (
    <DashboardSection id="ai-agents" title="AI Council — Agent Verdicts" icon={Cpu}>
      <div className="space-y-5 font-mono text-[10px] text-white">

        {/* Council Summary Header */}
        <div className="flex flex-wrap gap-4 p-5 bg-white/[0.02] rounded-xl items-center">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-0.5">Council Average Score</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{averageScore}</span>
              <span className="text-zinc-500 mb-0.5">/100</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-end flex-1">
            {agentIds.map(id => {
              const agent = agents[id]
              const meta = AGENT_UI_META[id] || { icon: ShieldAlert, color: '#6366F1', accentBg: 'rgba(99,102,241,0.07)' }
              const Icon = meta.icon
              return (
                <div key={id} className="text-center">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1"
                    style={{ background: meta.accentBg }}
                  >
                    <Icon size={14} style={{ color: meta.color }} />
                  </div>
                  <span className="text-[8px] font-bold" style={{ color: meta.color }}>{agent.score}</span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-[9px] text-zinc-600 px-1">
          Click any agent card to expand its evaluation findings.
        </p>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {agentIds.map(id => (
            <AgentCard
              key={id}
              id={id}
              agent={agents[id]}
              weight={councilData.weights?.[id] ?? AGENT_UI_META[id]?.weight ?? 0}
              isExpanded={expandedId === id}
              onToggle={() => setExpandedId(expandedId === id ? null : id)}
            />
          ))}
        </div>
      </div>
    </DashboardSection>
  )
}
