import React from 'react'
import { Activity, Trash2, Calendar, GitCommit } from 'lucide-react'
import { useTimeline } from './queries'
import { DashboardSection } from './DashboardSection'
import { TimelineSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import { api } from '../../api/api'
import { useQueryClient } from '@tanstack/react-query'

interface TimelinePanelProps {
  projectId: string
  demo?: boolean
}

function TimelineContent({ projectId, demo }: { projectId: string; demo?: boolean }) {
  const { data: timelineData, isLoading } = useTimeline(projectId)
  const queryClient = useQueryClient()

  if (isLoading) {
    return <TimelineSkeleton />
  }

  const items = Array.isArray(timelineData) ? timelineData : []

  const handleDelete = async (evalId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this evaluation run?")) return
    try {
      await api.delete(`/evaluations/${evalId}`)
      queryClient.invalidateQueries({ queryKey: ['timeline', projectId] })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <DashboardSection id="timeline" title="Evaluation Timeline" icon={Activity} accent="amber">
      <div className="glass-card">
        {items.length === 0 ? (
          <p className="text-sm text-yowon-muted">No historical evaluations found.</p>
        ) : (
          <div className="relative border-l border-white/10 pl-6 space-y-6 ml-2 my-2">
            {items.map((item: any) => {
              const dt = new Date(item.timestamp || item.created_at)
              return (
                <div key={item.evaluation_id} className="relative">
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-300 border border-yowon-bg" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-white text-sm">
                          Score: {Math.round(item.overall_score)}
                        </span>
                        <span className="glass-pill px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                          {item.verdict}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-yowon-muted font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {dt.toLocaleDateString()} {dt.toLocaleTimeString()}
                        </span>
                        {item.commit_sha && (
                          <span className="flex items-center gap-1">
                            <GitCommit size={12} />
                            {item.commit_sha.substring(0, 7)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!demo && (
                      <button
                        onClick={() => handleDelete(item.evaluation_id)}
                        className="text-red-400/70 hover:text-red-400 p-1.5 rounded bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-all self-start sm:self-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardSection>
  )
}

export default function TimelinePanel({ projectId, demo }: TimelinePanelProps) {
  return (
    <ErrorBoundary name="Evaluation Timeline Panel">
      <TimelineContent projectId={projectId} demo={demo} />
    </ErrorBoundary>
  )
}
