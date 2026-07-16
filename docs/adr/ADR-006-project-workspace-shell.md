# ADR-006: Project Workspace Operating System Shell

## Status
Accepted (Enterprise Freeze v4)

## Context
Navigating through project features historically resulted in page reloads and lost context state.

## Decision
- Refactor the Project Workspace into a persistent, non-reloading frame.
- URL query parameters (e.g. `?tab=ownership`) coordinate active view tabs.
- Scroll position is saved locally per-tab to preserve the UI state.

## Consequences
- Improves user experience metrics.
- Preserves local application state while jumping between panels.
