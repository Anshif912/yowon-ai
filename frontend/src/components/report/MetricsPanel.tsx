import React, { useState, useMemo } from 'react'
import { 
  FileText, BarChart3, Folder, HelpCircle, AlertTriangle, 
  Code, ShieldAlert, Cpu, Sparkles, Search, SlidersHorizontal
} from 'lucide-react'
import { useMetrics } from './queries'
import { DashboardSection } from './DashboardSection'
import { MetricsSkeleton } from './Skeletons'
import { ErrorBoundary, PanelErrorFallback } from './ErrorBoundary'
import { RepositoryIntelligenceWrapper } from './RepositoryIntelligenceWrapper'
import PremiumWorkspaceCard, {
  WorkspaceHeader,
  WorkspaceBody,
  WorkspaceFooter
} from './PremiumWorkspaceCard'

interface MetricsPanelProps {
  projectId: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getLanguageName(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || 'unknown'
  const map: Record<string, string> = {
    py: 'Python',
    js: 'JavaScript',
    ts: 'TypeScript',
    tsx: 'TypeScript (React)',
    jsx: 'JavaScript (React)',
    go: 'Go',
    rs: 'Rust',
    java: 'Java',
    cs: 'C#',
    cpp: 'C++',
    c: 'C',
    h: 'C/C++ Header',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    md: 'Markdown',
    sh: 'Shell',
    yml: 'YAML',
    yaml: 'YAML',
    dockerfile: 'Docker'
  }
  return map[ext] || ext.toUpperCase()
}

function getLanguageColor(lang: string): string {
  const colors: Record<string, string> = {
    Python: 'bg-blue-500',
    JavaScript: 'bg-yellow-400',
    TypeScript: 'bg-sky-500',
    'TypeScript (React)': 'bg-cyan-400',
    'JavaScript (React)': 'bg-amber-400',
    Go: 'bg-emerald-400',
    Rust: 'bg-orange-500',
    Java: 'bg-red-500',
    'C#': 'bg-violet-500',
    HTML: 'bg-orange-400',
    CSS: 'bg-pink-400',
    JSON: 'bg-slate-400',
    Docker: 'bg-blue-600'
  }
  return colors[lang] || 'bg-slate-500'
}

function MetricsContent({ projectId }: { projectId: string }) {
  const { data: metricsData, isLoading, isError, error, refetch } = useMetrics(projectId)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [langFilter, setLangFilter] = useState('ALL')
  const [riskFilter, setRiskFilter] = useState('ALL')

  const metricsMap = useMemo(() => {
    const payload = metricsData?.success ? metricsData.data : metricsData
    return payload?.metrics || payload || {}
  }, [metricsData])

  // 1. Calculate codebase-wide statistics
  const stats = useMemo(() => {
    const entries = Object.entries(metricsMap)
    if (entries.length === 0) return null

    let totalLoc = 0
    let totalSizeBytes = 0
    let totalFunctions = 0
    let totalClasses = 0
    let totalComplexity = 0
    
    let largestFile = { path: '', loc: 0 }
    let mostComplexFile = { path: '', complexity: 0 }
    let deepestPath = { path: '', depth: 0 }

    const langCounts: Record<string, { loc: number; count: number }> = {}

    entries.forEach(([path, fileData]: [string, any]) => {
      const loc = fileData.loc || 0
      const sizeBytes = fileData.size_bytes || 0
      const cyclo = fileData.complexity?.cyclomatic_complexity || 1
      const funcs = fileData.complexity?.function_count || 0
      const cls = fileData.complexity?.class_count || 0

      totalLoc += loc
      totalSizeBytes += sizeBytes
      totalFunctions += funcs
      totalClasses += cls
      totalComplexity += cyclo

      // Largest file
      if (loc > largestFile.loc) {
        largestFile = { path, loc }
      }

      // Most complex file
      if (cyclo > mostComplexFile.complexity) {
        mostComplexFile = { path, complexity: cyclo }
      }

      // Deepest path
      const depth = path.split('/').length
      if (depth > deepestPath.depth) {
        deepestPath = { path, depth }
      }

      // Language counts
      const lang = getLanguageName(path)
      if (!langCounts[lang]) {
        langCounts[lang] = { loc: 0, count: 0 }
      }
      langCounts[lang].loc += loc
      langCounts[lang].count += 1
    })

    const avgComplexity = totalComplexity / entries.length
    const avgFileSize = totalSizeBytes / entries.length

    // Sort languages by LOC desc
    const languages = Object.entries(langCounts)
      .map(([name, data]) => ({
        name,
        loc: data.loc,
        count: data.count,
        percentage: totalLoc > 0 ? (data.loc / totalLoc) * 100 : 0
      }))
      .sort((a, b) => b.loc - a.loc)

    return {
      totalFiles: entries.length,
      totalLoc,
      totalSizeBytes,
      totalFunctions,
      totalClasses,
      totalComplexity,
      avgComplexity,
      avgFileSize,
      largestFile,
      mostComplexFile,
      deepestPath,
      languages
    }
  }, [metricsMap])

  // Filtered files list
  const filteredFiles = useMemo(() => {
    return Object.entries(metricsMap).filter(([path, data]: [string, any]) => {
      const matchesSearch = path.toLowerCase().includes(searchTerm.toLowerCase())
      
      const lang = getLanguageName(path)
      const matchesLang = langFilter === 'ALL' || lang === langFilter
      
      const risk = data.risk || 10
      let matchesRisk = true
      if (riskFilter === 'HIGH') matchesRisk = risk >= 60
      else if (riskFilter === 'MEDIUM') matchesRisk = risk >= 30 && risk < 60
      else if (riskFilter === 'LOW') matchesRisk = risk < 30

      return matchesSearch && matchesLang && matchesRisk
    })
  }, [metricsMap, searchTerm, langFilter, riskFilter])

  if (isLoading) {
    return <MetricsSkeleton />
  }

  if (isError) {
    return <PanelErrorFallback name="Code Metrics" error={error} refetch={refetch} />
  }

  if (!stats) {
    return (
      <DashboardSection id="metrics" title="Code Metrics" icon={FileText}>
        <PremiumWorkspaceCard accent="business" className="!p-16 text-center select-none">
          <WorkspaceBody>
            <p className="text-sm text-zinc-500 font-mono">No metrics logs are available for this codebase.</p>
          </WorkspaceBody>
        </PremiumWorkspaceCard>
      </DashboardSection>
    )
  }

  return (
    <DashboardSection id="metrics" title="Code Metrics" icon={FileText}>
      <div className="space-y-6 select-text">
        
        {/* Row 1: Calculated KPI statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white/[0.01] rounded-xl space-y-2">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block font-bold select-none">Total Files</span>
            <span className="text-xl font-bold text-white block mt-1 font-display leading-none">{stats.totalFiles} files</span>
            <span className="text-[9px] text-zinc-500 font-mono block mt-2 select-none">Avg Size: {formatBytes(stats.avgFileSize)}</span>
          </div>

          <div className="p-5 bg-white/[0.01] rounded-xl space-y-2">
            <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-wider block font-bold select-none">Lines of Code (LOC)</span>
            <span className="text-xl font-bold text-white block mt-1 font-display leading-none">{stats.totalLoc.toLocaleString()}</span>
            <span className="text-[9px] text-zinc-500 font-mono block mt-2 select-none">Total size: {formatBytes(stats.totalSizeBytes)}</span>
          </div>

          <div className="p-5 bg-white/[0.01] rounded-xl space-y-2">
            <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-wider block font-bold select-none">Average Complexity</span>
            <span className="text-xl font-bold text-white block mt-1 font-display leading-none">{stats.avgComplexity.toFixed(2)}</span>
            <span className="text-[9px] text-zinc-500 font-mono block mt-2 select-none">Total Cyclomatic: {stats.totalComplexity}</span>
          </div>

          <div className="p-5 bg-white/[0.01] rounded-xl space-y-2">
            <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-wider block font-bold select-none">AST Scope Metrics</span>
            <span className="text-xl font-bold text-white block mt-1 font-display leading-none">
              {stats.totalFunctions} / {stats.totalClasses}
            </span>
            <span className="text-[9px] text-zinc-500 font-mono block mt-2 select-none">Functions / Classes defined</span>
          </div>
        </div>

        {/* Row 2: Language breakdown bar */}
        <div className="p-5 bg-white/[0.01] rounded-xl space-y-4">
          <p className="text-[8.5px] font-mono uppercase tracking-[0.25em] text-zinc-500 font-bold">Language Breakdown</p>
          {/* Stacked bar */}
          <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden flex select-none">
            {stats.languages.map((l) => (
              <div 
                key={l.name}
                className={`h-full ${getLanguageColor(l.name)}`}
                style={{ width: `${l.percentage}%` }}
                title={`${l.name}: ${l.percentage.toFixed(1)}%`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 select-none">
            {stats.languages.map((l) => (
              <div key={l.name} className="flex items-center gap-2 text-[10px] font-mono">
                <span className={`w-2 h-2 rounded-full ${getLanguageColor(l.name)}`} />
                <span className="text-white font-bold">{l.name}</span>
                <span className="text-zinc-500 font-bold">({l.percentage.toFixed(1)}%, {l.count} files)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Structure anomalies */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-white/[0.01] rounded-xl space-y-2">
            <span className="text-[10px] text-zinc-550 font-mono uppercase block font-bold select-none">Largest File</span>
            <p className="text-xs font-bold text-white truncate leading-snug" title={stats.largestFile.path}>{stats.largestFile.path.split('/').pop()}</p>
            <p className="text-[10px] text-cyan-300 font-mono font-bold mt-1 select-none">{stats.largestFile.loc} Lines of Code</p>
          </div>

          <div className="p-5 bg-white/[0.01] rounded-xl space-y-2">
            <span className="text-[10px] text-zinc-550 font-mono uppercase block font-bold select-none">Most Complex File</span>
            <p className="text-xs font-bold text-white truncate leading-snug" title={stats.mostComplexFile.path}>{stats.mostComplexFile.path.split('/').pop()}</p>
            <p className="text-[10px] text-amber-400 font-mono font-bold mt-1 select-none">Cyclomatic Complexity: {stats.mostComplexFile.complexity}</p>
          </div>

          <div className="p-5 bg-white/[0.01] rounded-xl space-y-2">
            <span className="text-[10px] text-zinc-550 font-mono uppercase block font-bold select-none">Deepest Directory</span>
            <p className="text-xs font-bold text-white truncate leading-snug" title={stats.deepestPath.path}>{stats.deepestPath.path.split('/').slice(-3).join('/')}</p>
            <p className="text-[10px] text-indigo-400 font-mono font-bold mt-1 select-none">Depth: {stats.deepestPath.depth} folder levels</p>
          </div>
        </div>

        {/* Row 4: Searchable file explorer metrics table */}
        <div className="p-5 bg-white/[0.01] rounded-xl space-y-4">
          <p className="text-[8.5px] font-mono uppercase tracking-[0.25em] text-zinc-500 font-bold">Full File Metrics Registry</p>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/[0.04] select-none">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full justify-between">
              <div className="relative flex-1 max-w-xs">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search file path..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500/40 text-zinc-200 pl-8 pr-3 py-1.5 text-[10.5px] rounded-lg outline-none transition-colors font-mono"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={langFilter}
                  onChange={(e) => setLangFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-350 px-3 py-1.5 rounded-lg text-[10px] focus:outline-none focus:border-cyan-500/40 font-mono cursor-pointer"
                >
                  <option value="ALL">All Languages</option>
                  {stats.languages.map(l => (
                    <option key={l.name} value={l.name}>{l.name}</option>
                  ))}
                </select>

                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-350 px-3 py-1.5 rounded-lg text-[10px] focus:outline-none focus:border-cyan-500/40 font-mono cursor-pointer"
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="HIGH">High Risk (&ge;60)</option>
                  <option value="MEDIUM">Medium Risk (30-59)</option>
                  <option value="LOW">Low Risk (&lt;30)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[10px]">
              <thead>
                <tr className="border-b border-white/[0.04] text-zinc-500 select-none">
                  <th className="pb-2 font-semibold">FILE PATH</th>
                  <th className="pb-2 font-semibold">LANGUAGE</th>
                  <th className="pb-2 font-semibold">LOC</th>
                  <th className="pb-2 font-semibold">COMPLEXITY</th>
                  <th className="pb-2 font-semibold">MAINTAINABILITY</th>
                  <th className="pb-2 font-semibold">FILE RISK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredFiles.map(([path, data]: [string, any]) => {
                  const lang = getLanguageName(path)
                  const cyclo = data.complexity?.cyclomatic_complexity || 1
                  const mi = Math.round(data.complexity?.maintainability_index || 80)
                  const risk = data.risk || 10
                  
                  return (
                    <tr key={path} className="hover:bg-white/[0.01]">
                      <td className="py-2.5 text-white truncate max-w-xs font-semibold" title={path}>{path}</td>
                      <td className="py-2.5 text-zinc-400">{lang}</td>
                      <td className="py-2.5 text-cyan-400 font-bold">{data.loc}</td>
                      <td className="py-2.5 text-slate-350">{cyclo}</td>
                      <td className={`py-2.5 font-bold ${mi >= 70 ? 'text-emerald-400' : mi >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {mi}%
                      </td>
                      <td className={`py-2.5 font-bold ${risk >= 60 ? 'text-red-400' : risk >= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {risk}/100
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredFiles.length === 0 && (
              <div className="py-8 text-center text-zinc-500 select-none">No files matched your filters.</div>
            )}
          </div>
        </div>

      </div>
    </DashboardSection>
  )
}

export default function MetricsPanel({ projectId }: MetricsPanelProps) {
  return (
    <ErrorBoundary name="Code Metrics Panel">
      <RepositoryIntelligenceWrapper projectId={projectId}>
        <MetricsContent projectId={projectId} />
      </RepositoryIntelligenceWrapper>
    </ErrorBoundary>
  )
}
