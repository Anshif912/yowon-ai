import { useState, useEffect, useMemo } from 'react'
import { Cpu, Activity, Play, CheckCircle, ShieldAlert, Clock, AlertTriangle, Code } from 'lucide-react'
import { useExecutionIntelligence } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import { useSharedIntelligenceContext } from './RepositoryIntelligenceWrapper'

interface ExecutionFlowPanelProps {
  projectId: string
}

interface Step {
  name: string
  status: 'complete' | 'running' | 'pending' | 'failed'
  duration: string
  logs: string[]
  warnings?: string[]
}

export default function ExecutionFlowPanel({ projectId }: ExecutionFlowPanelProps) {
  return (
    <ErrorBoundary name="Execution Flow Panel">
      <ExecutionFlowContent projectId={projectId} />
    </ErrorBoundary>
  )
}

function ExecutionFlowContent({ projectId }: { projectId: string }) {
  const { data: execData, isLoading } = useExecutionIntelligence(projectId)
  const context = useSharedIntelligenceContext()
  const [activeStepIdx, setActiveStepIdx] = useState(0)
  const [flowTick, setFlowTick] = useState(0)

  // Load and map pipeline steps
  const steps: Step[] = useMemo(() => {
    const data = execData?.success ? execData.data : execData
    const items = data?.steps || [
      { name: 'Repository Upload', status: 'complete', duration: '0.8s', logs: ['Received repository ZIP package archive successfully.'] },
      { name: 'Repository Scan', status: 'complete', duration: '1.2s', logs: ['Iterating file indices.', 'Located 124 files.'] },
      { name: 'Language Detection', status: 'complete', duration: '0.4s', logs: ['Detected TypeScript (62%) and Python (38%).'] },
      { name: 'Framework Detection', status: 'complete', duration: '0.6s', logs: ['FastAPI server patterns matched.', 'React SPA modules identified.'] },
      { name: 'AST Parsing', status: 'complete', duration: '2.4s', logs: ['Traversing source files syntax trees.', 'Compiled symbol references registry.'] },
      { name: 'Semantic Indexing', status: 'complete', duration: '1.8s', logs: ['Mapping classes, functions, and imports coupling limits.'] },
      { name: 'Architecture Analysis', status: 'complete', duration: '1.1s', logs: ['Reconciling logical tracks mapping (Frontend -> Gateway -> Backend).'] },
      { name: 'Dependency Analysis', status: 'complete', duration: '0.9s', logs: ['Checking circular packages loops and hotspot files.'] },
      { name: 'Knowledge Graph', status: 'complete', duration: '1.4s', logs: ['Constructing radial symbol trees representation.'] },
      { name: 'Security Analysis', status: 'complete', duration: '2.1s', logs: ['Sentinel static rules scanning verified.', 'No critical exposures found.'] },
      { name: 'AI Agent Evaluation', status: 'complete', duration: '3.8s', logs: ['Syncing CrewAI evaluator council.', 'Technical, Security, Innovation agents completed scoring.'] },
      { name: 'Verdict Generation', status: 'complete', duration: '0.5s', logs: ['Chief Judge Prime reconciled final overall health score.'] },
      { name: 'Report Compilation', status: 'complete', duration: '0.8s', logs: ['Compiling JSON results.', 'Diagnostic report generated successfully.'] }
    ]
    return items as Step[]
  }, [execData])

  // Packet animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setFlowTick(t => t + 1)
    }, 40)
    return () => clearInterval(interval)
  }, [])

  const currentStep = steps[activeStepIdx] || steps[0]

  if (isLoading) return <CardSkeleton />

  return (
    <DashboardSection
      id="execution"
      title="Execution Flow"
      icon={Activity}
    >
      <div className="text-[10px] text-zinc-500 font-sans pb-2">
        How does a request travel through the system? Traces pipeline processing stages.
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-[10px] text-white">
        
        {/* Left Side: Animated pipeline path (5 cols) */}
        <div className="lg:col-span-5 border border-white/[0.05] bg-white/[0.01] rounded-2xl p-5 flex gap-4 min-h-[380px] relative overflow-hidden">
          
          {/* animated packets SVG */}
          <div className="w-12 shrink-0 relative flex flex-col items-center">
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <line x1="50%" y1="12" x2="50%" y2="96%" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
              {/* Animated flow dots */}
              {Array.from({ length: 4 }).map((_, pi) => {
                const progress = ((flowTick * 0.7 + pi * 40) % 100) / 100
                const y = 12 + (400 - 24) * progress
                return (
                  <circle
                    key={pi}
                    cx="50%"
                    cy={y}
                    r={3}
                    fill="#00e5ff"
                    opacity="0.6"
                    className="pipeline-packet"
                  />
                )
              })}
              {/* Stage indicator bubbles */}
              {steps.map((s, idx) => {
                const y = 12 + idx * ((380 - 24) / steps.length)
                const isSelected = activeStepIdx === idx
                return (
                  <circle
                    key={idx}
                    cx="50%"
                    cy={y}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? '#00e5ff' : 'rgba(255,255,255,0.15)'}
                    stroke="#05070a"
                    strokeWidth="2"
                  />
                )
              })}
            </svg>
          </div>

          {/* Step titles list */}
          <div className="flex-1 flex flex-col justify-between py-1">
            {steps.map((step, idx) => (
              <div
                key={step.name}
                onClick={() => setActiveStepIdx(idx)}
                className={`flex justify-between items-center cursor-pointer transition-colors ${
                  activeStepIdx === idx ? 'text-cyan-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>{step.name}</span>
                <span className="text-[8px] opacity-80">{step.duration}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Right Side: Step logs terminal console (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 border border-white/[0.05] bg-black/40 rounded-2xl p-5 min-h-[380px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.05] shrink-0">
            <div className="flex items-center gap-2">
              <Code size={14} className="text-cyan-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{currentStep?.name} Logs</h4>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider">{currentStep?.status}</span>
          </div>

          {/* Console logs */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[9px] text-zinc-400 leading-relaxed custom-scrollbar">
            {currentStep?.logs?.map((log, lIdx) => (
              <div key={lIdx} className="flex gap-2.5 items-start">
                <span className="text-zinc-600 shrink-0">[{lIdx + 1}]</span>
                <span className="break-all">{log}</span>
              </div>
            )) || <p className="italic text-zinc-600">No logs reported for this stage.</p>}
          </div>

        </div>

      </div>
    </DashboardSection>
  )
}
