export function normalizeDisplayList(items: string[] | string | undefined): string[] {
  if (!items) return []
  if (Array.isArray(items)) return items.map(String).filter(Boolean)
  return String(items)
    .split(/\r?\n/)
    .map(line => line.trim().replace(/^[-*]\s*/, ''))
    .filter(Boolean)
}

export interface RoadmapPhase {
  title: string
  items: string[]
}

export function phaseDeploymentRoadmap(items: string[] | string | undefined): RoadmapPhase[] {
  const normalized = normalizeDisplayList(items).filter(item => item.length > 1)
  const phases: RoadmapPhase[] = [
    { title: 'Phase 1', items: normalized.slice(0, 2) },
    { title: 'Phase 2', items: normalized.slice(2, 3) },
    { title: 'Phase 3', items: normalized.slice(3) },
  ].filter(phase => phase.items.length > 0)
  return phases
}
