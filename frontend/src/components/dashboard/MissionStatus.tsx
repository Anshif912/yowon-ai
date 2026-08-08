interface MissionStatusProps {
  avgHealth: number
  needReview: number
  blockedCount: number
  evaluatingCount: number
  engineeringDebtHours: number
  productionReady: number
  needReviewExplanation?: string
  blockedExplanation?: string
}

export default function MissionStatus({
  avgHealth,
  needReview,
  blockedCount,
  evaluatingCount,
  engineeringDebtHours,
  productionReady,
}: MissionStatusProps) {
  const items = [
    { label: 'Portfolio',    value: `${avgHealth}%`,          color: 'text-white',        show: true },
    { label: 'Ready',        value: String(productionReady),  color: 'text-emerald-400',   show: true },
    { label: 'Review',       value: String(needReview),       color: 'text-amber-400',     show: needReview > 0 },
    { label: 'Blocked',      value: String(blockedCount),     color: 'text-red-400',       show: blockedCount > 0 },
    { label: 'Evaluating',   value: String(evaluatingCount),  color: 'text-purple-400',    show: evaluatingCount > 0 },
    { label: 'Debt',         value: `${engineeringDebtHours}h`, color: 'text-violet-400', show: engineeringDebtHours > 0 },
  ].filter((i) => i.show)

  return (
    <div className="px-6 h-9 flex items-center gap-5 text-[11px]">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5 shrink-0">
          <span className="text-zinc-600">{item.label}</span>
          <span className={`font-semibold ${item.color}`}>{item.value}</span>
          {i < items.length - 1 && (
            <span className="text-zinc-800 ml-2.5">·</span>
          )}
        </span>
      ))}
    </div>
  )
}
