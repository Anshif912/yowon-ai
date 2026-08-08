/**
 * EvaluationReportContext.tsx
 *
 * The global React Context for the report workspace.
 *
 * ARCHITECTURE RULE:
 * - Exactly ONE API fetch per session.
 * - All report pages consume data exclusively from this context.
 * - No page may perform data transformation, score derivation, or API parsing.
 * - The EvaluationReport DTO is immutable throughout the viewing session.
 */
import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { getReport } from '../api/api'
import type { ReportData } from '../types'
import type { EvaluationReport } from '../types/report'
import { normalizeReport } from '../services/reportBuilder/index'

// ─────────────────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────────────────
export interface EvaluationReportContextValue {
  /** Fully normalized report DTO — null while loading */
  report: EvaluationReport | null
  /** True while the initial fetch is in flight */
  isLoading: boolean
  /** Set if the initial fetch failed */
  error: Error | null
  /** The raw API payload — only for direct URL helpers */
  rawReport: ReportData | null
}

const EvaluationReportContext = createContext<EvaluationReportContextValue>({
  report: null,
  isLoading: false,
  error: null,
  rawReport: null,
})

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
interface EvaluationReportProviderProps {
  projectId: string
  children: ReactNode
}

export function EvaluationReportProvider({
  projectId,
  children,
}: EvaluationReportProviderProps) {
  const { data: rawReport, isLoading, error } = useQuery({
    queryKey: ['report', projectId],
    queryFn: () => getReport(projectId),
    enabled: !!projectId,
    // 10-minute stale time — report data is immutable for the session
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const report = useMemo<EvaluationReport | null>(() => {
    if (!rawReport) return null
    try {
      return normalizeReport(rawReport)
    } catch (err) {
      console.error('[EvaluationReportContext] normalizeReport failed:', err)
      return null
    }
  }, [rawReport])

  const value = useMemo<EvaluationReportContextValue>(
    () => ({
      report,
      isLoading,
      error: error as Error | null,
      rawReport: rawReport ?? null,
    }),
    [report, isLoading, error, rawReport],
  )

  return (
    <EvaluationReportContext.Provider value={value}>
      {children}
    </EvaluationReportContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Consumer hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useReport() — the primary hook for all report workspace pages.
 *
 * Components must NEVER:
 * - Calculate scores from this data
 * - Parse raw strings
 * - Derive business logic
 * - Generate fallback values
 *
 * They must ONLY read pre-computed fields from the returned EvaluationReport.
 */
export function useReport(): EvaluationReportContextValue {
  return useContext(EvaluationReportContext)
}

export default EvaluationReportContext
