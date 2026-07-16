# YOWON AI — Dependency Graph Specification (v1.0)

Maps import boundaries to prevent architectural degradation.

---

## 1. Import Hierarchy Flow

```
[FastAPI Router]
       │
       ▼
[Service Middleware / Auth]
       │
       ▼
[Subsystem Service Logic (decision_intelligence / governance)]
       │
       ▼
[Database Layer (database.py ORM Models)]
       │
       ▼
[SQLite Core Engine]
```

---

## 2. Dependency Rules & Safety Checks
- **Directional Imports**: Service layers must only import Pydantic schemas or database schemas. Services must never import routing controllers.
- **Circular Dependencies**: Prevent imports loop by referencing DB models dynamically or moving shared utilities to `core/` package parameters.
- **Workspace Isolation**: Database queries must utilize tenant parameters checking, ensuring users do not fetch metrics from foreign workgroups.
