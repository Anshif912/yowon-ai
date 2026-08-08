import { useState } from 'react'
import { ChevronRight, ChevronDown, BarChart2, RefreshCw, Layers, Star } from 'lucide-react'
import type { LayoutDensity } from '../../hooks/useDashboardState'

export interface Repository {
  uuid: string
  name: string
  full_name: string
  description?: string
  html_url: string
  private: boolean
  language?: string
  stars_count: number
  forks_count: number
  open_issues_count: number
  last_sync_at?: string
  last_commit_at?: string
  evaluation_policy: string
  watchlist_active: boolean
  organization?: { name: string; login: string; avatar_url?: string }
  statistics?: {
    health_score: number
    risk_index: number
    velocity: number
    technical_debt: number
    coverage: number
    active_contributors: number
    security_issues_count: number
    estimated_remediation_cost: number
    deployment_readiness?: number
    deployment_confidence?: number
  }
  aiSummary?: string
  topFinding?: string
  estimatedFixHours?: number
  verdict?: string
}

interface RepositoryGridProps {
  repositories: Repository[]
  loading: boolean
  selectedRepoIds: string[]
  favoriteRepoIds: string[]
  expandedGroups: string[]
  layoutDensity: LayoutDensity
  onToggleSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
  onToggleGroup: (group: string) => void
  onSelectAll: () => void
  onCardClick: (repo: Repository) => void
  onCompare: (id: string) => void
  onEvaluate: (id: string) => void
  onOpenReport: (id: string) => void
  drillDownTag?: string
  onDrillDownClear?: () => void
}

/* ── Verdict metadata ──────────────────────────────── */
const V = {
  APPROVE:             { dot: 'bg-emerald-400', badge: 'text-emerald-500',  label: 'Approved'  },
  CONDITIONAL_APPROVE: { dot: 'bg-amber-400',   badge: 'text-amber-500',    label: 'Review'    },
  REJECT:              { dot: 'bg-red-400',      badge: 'text-red-500',      label: 'Blocked'   },
  EVALUATING:          { dot: 'bg-purple-400',   badge: 'text-purple-400',   label: 'Running'   },
} as Record<string, { dot: string; badge: string; label: string }>

const fallbackVerdict = (health: number) =>
  health >= 90 ? 'APPROVE' : health >= 80 ? 'CONDITIONAL_APPROVE' : 'REJECT'

/* ── Groups ─────────────────────────────────────────── */
type GroupKey = 'favorites' | 'evaluating' | 'blocked' | 'review' | 'ready'

const GROUPS: { key: GroupKey; label: string; dotColor: string; filter: (r: Repository, favs: string[]) => boolean }[] = [
  { key: 'favorites',  label: 'Favorites',        dotColor: 'bg-amber-400',   filter: (r, f) => f.includes(r.uuid) },
  { key: 'evaluating', label: 'Evaluating',        dotColor: 'bg-purple-400',  filter: (r)    => r.verdict === 'EVALUATING' },
  { key: 'blocked',    label: 'Blocked',           dotColor: 'bg-red-400',     filter: (r, f) => !f.includes(r.uuid) && r.verdict === 'REJECT' },
  { key: 'review',     label: 'Needs Review',      dotColor: 'bg-amber-400',   filter: (r, f) => !f.includes(r.uuid) && r.verdict === 'CONDITIONAL_APPROVE' },
  { key: 'ready',      label: 'Production Ready',  dotColor: 'bg-emerald-400', filter: (r, f) => !f.includes(r.uuid) && (r.verdict === 'APPROVE' || !r.verdict) },
]

const COLLAPSE_AFTER = 10

