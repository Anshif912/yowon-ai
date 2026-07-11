import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { AlertTriangle, RefreshCw, Download, Play, WifiOff } from 'lucide-react'
import { 
  useIntelStatus, useArchitectureGraph, useTechnologyGraph, 
  useDependencyGraph, useKnowledgeGraph, useRepositoryStory, useEvaluationReport 
} from './queries'
import { useQueryClient } from '@tanstack/react-query'
import type { RKMModel, RKMEntity, RKMRelationship } from '../../types/rkm'

export interface SelectedEntity {
  id: string
  type: RKMEntity['type']
  label: string
  metadata?: any
}

export interface SharedContextState {
  rkm: RKMModel | null
  selectedEntity: SelectedEntity | null
  setSelectedEntity: (entity: SelectedEntity | null) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  activeLayoutMode: 'logical' | 'physical' | 'runtime'
  setActiveLayoutMode: (mode: 'logical' | 'physical' | 'runtime') => void
  expandedNodes: Set<string>
  toggleExpandedNode: (id: string) => void
  cacheStatus: {
    arch: string
    tech: string
    dep: string
    know: string
    report: string
  }
}

const RepositoryIntelligenceContext = createContext<SharedContextState | undefined>(undefined)

export function useSharedIntelligenceContext() {
  const context = useContext(RepositoryIntelligenceContext)
  if (!context) {
    throw new Error('useSharedIntelligenceContext must be used within a RepositoryIntelligenceWrapper')
  }
  return context
}

interface RepositoryIntelligenceWrapperProps {
  projectId: string
  children: React.ReactNode
}

