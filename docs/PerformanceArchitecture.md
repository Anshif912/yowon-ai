# YOWON AI — Performance Architecture & Caching Guidelines (v1.0)

Profiles performance benchmarks and optimization constraints.

---

## 1. Caching Strategy Matrix

- **DNA Feature Snapshot caching**: Fetches DNA components from memory to skip expensive AST parsing on subsequent runs.
- **Comparison caching**: Stores matches calculations in cached matrices to optimize comparison page reload speed.
- **KPI aggregation caching**: Hourly summary jobs update `ExecutiveKPIRegistry` metrics, preventing expensive dynamic SQL runs.

---

## 2. Query Hardening rules
- **Indexed lookups**: Search parameters must hit columns defined as indexes (e.g. `workspace_id`, `project_id`).
- **N+1 Avoidance**: Use relationship eager loading (`joinedload` / `subqueryload`) when building reports containing multiple sub-components (e.g. decision + recommendations + risks).
