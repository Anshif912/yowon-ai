import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

export interface ActiveJob {
  projectId: string
  name: string
  status: string
  progress: number // 0-100
  stage: 'clone' | 'ast' | 'intelligence' | 'council' | 'done' | 'failed'
  error?: string | null
}

interface ActivePipelineProps {
  jobs: ActiveJob[]
  onAbortJob?: (projectId: string) => void
}

export default function ActivePipeline({ jobs, onAbortJob }: ActivePipelineProps) {
  if (!jobs || jobs.length === 0) {
    return null
  }

  const stages = [
    { key: 'clone', label: 'Cloning' },
    { key: 'ast', label: 'AST Parsing' },
    { key: 'intelligence', label: 'Intelligence' },
    { key: 'council', label: 'Council Review' },
  ]

  return (
    <section className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono space-y-4">
      <div className="flex items-center gap-2">
        <Loader2 size={13} className="text-cyan-400 animate-spin" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Active Evaluation Pipelines ({jobs.length})
        </h3>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => {
          const isFailed = job.stage === 'failed' || job.status === 'failed'
          const isDone = job.stage === 'done' || job.status === 'done'

          return (
            <div
              key={job.projectId}
              className="bg-[#0c0d12] border border-white/[0.04] rounded-xl p-4 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-400 font-bold">{job.name}</span>
                  <span className="block text-[8px] text-zinc-500 uppercase tracking-widest">
                    ID: {job.projectId}
                  </span>
                </div>
                {onAbortJob && !isDone && !isFailed && (
                  <button
                    onClick={() => onAbortJob(job.projectId)}
                    className="text-[9px] text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 transition-all font-bold uppercase"
                  >
                    Abort
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>Pipeline completion</span>
                  <span className="font-bold text-cyan-400">{Math.round(job.progress)}%</span>
                </div>
                <div className="w-full bg-[#12131a] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isFailed ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>

              {/* Pipeline Nodes Map */}
              <div className="grid grid-cols-4 gap-2 pt-1.5 text-[8.5px] uppercase font-bold text-center">
                {stages.map((stage, idx) => {
                  const jobStageIdx = stages.findIndex((s) => s.key === job.stage)
                  
                  let statusColor = 'text-zinc-600'
                  let nodeBorder = 'border-white/[0.03] bg-[#12131a]'

                  if (isFailed) {
                    statusColor = 'text-red-500'
                  } else if (isDone) {
                    statusColor = 'text-cyan-400'
                  } else if (idx < jobStageIdx) {
                    statusColor = 'text-emerald-400'
                  } else if (idx === jobStageIdx) {
                    statusColor = 'text-cyan-400 animate-pulse'
                  }

                  return (
                    <div
                      key={stage.key}
                      className={`py-1 rounded border ${nodeBorder} ${statusColor}`}
                    >
                      {stage.label}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
