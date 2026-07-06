import React, { useState } from 'react'
import { FileText } from 'lucide-react'
import { useEvidence } from './queries'
import { DashboardSection } from './DashboardSection'
import { EvidenceSkeleton } from './Skeletons'
import { ErrorBoundary, PanelErrorFallback } from './ErrorBoundary'
import { RepositoryIntelligenceWrapper } from './RepositoryIntelligenceWrapper'

interface EvidenceExplorerPanelProps {
  projectId: string
}

function EvidenceExplorerContent({ projectId }: { projectId: string }) {
  const [page, setPage] = useState(1)
  const size = 30
  const { data: evidenceData, isLoading, isError, error, refetch } = useEvidence(projectId, page, size)

  if (isLoading) {
    return <EvidenceSkeleton />
  }

  if (isError) {
    return <PanelErrorFallback name="Evidence Explorer" error={error} refetch={refetch} />
  }

  const payload = evidenceData?.success ? evidenceData.data : evidenceData
  const items = payload?.evidence || []
  const total = payload?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / size))

  return (
    <DashboardSection id="evidence" title="Evidence Explorer" icon={FileText} accent="cyan">
      <div className="glass-card min-h-[500px] flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-yowon-muted mb-4">Underlying Evidence Logs</p>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 font-mono">
            {items.length === 0 ? (
              <div className="text-yowon-muted py-12 text-center text-xs">No evidence records are available.</div>
            ) : (
              items.map((ev: any, idx: number) => (
                <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex justify-between items-center hover:bg-white/[0.04] transition-colors">
                  <div>
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      {ev.rule_id}
                    </span>
                    <p className="text-white text-xs font-bold mt-2">{ev.symbol_name ? `Symbol: ${ev.symbol_name}` : 'Feature detection'}</p>
                    <p className="text-[10px] text-yowon-muted font-mono mt-1 truncate max-w-lg">
                      {ev.file_path} {ev.line_start ? `at line ${ev.line_start}-${ev.line_end}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-yowon-muted font-mono block">CONFIDENCE</span>
                    <span className="text-emerald-400 font-bold font-mono text-xs">{Math.round((ev.confidence || 1) * 100)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4 font-mono text-xs">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Previous
            </button>
            <span className="text-yowon-muted">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardSection>
  )
}

export default function EvidenceExplorerPanel({ projectId }: EvidenceExplorerPanelProps) {
  return (
    <ErrorBoundary name="Evidence Explorer Panel">
      <RepositoryIntelligenceWrapper projectId={projectId}>
        <EvidenceExplorerContent projectId={projectId} />
      </RepositoryIntelligenceWrapper>
    </ErrorBoundary>
  )
}