export default function RepositoryGrid({
  repositories,
  loading,
  selectedRepoIds,
  favoriteRepoIds,
  expandedGroups,
  layoutDensity,
  onToggleSelect,
  onToggleFavorite,
  onToggleGroup,
  onSelectAll,
  onCardClick,
  onCompare,
  onEvaluate,
  onOpenReport,
  drillDownTag,
  onDrillDownClear,
}: RepositoryGridProps) {

  /* ── Loading state ───────────────────────────────── */
  if (loading) {
    return (
      <div className="divide-y divide-white/[0.04]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-zinc-800 rounded w-1/4" />
              <div className="h-2.5 bg-zinc-800/60 rounded w-1/2" />
            </div>
            <div className="h-3 bg-zinc-800 rounded w-12" />
          </div>
        ))}
      </div>
    )
  }

  /* ── Empty state ─────────────────────────────────── */
  if (repositories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-[0.15]">
          <rect x="4" y="4" width="40" height="40" rx="5" stroke="#71717A" strokeWidth="1.5" strokeDasharray="5 3"/>
          <path d="M18 24h12M24 18v12" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <div className="space-y-1">
          <p className="text-sm text-zinc-400 font-medium">No repositories yet</p>
          <p className="text-xs text-zinc-600">Connect a repository to begin your first evaluation.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Bulk bar */}
      {selectedRepoIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 mb-2 bg-[#0c1018] border border-white/[0.07] rounded-lg text-xs">
          <span className="text-zinc-300 font-medium">{selectedRepoIds.length} selected</span>
          <span className="text-zinc-700">·</span>
          <button onClick={onSelectAll} className="text-zinc-500 hover:text-zinc-300 transition-colors">Deselect all</button>
          <div className="ml-auto flex items-center gap-1.5">
            {['Compare', 'Evaluate', 'Export', 'Track'].map((a) => (
              <button
                key={a}
                className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.07] text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors text-[11px] font-medium"
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag filter */}
      {drillDownTag && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs">
          <span className="text-zinc-600">Filtered by</span>
          <button
            onClick={onDrillDownClear}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/[0.08] border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/[0.12] transition-colors text-[11px] font-medium"
          >
            {drillDownTag} ×
          </button>
        </div>
      )}

      {/* Groups — GitHub issue-list style */}
      {GROUPS.map((group) => {
        const items = repositories.filter((r) => group.filter(r, favoriteRepoIds))
        if (items.length === 0) return null

        const isExpanded = expandedGroups.includes(group.key)

        return (
          <GroupSection
            key={group.key}
            group={group}
            items={items}
            isExpanded={isExpanded}
            selectedRepoIds={selectedRepoIds}
            favoriteRepoIds={favoriteRepoIds}
            layoutDensity={layoutDensity}
            onToggleGroup={onToggleGroup}
            onToggleSelect={onToggleSelect}
            onToggleFavorite={onToggleFavorite}
            onCardClick={onCardClick}
            onReport={onOpenReport}
            onEvaluate={onEvaluate}
            onCompare={onCompare}
          />
        )
      })}
    </div>
  )
}

