# YOWON AI — Subsystem Module Responsibilities (v1.0)

Details the responsibilities, dependencies, and scope limits for each domain package.

---

## 1. Subsystem Responsibilities

### 1.1 `decision_intelligence` Domain
- **Responsibilities**:
  - Compiles Multi-Agent score outputs (Guardian, Forge, etc.) and DNA indicators.
  - Computes simulated outcomes without mutating base project snapshots.
  - Packs decision records into unified containers (Decision Packages).
- **Dependencies**: `database.py`, `eval_context`.
- **Database Tables Owned**: `decision_registry`, `decision_snapshots`, `decision_evidence_store`, `executive_recommendations`, `project_risks`, `project_simulations`, `executive_kpi_registry`.

### 1.2 `governance` Domain
- **Responsibilities**:
  - Manages checkpoint approvals.
  - Verifies stage status constraints (PENDING -> APPROVED).
  - Logs immutable trail parameters.
- **Dependencies**: `database.py`, `modules.decision_intelligence`.
- **Database Tables Owned**: `governance_workflows`, `governance_audit_trails`, `decision_policies`.

---

## 2. Event Bus Integration
Subsystems broadcast core transitions on the Event Bus:
- `DECISION_GENERATED`: Dispatched after DecisionSnapshot creation.
- `RECOMMENDATION_CLOSED`: Fired upon completion verification.
- `AUDIT_LOGGED`: Triggered when exception overrides are granted.
- `POLICY_SIMULATED`: Dispatched when simulation runs finish.
