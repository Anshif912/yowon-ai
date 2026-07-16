# YOWON AI — Architectural Decision Records Registry (ADR-001 to ADR-015)

This document serves as the frozen registry for all architectural decisions governing the V1.0 Enterprise Core.

---

## ADR-001: Workspace Isolation
- **Context**: Multi-tenant deployments require strict separation to prevent cross-workspace leakages.
- **Decision**: All lookups must enforce a validated user mapping check against active workspace membership parameters.
- **Consequences**: Zero tenant data leakages; minor routing lookup overhead.

---

## ADR-002: Role-Based Access Control (RBAC)
- **Context**: Platform security must restrict write/modify actions based on roles.
- **Decision**: Define static permissions scopes (ADMIN, MEMBER, VIEWER) at endpoint routing parameters.
- **Consequences**: Restricts unauthorized data writes.

---

## ADR-003: Repository Intelligence
- **Context**: Analyzing repository logic requires language AST understanding.
- **Decision**: Build an AST parse framework mapping code nodes, edges, and dependencies imports.
- **Consequences**: Deeper evaluation parameters; parsing is CPU-intensive.

---

## ADR-004: Knowledge Graph
- **Context**: File-level imports and relationships represent a complex link network.
- **Decision**: Map structural metadata as link nodes/edges in a cached memory database graph format.
- **Consequences**: Fast graph operations and path-finding traversals.

---

## ADR-005: Project DNA Fingerprinting
- **Context**: Large repositories must have compressed, semantic representations.
- **Decision**: Generate versioned, immutable DNA Snapshots mapping features across 11 key dimensions.
- **Consequences**: Searchable technology features; snapshot values cannot be altered retroactively.

---

## ADR-006: Similarity Engine
- **Context**: Authenticity verification requires matching DNA snapshots.
- **Decision**: Apply Jaccard similarity indices on canonicalized feature lists.
- **Consequences**: Deterministic matching confidence scores.

---

## ADR-007: Decision Registry & Snapshots
- **Context**: Scoring trace audits require stable history points.
- **Decision**: Link latest decisions using registry pointer tracking to immutable snapshot snapshots logs.
- **Consequences**: Auditable and reproducible decisions history records.

---

## ADR-008: Decision Replay Engine
- **Context**: Upgrades to LLM models or evaluation parsers might cause score shifts.
- **Decision**: Recompute old decisions using original parameters to identify logic drift.
- **Consequences**: Verifiable auditing capabilities.

---

## ADR-009: Governance Workflow
- **Context**: Compliance gates require step-by-step review locks.
- **Decision**: Enforce reviewer approvals steps, exceptions tracking, and audit trail ledger additions.
- **Consequences**: Immutable compliance logs.

---

## ADR-010: Portfolio Analytics
- **Context**: Executives need workspace-wide aggregates rather than raw file logs.
- **Decision**: Cache aggregates on a KPI registry database table at regular cron intervals.
- **Consequences**: Dashboard loads in under 100ms.

---

## ADR-011: Background Jobs
- **Context**: Running code extraction AST parses takes time.
- **Decision**: Offload processing to background workers with state monitors.
- **Consequences**: Safe non-blocking API requests.

---

## ADR-012: Event Bus
- **Context**: Loosely coupled subsystems must communicate transitions.
- **Decision**: Broadcast events (e.g., `DECISION_GENERATED`) to event listeners.
- **Consequences**: Scalable asynchronous actions.

---

## ADR-013: Notification System
- **Context**: Users must learn about scan completions or reviews request updates.
- **Decision**: Trigger app notifications linked to user workspace mappings.
- **Consequences**: Improved user collaboration loop.

---

## ADR-014: Executive Reports
- **Context**: Managers need print-friendly summaries of code health.
- **Decision**: Centralize templates generation inside a unified Report Engine.
- **Consequences**: Consistent report outputs.

---

## ADR-015: Ask YOWON AI Assistant
- **Context**: Natural language queries must parse multiple database models.
- **Decision**: Map query inputs into a unified Context Builder before calling the LLM.
- **Consequences**: Consistent answers independent of specific LLM parameters.