/* ── Group Section ───────────────────────────────────────────────────────── */
function GroupSection({
  group, items, isExpanded, selectedRepoIds, favoriteRepoIds,
  layoutDensity, onToggleGroup, onToggleSelect, onToggleFavorite,
  onCardClick, onReport, onEvaluate, onCompare,
}: {
  group: typeof GROUPS[0]
  items: Repository[]
  isExpanded: boolean
  selectedRepoIds: string[]
  favoriteRepoIds: string[]
  layoutDensity: LayoutDensity
  onToggleGroup: (key: string) => void
  onToggleSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
  onCardClick: (r: Repository) => void
  onReport: (id: string) => void
  onEvaluate: (id: string) => void
  onCompare: (id: string) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const visible = isExpanded ? (showAll ? items : items.slice(0, COLLAPSE_AFTER)) : []
  const isCompact = layoutDensity === 'compact'

  return (
    <div className="mb-1">
      {/* Group header — like GitHub's Open/Closed tabs */}
      <button
        onClick={() => onToggleGroup(group.key)}
        className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/[0.015] transition-colors rounded text-left group"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${group.dotColor}`} />
        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors flex-1">
          {group.label}
        </span>
        <span className="text-[10px] text-zinc-600 font-mono">{items.length}</span>
        {isExpanded
          ? <ChevronDown size={12} className="text-zinc-600" />
          : <ChevronRight size={12} className="text-zinc-600" />}
      </button>

      {/* Rows */}
      {isExpanded && (
        <div className="border-t border-b border-white/[0.04] divide-y divide-white/[0.04]">
          {visible.map((repo) => (
            <RepoRow
              key={repo.uuid}
              repo={repo}
              selected={selectedRepoIds.includes(repo.uuid)}
              favorite={favoriteRepoIds.includes(repo.uuid)}
              compact={isCompact}
              onSelect={() => onToggleSelect(repo.uuid)}
              onFavorite={() => onToggleFavorite(repo.uuid)}
              onClick={() => onCardClick(repo)}
              onReport={() => onReport(repo.uuid)}
              onEvaluate={() => onEvaluate(repo.uuid)}
              onCompare={() => onCompare(repo.uuid)}
            />
          ))}
          {!showAll && items.length > COLLAPSE_AFTER && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-2 text-center text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors font-medium"
            >
              Show {items.length - COLLAPSE_AFTER} more
            </button>
          )}
          {showAll && items.length > COLLAPSE_AFTER && (
            <button
              onClick={() => setShowAll(false)}
              className="w-full py-2 text-center text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors font-medium"
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Repository Row ──────────────────────────────────────────────────────── */
function RepoRow({
  repo, selected, favorite, compact,
  onSelect, onFavorite, onClick, onReport, onEvaluate, onCompare,
}: {
  repo: Repository
  selected: boolean
  favorite: boolean
  compact: boolean
  onSelect: () => void
  onFavorite: () => void
  onClick: () => void
  onReport: () => void
  onEvaluate: () => void
  onCompare: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const stats  = repo.statistics
  const health = stats?.health_score ?? 0
  const risk   = stats?.risk_index ?? 0
  const eta    = repo.estimatedFixHours ?? stats?.technical_debt ?? 0
  const v      = repo.verdict || fallbackVerdict(health)
  const meta   = V[v] ?? { dot: 'bg-zinc-600', badge: 'text-zinc-500', label: v }
  const summary = repo.aiSummary ?? repo.description ?? ''
  const riskLabel = risk > 7 ? 'High risk' : risk > 4 ? 'Med risk' : 'Low risk'
  const riskColor = risk > 7 ? 'text-red-500' : risk > 4 ? 'text-amber-500' : 'text-zinc-600'

  return (
    <div
      className={`group relative flex items-center gap-3 px-4 cursor-pointer select-none
        transition-colors duration-100 ${hovered || selected ? 'bg-white/[0.018]' : ''}`}
      style={{ minHeight: compact ? '40px' : '56px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Checkbox */}
      <div
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-all
          ${selected ? 'border-cyan-400 bg-cyan-400' : 'border-zinc-700 opacity-0 group-hover:opacity-100'}`}
      >
        {selected && <span className="text-black text-[8px] font-black leading-none">✓</span>}
      </div>

      {/* Status dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />

      {/* Name + summary — primary content */}
      <div className="flex-1 min-w-0 py-1">
        <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors truncate leading-tight">
          {repo.name}
        </p>
        {!compact && summary && (
          <p className="text-[11px] text-zinc-600 truncate mt-0.5 leading-tight">{summary}</p>
        )}
      </div>

      {/* Metadata — right-aligned, secondary */}
      <div className={`flex items-center gap-4 shrink-0 text-[11px] transition-all duration-100`}>
        {repo.language && (
          <span className="text-zinc-600 hidden md:block">{repo.language}</span>
        )}
        {health > 0 && (
          <span className="text-zinc-500 tabular-nums">{health}%</span>
        )}
        {!compact && (
          <span className={`${riskColor}`}>{riskLabel}</span>
        )}
        {eta > 0 && !compact && (
          <span className="text-zinc-600">{eta}h</span>
        )}
        <span className={`font-medium ${meta.badge}`}>{meta.label}</span>
      </div>

      {/* Hover actions */}
      <div className={`flex items-center gap-0.5 shrink-0 transition-opacity duration-100 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        <ActionBtn onClick={(e) => { e.stopPropagation(); onReport() }} title="Open Report"><BarChart2 size={12} /></ActionBtn>
        <ActionBtn onClick={(e) => { e.stopPropagation(); onEvaluate() }} title="Re-evaluate"><RefreshCw size={12} /></ActionBtn>
        <ActionBtn onClick={(e) => { e.stopPropagation(); onCompare() }} title="Compare"><Layers size={12} /></ActionBtn>
        <ActionBtn
          onClick={(e) => { e.stopPropagation(); onFavorite() }}
          title="Favorite"
          className={favorite ? 'text-amber-400' : ''}
        >
          <Star size={12} fill={favorite ? 'currentColor' : 'none'} />
        </ActionBtn>
      </div>

      <ChevronRight size={13} className="text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0" />
    </div>
  )
}

function ActionBtn({
  onClick, title, children, className = '',
}: {
  onClick: React.MouseEventHandler
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors ${className}`}
    >
      {children}
    </button>
  )
}
