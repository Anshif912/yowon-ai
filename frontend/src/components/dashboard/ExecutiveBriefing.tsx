import { Cpu } from 'lucide-react'

interface ExecutiveBriefingProps {
  avgHealth: number
  needReview: number
  blockedCount: number
  engineeringDebtHours: number
  productionReady: number
  latestReport: any
  loading: boolean
}

export default function ExecutiveBriefing({
  avgHealth,
  needReview,
  blockedCount,
  engineeringDebtHours,
  productionReady,
  latestReport,
  loading,
}: ExecutiveBriefingProps) {
  const hasData = productionReady > 0 || needReview > 0 || blockedCount > 0

  const verdict =
    latestReport?.verdict ||
    (blockedCount > 0 ? 'REJECT' : needReview > 0 ? 'CONDITIONAL_APPROVE' : hasData ? 'APPROVE' : '')

  const verdictMeta = ({
    APPROVE:             { label: 'Approved',           color: 'text-emerald-400' },
    CONDITIONAL_APPROVE: { label: 'Conditional Approve', color: 'text-amber-400'  },
    REJECT:              { label: 'Rejected',            color: 'text-red-400'    },
  } as Record<string, { label: string; color: string }>)[verdict] ?? { label: '—', color: 'text-zinc-500' }

  const primaryBlocker =
    latestReport?.executive?.topFindings?.[0] ||
    (blockedCount > 0 ? 'Authentication layer requires hardening' : null)

  const recommendation =
    latestReport?.executive?.deploymentAdvice ||
    (verdict === 'CONDITIONAL_APPROVE'
      ? 'Address authentication vulnerabilities before production release.'
      : verdict === 'APPROVE'
      ? 'Portfolio is clear for production deployment.'
      : hasData
      ? 'Resolve critical security findings before proceeding.'
      : null)

  const narrative =
    latestReport?.executive?.executiveSummary ||
    (hasData
      ? [
          `${productionReady} ${productionReady === 1 ? 'repository is' : 'repositories are'} production-ready.`,
          needReview > 0 ? `${needReview} require review before deployment.` : '',
          blockedCount > 0 ? `${blockedCount} blocked by critical issues.` : '',
        ]
          .filter(Boolean)
          .join(' ')
      : null)

  if (loading) {
    return (
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex gap-8 animate-pulse">
          <div className="w-16 h-10 bg-zinc-800/60 rounded" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-zinc-800/60 rounded w-1/3" />
            <div className="h-3 bg-zinc-800/60 rounded w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-5">
        {/* Blueprint mark */}
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="shrink-0 opacity-20">
          <rect x="2" y="2" width="32" height="32" rx="3" stroke="#00E5FF" strokeWidth="1" strokeDasharray="3 2" />
          <circle cx="18" cy="18" r="6" stroke="#00E5FF" strokeWidth="1" />
          <line x1="18" y1="2" x2="18" y2="12" stroke="#00E5FF" strokeWidth="1" />
          <line x1="18" y1="24" x2="18" y2="34" stroke="#00E5FF" strokeWidth="1" />
          <line x1="2" y1="18" x2="12" y2="18" stroke="#00E5FF" strokeWidth="1" />
          <line x1="24" y1="18" x2="34" y2="18" stroke="#00E5FF" strokeWidth="1" />
        </svg>
        <div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Connect a repository and run an evaluation to generate the executive brief,
            risk matrix, portfolio analytics, and AI recommendations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-8 min-h-[76px]">
      {/* Readiness index — the dominant number */}
      <div className="shrink-0 text-right">
        <p className="text-4xl font-black text-white leading-none tracking-tight">{avgHealth}<span className="text-xl text-zinc-500 font-light ml-0.5">%</span></p>
        <p className={`text-[10px] font-semibold mt-1 ${verdictMeta.color}`}>{verdictMeta.label}</p>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-white/[0.08] shrink-0" />

      {/* Stat pills */}
      <div className="flex items-center gap-6 shrink-0">
        <Stat label="Ready" value={String(productionReady)} color="text-emerald-400" />
        {needReview > 0 && <Stat label="Review" value={String(needReview)} color="text-amber-400" />}
        {blockedCount > 0 && <Stat label="Blocked" value={String(blockedCount)} color="text-red-400" />}
        {engineeringDebtHours > 0 && <Stat label="Debt" value={`${engineeringDebtHours}h`} color="text-violet-400" />}
        {primaryBlocker && <Stat label="Blocker" value={primaryBlocker} color="text-zinc-300" truncate />}
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-white/[0.08] shrink-0" />

      {/* Narrative — most important, gets remaining space */}
      <div className="flex-1 min-w-0">
        {narrative && (
          <p className="text-sm text-zinc-300 leading-relaxed">
            {narrative}
            {recommendation && (
              <span className="text-zinc-500">
                {' '}
                <span className="text-cyan-400 font-medium">Prime:</span> {recommendation}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  color,
  truncate,
}: {
  label: string
  value: string
  color: string
  truncate?: boolean
}) {
  return (
    <div className={truncate ? 'max-w-[140px]' : ''}>
      <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-medium">{label}</p>
      <p className={`text-[13px] font-bold leading-tight mt-0.5 ${color} ${truncate ? 'truncate' : ''}`}>
        {value}
      </p>
    </div>
  )
}
