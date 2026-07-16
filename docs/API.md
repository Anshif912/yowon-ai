# YOWON AI — API Freeze Specification (v1.0)

All APIs are versioned under `/api/v1` and require header-based token authentication unless explicitly marked.

---

## 1. Frozen API Endpoint Matrix

| Method | Endpoint | Description | Status | Auth | Workspace Scoped | Audit Log Generated |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/projects/{id}` | Retrieves project metadata | **Stable** | Yes | Yes | No |
| `GET` | `/api/v1/decision/projects/{id}` | Returns latest decision snapshot | **Stable** | Yes | Yes | No |
| `GET` | `/api/v1/decision/recommendations` | Lists recommendations for project | **Stable** | Yes | Yes | No |
| `GET` | `/api/v1/decision/portfolio` | Organization-wide KPI metrics | **Stable** | Yes | Yes | No |
| `GET` | `/api/v1/decision/risks` | Detailed project risk lists | **Stable** | Yes | Yes | No |
| `POST` | `/api/v1/decision/projects/{id}/simulate` | Run simulated score parameters | **Stable** | Yes | Yes | Yes |
| `GET` | `/api/v1/decision/{id}/replay` | Audits historical logic runs | **Stable** | Yes | Yes | Yes |
| `POST` | `/api/v1/decision/{id}/assign` | Assigns recommendation owner | **Stable** | Yes | Yes | Yes |
| `POST` | `/api/v1/decision/{id}/verify` | Closes recommended tasks | **Stable** | Yes | Yes | Yes |
| `GET` | `/api/v1/portfolio/trends` | Retrieves maturity metrics trends | **Stable** | Yes | Yes | No |
| `GET` | `/api/v1/portfolio/benchmarks` | Compares project against average | **Stable** | Yes | Yes | No |
| `POST` | `/api/v1/decision/assistant/query` | Ask YOWON query | **Stable** | Yes | Yes | No |
| `GET` | `/api/v1/governance/projects/{id}` | Returns project review workflows | **Stable** | Yes | Yes | No |
| `POST` | `/api/v1/governance/review` | Updates review checkpoint status | **Stable** | Yes | Yes | Yes |

---

## 2. API Contract & Versioning Guidelines
- **Payload Enveloping**: All responses must maintain the envelope trace: `{"apiVersion": "v1", "success": true, "data": {...}}`.
- **Tenant Security**: Requests without a validated user token or workspace member mapping are blocked dynamically with `403 Forbidden`.
