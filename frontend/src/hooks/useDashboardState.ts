import { useState, useCallback } from 'react'

export type WorkspaceMode = 'engineering' | 'security' | 'executive'
export type LayoutDensity = 'compact' | 'comfortable' | 'dense'
export type DashboardTab = 'overview' | 'repositories' | 'operations' | 'security' | 'portfolio'

export interface ActiveFilters {
  org: string
  verdict: string // 'all' | 'APPROVE' | 'CONDITIONAL_APPROVE' | 'REJECT' | 'EVALUATING'
  language: string
}

interface DashboardState {
  activeTab: DashboardTab
  workspaceMode: WorkspaceMode
  leftRailCollapsed: boolean
  rightRailCollapsed: boolean
  drawerWidth: number
  drawerTab: string
  activeFilters: ActiveFilters
  selectedRepoId: string
  expandedGroups: string[]
  layoutDensity: LayoutDensity
  favoriteRepoIds: string[]
  dismissedRecommendations: string[]
  trackedRecommendations: string[]
  scrollPosition: number
}

const DEFAULTS: DashboardState = {
  activeTab: 'overview',
  workspaceMode: 'engineering',
  leftRailCollapsed: false,
  rightRailCollapsed: true,
  drawerWidth: 680,
  drawerTab: 'overview',
  activeFilters: { org: 'all', verdict: 'all', language: 'all' },
  selectedRepoId: '',
  expandedGroups: ['favorites', 'evaluating', 'blocked', 'review', 'ready'],
  layoutDensity: 'comfortable',
  favoriteRepoIds: [],
  dismissedRecommendations: [],
  trackedRecommendations: [],
  scrollPosition: 0,
}

const PREFIX = 'yw:dashboard:'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // localStorage unavailable (SSR / private browsing)
  }
}

function loadState(): DashboardState {
  return {
    activeTab: read('activeTab', DEFAULTS.activeTab),
    workspaceMode: read('workspaceMode', DEFAULTS.workspaceMode),
    leftRailCollapsed: read('leftRailCollapsed', DEFAULTS.leftRailCollapsed),
    rightRailCollapsed: read('rightRailCollapsed', DEFAULTS.rightRailCollapsed),
    drawerWidth: read('drawerWidth', DEFAULTS.drawerWidth),
    drawerTab: read('drawerTab', DEFAULTS.drawerTab),
    activeFilters: read('activeFilters', DEFAULTS.activeFilters),
    selectedRepoId: read('selectedRepoId', DEFAULTS.selectedRepoId),
    expandedGroups: read('expandedGroups', DEFAULTS.expandedGroups),
    layoutDensity: read('layoutDensity', DEFAULTS.layoutDensity),
    favoriteRepoIds: read('favoriteRepoIds', DEFAULTS.favoriteRepoIds),
    dismissedRecommendations: read('dismissedRecommendations', DEFAULTS.dismissedRecommendations),
    trackedRecommendations: read('trackedRecommendations', DEFAULTS.trackedRecommendations),
    scrollPosition: read('scrollPosition', DEFAULTS.scrollPosition),
  }
}

export function useDashboardState() {
  const [state, setStateRaw] = useState<DashboardState>(loadState)

  const setState = useCallback((patch: Partial<DashboardState>) => {
    setStateRaw((prev) => {
      const next = { ...prev, ...patch }
      // Persist each changed key
      ;(Object.keys(patch) as Array<keyof DashboardState>).forEach((k) => {
        write(k, next[k])
      })
      return next
    })
  }, [])

  // Convenience helpers
  const toggleFavorite = useCallback((repoId: string) => {
    setStateRaw((prev) => {
      const ids = prev.favoriteRepoIds.includes(repoId)
        ? prev.favoriteRepoIds.filter((id) => id !== repoId)
        : [...prev.favoriteRepoIds, repoId]
      write('favoriteRepoIds', ids)
      return { ...prev, favoriteRepoIds: ids }
    })
  }, [])

  const toggleGroup = useCallback((group: string) => {
    setStateRaw((prev) => {
      const groups = prev.expandedGroups.includes(group)
        ? prev.expandedGroups.filter((g) => g !== group)
        : [...prev.expandedGroups, group]
      write('expandedGroups', groups)
      return { ...prev, expandedGroups: groups }
    })
  }, [])

  const dismissRecommendation = useCallback((id: string) => {
    setStateRaw((prev) => {
      const ids = [...new Set([...prev.dismissedRecommendations, id])]
      write('dismissedRecommendations', ids)
      return { ...prev, dismissedRecommendations: ids }
    })
  }, [])

  const trackRecommendation = useCallback((id: string) => {
    setStateRaw((prev) => {
      const ids = prev.trackedRecommendations.includes(id)
        ? prev.trackedRecommendations.filter((i) => i !== id)
        : [...prev.trackedRecommendations, id]
      write('trackedRecommendations', ids)
      return { ...prev, trackedRecommendations: ids }
    })
  }, [])

  return {
    state,
    setState,
    toggleFavorite,
    toggleGroup,
    dismissRecommendation,
    trackRecommendation,
  }
}
