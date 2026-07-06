import React from 'react'
import { Cpu, Clock, HardDrive, Download, Info } from 'lucide-react'
import { useIntelStatus } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'

interface DiagnosticsPanelProps {
  projectId: string
}

function DiagnosticsContent({ projectId }: { projectId: string }) {
  const { data: statusData, isLoading } = useIntelStatus(projectId)

  if (isLoading) {
    return <CardSkeleton />
  }

  const duration = statusData?.execution_duration || 0
  const progress = statusData?.progress || 0
  const status = statusData?.status || 'unknown'
  const stage = statusData?.current_stage || 'Unknown stage'
  const cacheStatus = statusData?.cache_status || 'miss'
  const filesCount = statusData?.files_processed || 0

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(statusData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `yowon_diagnostics_${projectId}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleExportTxt = () => {
    const reportText = `
YOWON AI DEVELOPER DIAGNOSTICS REPORT
=====================================
Project ID: ${projectId}
Exported At: ${new Date().toLocaleString()}
Status: ${status.toUpperCase()}
Progress: ${progress}%
Current Stage: ${stage}
Files Processed: ${filesCount}
Cache Status: ${cacheStatus.toUpperCase()}
Execution Duration: ${duration.toFixed(2)}s
`
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(reportText)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `yowon_diagnostics_${projectId}.txt`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <DashboardSection id="diagnostics" title="Developer Diagnostics" icon={Cpu} accent="amber">
      <div className="space-y-4 font-mono text-xs text-slate-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card flex items-center gap-3">
            <Clock size={20} className="text-cyan-300 animate-pulse" />
            <div>
              <p className="text-yowon-muted text-[10px] uppercase">Analysis Duration</p>
              <p className="text-sm font-bold text-white mt-1">{duration.toFixed(2)} seconds</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3">
            <HardDrive size={20} className="text-emerald-300" />
            <div>
              <p className="text-yowon-muted text-[10px] uppercase">Cache Status</p>
              <p className="text-sm font-bold text-white mt-1 uppercase">{cacheStatus}</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3">
            <Info size={20} className="text-amber-300" />
            <div>
              <p className="text-yowon-muted text-[10px] uppercase">Engine Version</p>
              <p className="text-sm font-bold text-white mt-1">2.0.0 (Core Engine)</p>
            </div>
          </div>
        </div>

        <div className="glass-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="font-bold text-white text-xs">Runtime System Metrics</span>
            <div className="flex gap-2">
              <button
                onClick={handleExportJson}
                className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded flex items-center gap-1.5 transition-all text-[10px]"
              >
                <Download size={12} />
                Export JSON
              </button>
              <button
                onClick={handleExportTxt}
                className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded flex items-center gap-1.5 transition-all text-[10px]"
              >
                <Download size={12} />
                Export TXT
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-yowon-muted text-[10px] block">PARSING STATUS</span>
              <span className="text-white block mt-1 font-bold">{status}</span>
            </div>
            <div>
              <span className="text-yowon-muted text-[10px] block">CURRENT ENGINE STAGE</span>
              <span className="text-cyan-300 block mt-1 font-bold">{stage}</span>
            </div>
            <div>
              <span className="text-yowon-muted text-[10px] block">FILES SCAN COUNT</span>
              <span className="text-white block mt-1 font-bold">{filesCount} files</span>
            </div>
            <div>
              <span className="text-yowon-muted text-[10px] block">COGNITIVE RATINGS</span>
              <span className="text-emerald-400 block mt-1 font-bold">100% Calibrated</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardSection>
  )
}

export default function DiagnosticsPanel({ projectId }: DiagnosticsPanelProps) {
  return (
    <ErrorBoundary name="Diagnostics Panel">
      <DiagnosticsContent projectId={projectId} />
    </ErrorBoundary>
  )
}
