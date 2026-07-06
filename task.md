# Action Checklist: Production Hardening & Stability Upgrade

## Phase 1 — Database Transaction Safety
- [x] Wrap all database writes in try/except/rollback in `knowledge_graph_service.py`, `cache_engine.py`, `intelligence_service.py`
- [x] Ensure sessions are properly closed/rolled back on failures

## Phase 2 & 3 — Knowledge Graph ID Redesign & Upsert Strategy
- [x] Update `KnowledgeGraphNode.node_id` in database model to VARCHAR(64)
- [x] Replace file path node IDs with deterministic SHA-256 hashes in `knowledge_graph_builder.py` and `knowledge_graph_service.py`
- [x] Implement `db.merge()` upserts instead of blind inserts for knowledge graphs, recommendations, and evidence
- [x] Add UniqueConstraint to `repository_analyses.commit_sha`

## Phase 4 — Cache System Fix
- [x] Fix case mismatch lookup (`status.upper() == "COMPLETED"`) in `cache_engine.py`
- [x] Ensure all cached modules are loaded on cache hit without regeneration

## Phase 5 & 6 — Module Isolation & Status Tracking
- [x] Restructure `run_repository_intelligence()` with independent try/except blocks per module
- [x] Create `IntelligenceModuleStatus` table and log module-level metrics (duration, status, errors)

## Phase 7 & 8 — True Background Execution & API Hardening
- [x] Decouple intelligence pipeline run from the main evaluation task
- [x] Standardize API responses using helper response envelopes and return 202 for pending analysis

## Phase 9 & 10 — Diagnostics Manager & KG Incremental Optimization
- [ ] Implement `DiagnosticsManager` and expose `/diagnostics` endpoint
- [ ] Implement incremental node/edge synchronization

## Phase 11 & 12 — Frontend Performance & Error States
- [x] Disable TanStack Query retries, add focus refetch disable, and debounce graph search
- [x] Remove duplicate tree panel fetch and fix query keys
- [x] Destructure and render error states on panel failures; add TypeScript interfaces

## Phase 13 & 14 — Migrations & Testing
- [x] Create Alembic migration script for schema updates
- [x] Write integration test suite `test_intelligence_hardening.py`
