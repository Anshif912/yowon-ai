import React, { useMemo } from 'react'
import { 
  Cpu, Clock, HardDrive, Info, CheckCircle2, 
  AlertTriangle, GitBranch, GitCommit, ShieldAlert, BarChart3, Wifi
} from 'lucide-react'
import { useIntelStatus } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary, PanelErrorFallback } from './ErrorBoundary'
import type { RKMEntity } from '../../types/rkm'
import { useSharedIntelligenceContext } from './RepositoryIntelligenceWrapper'
import PremiumWorkspaceCard, {
  WorkspaceHeader,
  WorkspaceBody,
  WorkspaceFooter
} from './PremiumWorkspaceCard'

interface DiagnosticsPanelProps {
  projectId: string
}

function DiagnosticsContent({ projectId }: { projectId: string }) {
  const { data: statusData, isLoading, isError, error, refetch } = useIntelStatus(projectId)
  const context = useSharedIntelligenceContext()

  // Track client render latency start
  const renderStart = useMemo(() => performance.now(), [])

  if (isLoading) {
    return <CardSkeleton />
  }

  if (isError) {
    return <PanelErrorFallback name="Diagnostics Panel" error={error} refetch={refetch} />
  }

  // Contract normalization
  const rootData = statusData?.data || statusData || {}
  const status = (statusData?.status || rootData?.status || 'unknown').toLowerCase()
  
  const diag = rootData.diagnostics || {}
  const health = rootData.health || {}

  const duration = diag.execution_time_seconds || rootData.execution_duration || 0
  const filesCount = diag.total_files || rootData.files_processed || 0
  const locCount = diag.total_loc || 0
  const commit = rootData.commit_sha || statusData?.commit_sha || 'Unknown'
  const branch = rootData.branch || statusData?.branch || 'main'
  const engineVersion = diag.engine_version || rootData.metadata?.engine_version || '2.0.0'

  const overallHealth: number | null = health.overall ?? health.overall_score ?? health.overall_health ?? null
  const score = overallHealth ?? null

  // Calculate client render time
  const renderDuration = Math.round(performance.now() - renderStart)

  // Count RKM elements
  const rkm = context.rkm
  const entitiesList = rkm ? Object.values(rkm.entities) : []
  const nodeCount = entitiesList.length
  const edgeCount = rkm ? rkm.relationships.length : 0

  const detectedCapabilities = useMemo(() => {
    return entitiesList.filter(e => e.type === 'capability').map(e => e.label)
  }, [entitiesList])

  const missingEntities = useMemo(() => {
    const required: RKMEntity['type'][] = ['service', 'database', 'technology']
    const present = new Set(entitiesList.map(e => e.type))
    return required.filter(r => !present.has(r))
  }, [entitiesList])

  return (
    <DashboardSection id="diagnostics" title="Diagnostics & Telemetry" icon={SettingsIcon}>
      <div className="space-y-6 font-mono text-[10px] text-white select-text">
        
        {/* Header telemetry info */}
        <div className="space-y-1.5 pb-3 border-b border-white/[0.04] text-zinc-500 font-sans select-none">
          Diagnostic logs mapping client cache hits, execution logs, and Software OS model validation.
        </div>

        {/* 1. Model Validation State Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-5 bg-white/[0.01] rounded-xl space-y-3">
            <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block font-bold select-none">RKM Build Diagnostics</span>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Repository Loaded:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={status === 'completed' || status === 'success' || rootData.status ? "text-emerald-400" : "text-amber-400"}>
                    {status === 'completed' || status === 'success' || rootData.status ? 'YES' : 'PENDING'}
                  </span>
                  <span className="text-[8px] text-zinc-650 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">Det</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">RKM Model Built:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-emerald-400">{rkm ? 'YES' : 'NO'}</span>
                  <span className="text-[8px] text-zinc-650 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">Det</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Validation Status:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-emerald-400">{rkm ? 'VERIFIED' : 'FAILED'}</span>
                  <span className="text-[8px] text-amber-500/80 bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">Rule</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white/[0.01] rounded-xl space-y-3">
            <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block font-bold select-none">Model Metrics</span>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">RKM Node Count:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-cyan-350">{nodeCount}</span>
                  <span className="text-[8px] text-violet-400 bg-violet-400/5 border border-violet-400/10 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">KG</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">RKM Edge Count:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-cyan-350">{edgeCount}</span>
                  <span className="text-[8px] text-violet-400 bg-violet-400/5 border border-violet-400/10 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">KG</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Confidence Ratio:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-cyan-350">{rootData.confidence ? `${rootData.confidence}%` : '—'}</span>
                  <span className="text-[8px] text-amber-500/80 bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">Rule</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white/[0.01] rounded-xl space-y-3">
            <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block font-bold select-none">Query Cache Telemetry</span>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Architecture:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-cyan-350">{context.cacheStatus.arch}</span>
                  <span className="text-[8px] text-zinc-650 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">Det</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Technology:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-cyan-350">{context.cacheStatus.tech}</span>
                  <span className="text-[8px] text-zinc-650 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">Det</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Dependency:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-cyan-350">{context.cacheStatus.dep}</span>
                  <span className="text-[8px] text-zinc-650 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">Det</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 2. Pipeline Metadata and Render Latencies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Engine Parameters */}
          <div className="p-5 bg-white/[0.01] rounded-xl space-y-3">
            <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block font-bold select-none">Analysis Engine Parameters</span>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Backend API Status:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={statusData ? "text-emerald-400 flex items-center gap-1" : "text-amber-400 flex items-center gap-1"}>
                    <Wifi size={10} />
                    {statusData ? 'CONNECTED (200 OK)' : 'UNAVAILABLE'}
                  </span>
                  <span className="text-[8px] text-zinc-650 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">Det</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Total lines of code:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-zinc-300">{locCount > 0 ? locCount.toLocaleString() : '—'} LOC</span>
                  <span className="text-[8px] text-cyan-400 bg-cyan-400/5 border border-cyan-400/10 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">AST</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Files parsed count:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-zinc-300">{filesCount > 0 ? filesCount : '—'} Files</span>
                  <span className="text-[8px] text-cyan-400 bg-cyan-400/5 border border-cyan-400/10 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">AST</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Engine Version:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-zinc-300">v{engineVersion}</span>
                  <span className="text-[8px] text-zinc-650 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">Det</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance durations */}
          <div className="p-5 bg-white/[0.01] rounded-xl space-y-3">
            <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block font-bold select-none">Performance & Latency</span>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Backend static scan time:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-zinc-300">{duration > 0 ? `${duration.toFixed(2)}s` : '—'}</span>
                  <span className="text-[8px] text-zinc-650 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">Det</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Client-side render duration:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-cyan-300">{renderDuration}ms</span>
                  <span className="text-[8px] text-zinc-650 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">Det</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Repository Branch Sha:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-zinc-500 font-mono text-[9px] truncate max-w-[150px]">{commit.slice(0, 7)} [{branch}]</span>
                  <span className="text-[8px] text-zinc-650 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-normal uppercase tracking-wider font-mono select-none">Det</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 3. Capabilities and missing entities logs */}
        <div className="p-5 bg-white/[0.01] rounded-xl space-y-3">
          <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block font-bold select-none">Semantic Entity Audits</span>
          
          <div className="space-y-2 font-sans text-zinc-400 text-[9.5px]">
            <div>
              <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Detected Capabilities</span>
              {detectedCapabilities.length === 0 ? (
                <span>Repository Intelligence not yet available</span>
              ) : (
                <span>{detectedCapabilities.join(', ')}</span>
              )}
            </div>

            <div className="pt-1.5 border-t border-white/[0.04]">
              <span className="text-[8.5px] font-mono text-zinc-555 uppercase tracking-widest block mb-1">Missing Entities</span>
              {missingEntities.length === 0 ? (
                <span className="text-emerald-400 font-mono">None. Core types (Service, Database, Technology) successfully indexed.</span>
              ) : (
                <span className="text-amber-400 font-mono">{missingEntities.join(', ')} missing.</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </DashboardSection>
  )
}

function SettingsIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function DiagnosticsPanel({ projectId }: DiagnosticsPanelProps) {
  return (
    <ErrorBoundary name="Diagnostics Panel">
      <DiagnosticsContent projectId={projectId} />
    </ErrorBoundary>
  )
}
