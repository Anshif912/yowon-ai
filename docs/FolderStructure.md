# YOWON AI — Directory Layout & Package Boundaries (v1.0)

This document freezes the backend module folder layouts to ensure clean separation of concerns.

---

## 1. Frozen Codebase Directory Tree

```
backend/
├── auth/                    # JWT Authentication & RBAC filters
├── core/                    # Middlewares, Correlation IDs, and global overrides
├── eval_context/            # Evaluators workspace context parameters
├── modules/                 # Subsystem Domain Packages
│   ├── decision_intelligence/ # Unified Decision Platform
│   │   ├── registry/        # Decision Registry & Snapshot Store
│   │   ├── engine/          # Fuses Agent scores & Project DNA
│   │   ├── replay/          # Logic Drift audits
│   │   ├── evidence/        # DecisionEvidenceStore
│   │   ├── recommendations/ # Roadmaps & lifecycle states
│   │   ├── simulations/     # What-If score simulation logs
│   │   ├── portfolio/       # Org KPI Aggregator
│   │   ├── reports/         # Executive Report Engine
│   │   └── assistant/       # Ask YOWON AI Context Builder
│   └── governance/          # Software Compliance Workflows
│       ├── workflows/       # Reviews checkpoints
│       ├── audit/           # Immutable Audit Trails
│       └── compliance/      # Policy Violations tracking
├── tests/                   # Regression and unit test suites
├── database.py              # Main schema models
└── main.py                  # Entrypoint router registration
```

---

## 2. Dependency Rules
- **No Circular Imports**: Sub-packages inside `modules/` must remain independent.
- **Service Interfaces**: Inter-module queries must go through exposed methods rather than direct model modifications.
