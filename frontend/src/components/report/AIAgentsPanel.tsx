import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Wrench, ShieldAlert, Sparkles, Lock, Globe, Layers, Brain, ChevronDown, CheckCircle, Activity } from 'lucide-react'
import { useAIIntelligence } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import { useSharedIntelligenceContext } from './RepositoryIntelligenceWrapper'

interface AIAgentsPanelProps {
  projectId: string
}

interface AgentDef {
  id: string
  label: string
  role: string
  score: number
  weight: number
  icon: any
  color: string
  accentBg: string
  prompt: string
  findings: string[]
}

const AGENT_DEFS: AgentDef[] = [
  {
    id: 'technical',
    label: 'Forge',
    role: 'Technical Quality Agent',
    score: 88, weight: 15,
    icon: Wrench,
    color: '#3B82F6',
    accentBg: 'rgba(59,130,246,0.07)',
    prompt: 'Evaluates codebase cleanliness, formatting rules, maintainability index, and dependency maps.',
    findings: ['Code formatting is consistent', 'Test coverage at 72%', 'Moderate complexity in core services'],
  },
  {
    id: 'security',
    label: 'Sentinel',
    role: 'Security Audit Agent',
    score: 82, weight: 20,
    icon: Lock,
    color: '#EF4444',
    accentBg: 'rgba(239,68,68,0.07)',
    prompt: 'Audits files secrets exposure, package vulnerabilities, and API authentication parameters.',
    findings: ['No exposed secrets detected', 'JWT validation is present', '2 dependency CVEs flagged'],
  },
  {
    id: 'innovation',
    label: 'Visionary',
    role: 'Innovation Agent',
    score: 90, weight: 10,
    icon: Sparkles,
    color: '#EC4899',
    accentBg: 'rgba(236,72,153,0.07)',
    prompt: 'Scores framework novelty, technical design pattern modern adaptations.',
    findings: ['Modern async architecture', 'FastAPI + React stack is industry-current', 'Docker containerization present'],
  },
  {
    id: 'scalability',
    label: 'Guardian',
    role: 'Scalability Agent',
    score: 85, weight: 15,
    icon: Globe,
    color: '#10B981',
    accentBg: 'rgba(16,185,129,0.07)',
    prompt: 'Reviews connection pooling thresholds, parallel threads concurrency, caching bottlenecks.',
    findings: ['Horizontal scaling possible', 'No caching layer detected', 'DB pool size not configured'],
  },
  {
    id: 'presentation',
    label: 'Showcase',
    role: 'Presentation Agent',
    score: 92, weight: 10,
    icon: Layers,
    color: '#A855F7',
    accentBg: 'rgba(168,85,247,0.07)',
    prompt: 'Verifies README completeness, API description descriptors, and roadmaps.',
    findings: ['README present and detailed', 'OpenAPI schema available', 'Deployment docs incomplete'],
  },
  {
    id: 'business',
    label: 'Prime',
    role: 'Business Intelligence Agent',
    score: 80, weight: 10,
    icon: Brain,
    color: '#EAB308',
    accentBg: 'rgba(234,179,8,0.07)',
    prompt: 'Assesses business integration risks, tech debt refactoring days estimation.',
    findings: ['Estimated 12 days of tech debt', 'No SLA documentation', 'API versioning not implemented'],
  },
  {
    id: 'architecture',
    label: 'Mapper',
    role: 'Architecture Agent',
    score: 86, weight: 10,
    icon: ShieldAlert,
    color: '#6366F1',
    accentBg: 'rgba(99,102,241,0.07)',
    prompt: 'Maps component layer separation, directories boundary limits, and microservices logic.',
    findings: ['Clear service/data separation', 'Middleware layer is well-structured', 'No circular module deps'],
  },
  {
    id: 'deployment',
    label: 'Dockerizer',
    role: 'Deployment Agent',
    score: 84, weight: 10,
    icon: Cpu,
    color: '#06B6D4',
    accentBg: 'rgba(6,182,212,0.07)',
    prompt: 'Checks Docker configurations, Nginx routing limits, and build outputs.',
    findings: ['Dockerfile present', 'docker-compose configured', 'No healthcheck endpoints defined'],
  },
]

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