export function RepositoryIntelligenceWrapper({ projectId, children }: RepositoryIntelligenceWrapperProps) {
  const queryClient = useQueryClient()

  // Eager Query Lifecycle - centrally cache all queries to form the RKM single source of truth
  const { data: statusData, isLoading: isStatusLoading, isError, refetch } = useIntelStatus(projectId)
  const { data: archRaw, isLoading: isArchLoading, error: archErr } = useArchitectureGraph(projectId)
  const { data: techRaw, isLoading: isTechLoading, error: techErr } = useTechnologyGraph(projectId)
  const { data: depRaw, isLoading: isDepLoading, error: depErr } = useDependencyGraph(projectId)
  const { data: knowRaw, isLoading: isKnowLoading, error: knowErr } = useKnowledgeGraph(projectId, '', '', '', '', false)
  const { data: storyRaw } = useRepositoryStory(projectId)
  const { data: reportRaw, isLoading: isReportLoading } = useEvaluationReport(projectId)

  // Context State
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeLayoutMode, setActiveLayoutMode] = useState<'logical' | 'physical' | 'runtime'>('logical')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const toggleExpandedNode = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // Cache hit/miss logging diagnostics helper
  const cacheStatus = useMemo(() => {
    return {
      arch: queryClient.getQueryState(['architecture', projectId])?.status === 'success' ? 'HIT' : 'MISS',
      tech: queryClient.getQueryState(['technology', projectId])?.status === 'success' ? 'HIT' : 'MISS',
      dep: queryClient.getQueryState(['dependency', projectId])?.status === 'success' ? 'HIT' : 'MISS',
      know: queryClient.getQueryState(['knowledge', projectId])?.status === 'success' ? 'HIT' : 'MISS',
      report: queryClient.getQueryState(['report', projectId])?.status === 'success' ? 'HIT' : 'MISS',
    }
  }, [projectId, queryClient, archRaw, techRaw, depRaw, knowRaw, reportRaw])

  // --- Construct Client-Side Repository Knowledge Model (RKM) from Centrally Cached Queries ---
  const rkmModel = useMemo<RKMModel | null>(() => {
    if (!statusData) return null

    const arch = archRaw?.success ? archRaw.data : archRaw
    const tech = techRaw?.success ? techRaw.data : techRaw
    const dep = depRaw?.success ? depRaw.data : depRaw
    const know = knowRaw?.success ? knowRaw.data : knowRaw
    const report = reportRaw
    const vd = report?.verdict_data

    const entities: Record<string, RKMEntity> = {}
    const relationships: RKMRelationship[] = []

    // 1. Process Architecture Nodes
    if (arch?.nodes) {
      arch.nodes.forEach((n: any) => {
        let type: RKMEntity['type'] = 'service'
        const rawType = n.type?.toLowerCase()
        if (rawType === 'database') type = 'database'
        else if (rawType === 'frontend') type = 'subsystem'
        else if (rawType === 'gateway') type = 'controller'
        else if (rawType === 'infrastructure') type = 'deployment'

        entities[n.id] = {
          id: n.id,
          label: n.label,
          type,
          purpose: n.metadata?.description || n.metadata?.purpose || 'Core architecture module.',
          health: n.metadata?.health ?? 90,
          complexity: n.metadata?.complexity ?? 4,
          confidence: n.metadata?.confidence ?? 95,
          evidence: n.metadata?.evidence || n.metadata?.sources || [],
          technologies: n.metadata?.technologies || [],
          dependencies: n.metadata?.dependencies || [],
          files: n.metadata?.files || []
        }
      })
    }

    // 2. Process Tech Nodes
    if (tech?.nodes) {
      tech.nodes.forEach((n: any) => {
        if (!entities[n.id]) {
          entities[n.id] = {
            id: n.id,
            label: n.label,
            type: 'technology',
            purpose: n.metadata?.description || 'Ecosystem tech stack package.',
            health: 95,
            complexity: 2,
            confidence: n.metadata?.confidence || 98,
            evidence: n.metadata?.sources || [],
            technologies: [],
            dependencies: [],
            files: n.metadata?.related_files || []
          }
        }
      })
    }

    // 3. Process Dependency Nodes
    if (dep?.nodes) {
      dep.nodes.forEach((n: any) => {
        if (!entities[n.id]) {
          entities[n.id] = {
            id: n.id,
            label: n.label,
            type: 'package',
            purpose: n.metadata?.description || 'External module dependency.',
            health: 90,
            complexity: 3,
            confidence: 95,
            evidence: [],
            technologies: [],
            dependencies: [],
            files: []
          }
        }
      })
    }

    // 4. Process Knowledge Nodes
    if (know?.nodes) {
      know.nodes.forEach((n: any) => {
        if (!entities[n.id]) {
          let type: RKMEntity['type'] = 'class'
          if (n.type === 'function') type = 'function'
          else if (n.type === 'module') type = 'module'
          else if (n.type === 'subsystem') type = 'subsystem'

          entities[n.id] = {
            id: n.id,
            label: n.label,
            type,
            purpose: n.metadata?.purpose || 'Symbol registry entry.',
            health: n.metadata?.health ?? 90,
            complexity: n.metadata?.complexity ?? 3,
            confidence: 95,
            evidence: n.metadata?.evidence || [],
            technologies: [],
            dependencies: [],
            files: []
          }
        }
      })
    }

    // Process Edges & Types
    const allEdges = [...(arch?.edges || []), ...(tech?.edges || []), ...(dep?.edges || []), ...(know?.edges || [])]
    allEdges.forEach((e: any) => {
      let type: RKMRelationship['type'] = 'DEPENDS_ON'
      const tgtType = entities[e.target]?.type
      if (tgtType === 'database') type = 'READS'
      else if (tgtType === 'technology') type = 'USES'
      else if (tgtType === 'api') type = 'CALLS'

      relationships.push({
        source: e.source,
        target: e.target,
        type,
        label: e.label
      })
    })

    // RKM VALIDATION CHECK (Ensure node entities actually resolved from parser indexes)
    const nodeCount = Object.keys(entities).length
    if (nodeCount === 0 && !isArchLoading && !isTechLoading && !isDepLoading && !isKnowLoading) {
      console.warn('[RKM VALIDATION] Failed. No node entities mapped in RKMModel.');
      return null
    }

    return {
      metadata: {
        projectId,
        name: report?.project_name || statusData?.name || 'Workspace codebase',
        projectType: report?.project_type || 'Unspecified',
        riskLevel: vd?.risk_level || 'Medium',
        overallScore: report?.overall_score || 0,
        confidence: vd?.confidence || 0.8
      },
      entities,
      relationships
    }
  }, [statusData, projectId, archRaw, techRaw, depRaw, knowRaw, reportRaw, isArchLoading, isTechLoading, isDepLoading, isKnowLoading])

  const contextValue: SharedContextState = {
    rkm: rkmModel,
    selectedEntity,
    setSelectedEntity,
    searchQuery,
    setSearchQuery,
    activeLayoutMode,
    setActiveLayoutMode,
    expandedNodes,
    toggleExpandedNode,
    cacheStatus
  }

  // --- Loading: show spinner on initial loader ---
  if (isStatusLoading && !statusData) {
    return (
      <div className="glass-card p-8 border border-white/5 space-y-6 text-center">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <p className="text-xs text-yowon-muted font-mono">Resolving Repository Intelligence status...</p>
      </div>
    )
  }

  // --- API Error: NEVER block children ---
  if (isError) {
    return (
      <RepositoryIntelligenceContext.Provider value={contextValue}>
        <div className="glass-card p-4 border border-amber-500/15 bg-amber-950/[0.015] rounded-xl flex items-center gap-3 mb-4">
          <WifiOff size={16} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300 flex-1">
            Repository Intelligence status could not be reached. Analysis data may be stale or still processing.
          </p>
          <button
            onClick={() => refetch()}
            className="text-xs text-amber-400 hover:text-amber-300 font-mono shrink-0 hover:underline"
          >
            Retry
          </button>
        </div>
        {children}
      </RepositoryIntelligenceContext.Provider>
    )
  }

  // Normalize status to lowercase
  const rawStatus = statusData?.status ?? ''
  const status = rawStatus.toLowerCase()

  const progress = statusData?.progress || 0
  const stage = statusData?.current_stage || 'Initializing static analysis'
  const completedSteps = statusData?.completed_steps || []
  const estRemaining = statusData?.estimated_remaining_seconds ?? 45

  const handleRetry = async () => {
    try {
      queryClient.invalidateQueries({ queryKey: ['intel-status', projectId] })
      queryClient.invalidateQueries({ queryKey: ['repo-tree-root', projectId] })
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const downloadDiagnosticLogs = () => {
    const logData = {
      projectId,
      status: statusData,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `repository_intelligence_diagnostics_${projectId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (status === 'failed') {
    return (
      <div className="glass-card p-8 border border-red-500/20 bg-red-950/[0.02] space-y-6 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-lg text-white">Repository Static Analysis Failed</h3>
            <p className="text-sm text-yowon-muted">
              Static analysis run crashed with an unhandled exception. Only repository intelligence widgets are affected; scoring, verdict, and council reports remain fully functional.
            </p>
            {statusData?.error?.message && (
              <p className="text-xs font-mono text-red-300 bg-red-950/20 border border-red-500/10 p-3 rounded-lg max-h-32 overflow-y-auto whitespace-pre-wrap">
                {statusData.error.message}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleRetry}
            className="yowon-btn-primary flex items-center gap-2 text-xs font-display"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
            Retry Analysis
          </button>
          <button
            onClick={downloadDiagnosticLogs}
            className="glass-pill px-4 py-2 border border-white/10 hover:bg-white/5 text-yowon-muted flex items-center gap-2 text-xs font-mono"
          >
            <Download size={14} />
            Download Diagnostic Logs
          </button>
        </div>
      </div>
    )
  }

  if (status === 'queued' || status === 'running' || status === 'initializing' ||
      status === 'fetching_source' || status === 'indexing' || status === 'running_rules' ||
      status === 'building_architecture' || status === 'calculating_metrics' ||
      status === 'building_graphs' || status === 'writing_cache') {
    return (
      <div className="glass-card p-8 border border-amber-500/20 bg-amber-950/[0.01] rounded-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
              <Play size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-sm">Static Code Intelligence Engine Running</h3>
              <p className="text-[10px] text-amber-400 font-mono mt-0.5">{stage}</p>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-[10px] text-yowon-muted block">EST. REMAINING</span>
            <span className="text-xs text-white font-bold">{estRemaining} seconds</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-yowon-muted">Overall Progress</span>
            <span className="text-amber-300 font-bold">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 border border-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {completedSteps.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-yowon-muted">Completed Stages</p>
            <div className="flex flex-wrap gap-2">
              {completedSteps.map((step: string) => (
                <span key={step} className="glass-pill px-2.5 py-1 border border-emerald-500/10 bg-emerald-500/5 text-emerald-300 text-[10px] font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  {step}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <RepositoryIntelligenceContext.Provider value={contextValue}>
      {children}
    </RepositoryIntelligenceContext.Provider>
  )
}
