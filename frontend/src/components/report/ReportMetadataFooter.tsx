import React from 'react'

interface ReportMetadataFooterProps {
  verdictData: any
}

export function ReportMetadataFooter({ verdictData }: ReportMetadataFooterProps) {
  const metadata = verdictData?.report_metadata

  if (!metadata) {
    return null
  }

  return (
    <div className="w-full text-center py-6 mt-8 border-t border-white/[0.04] text-[9px] font-mono text-zinc-600 space-y-1.5">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>EVALUATION ID: <span className="text-zinc-500 select-all">{metadata.evaluation_id}</span></span>
        <span>·</span>
        <span>COMMIT: <span className="text-zinc-500 select-all">{metadata.repository_commit}</span></span>
        <span>·</span>
        <span>BRANCH: <span className="text-zinc-500">{metadata.repository_branch}</span></span>
        <span>·</span>
        <span>EVIDENCE: <span className="text-zinc-500">{metadata.evidence_count} NODES</span></span>
        <span>·</span>
        <span>KNOWLEDGE: <span className="text-zinc-500">{metadata.knowledge_nodes} NODES / {metadata.knowledge_edges} EDGES</span></span>
      </div>
      <div className="text-[8px] text-zinc-700 uppercase tracking-widest">
        GENERATED: {metadata.generated_at} · ENGINE: YOWON RI V{metadata.ri_engine_version} (JURY SCORE v{metadata.council_version})
      </div>
    </div>
  )
}