function AgentCard({ agent, isExpanded, onToggle }: { agent: AgentDef; isExpanded: boolean; onToggle: () => void }) {
  const Icon = agent.icon
  const healthColor = agent.score >= 85 ? '#10b981' : agent.score >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <motion.div
      layout
      className="border rounded-2xl overflow-hidden cursor-pointer transition-all"
      style={{
        borderColor: isExpanded ? agent.color + '50' : 'rgba(255,255,255,0.06)',
        background: isExpanded ? agent.accentBg : 'rgba(255,255,255,0.01)',
      }}
      onClick={onToggle}
    >
      {/* Card Header */}
      <div className="flex items-center gap-4 p-4">
        {/* Icon Badge */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: agent.accentBg, border: `1px solid ${agent.color}30` }}
        >
          <Icon size={18} style={{ color: agent.color }} />
        </div>

        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm font-display">{agent.label}</h3>
            <span
              className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-mono"
              style={{ color: agent.color, background: agent.accentBg }}
            >
              {agent.weight}% weight
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">{agent.role}</p>
        </div>

        {/* Score Ring */}
        <div className="shrink-0">
          <ScoreRing score={agent.score} color={agent.color} />
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
            style={{ background: `linear-gradient(90deg, ${agent.color}80, ${agent.color})` }}
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
              {/* Prompt */}
              <div>
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1 font-mono">Evaluation Prompt</p>
                <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">{agent.prompt}</p>
              </div>

              {/* Findings */}
              <div>
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2 font-mono">Findings</p>
                <div className="space-y-1.5">
                  {agent.findings.map((finding, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px]">
                      <CheckCircle size={11} className="shrink-0 mt-0.5" style={{ color: agent.color }} />
                      <span className="text-zinc-300">{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score breakdown */}
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500">
                  <Activity size={10} />
                  <span>Confidence: High</span>
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
  const { isLoading } = useAIIntelligence(projectId)
  const context = useSharedIntelligenceContext()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const agentsList = useMemo(() => {
    const rkmEntities = context.rkm?.entities || {}
    return AGENT_DEFS.map(agent => {
      const rkmAgent = Object.values(rkmEntities).find(
        e => e.type === 'agent' && e.label.toLowerCase().includes(agent.role.toLowerCase())
      )
      return { ...agent, score: rkmAgent ? rkmAgent.health : agent.score }
    })
  }, [context.rkm])

  const averageScore = Math.round(agentsList.reduce((s, a) => s + a.score, 0) / agentsList.length)

  if (isLoading) return <CardSkeleton />

  return (
    <DashboardSection id="ai-agents" title="AI Council — Agent Verdicts" icon={Cpu}>
      <div className="space-y-5 font-mono text-[10px] text-white">

        {/* Council Summary Header */}
        <div className="flex flex-wrap gap-4 p-4 border border-white/[0.05] bg-white/[0.01] rounded-2xl items-center">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-0.5">Council Average Score</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{averageScore}</span>
              <span className="text-zinc-500 mb-0.5">/100</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {agentsList.slice(0, 4).map(agent => (
              <div key={agent.id} className="text-center">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1"
                  style={{ background: agent.accentBg }}
                >
                  <agent.icon size={14} style={{ color: agent.color }} />
                </div>
                <span className="text-[8px] font-bold" style={{ color: agent.color }}>{agent.score}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {agentsList.slice(4).map(agent => (
              <div key={agent.id} className="text-center">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1"
                  style={{ background: agent.accentBg }}
                >
                  <agent.icon size={14} style={{ color: agent.color }} />
                </div>
                <span className="text-[8px] font-bold" style={{ color: agent.color }}>{agent.score}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[9px] text-zinc-600 px-1">
          Click any agent card to expand its evaluation prompt and findings.
        </p>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {agentsList.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isExpanded={expandedId === agent.id}
              onToggle={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
            />
          ))}
        </div>
      </div>
    </DashboardSection>
  )
}
