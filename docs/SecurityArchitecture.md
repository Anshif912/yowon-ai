# YOWON AI — Security Architecture & Isolation Policy (v1.0)

Documents V1.0 security mechanisms enforcing workspace isolation, tenant safety, and RBAC control.

---

## 1. Multi-Tenant Workspace Isolation

To prevent cross-tenant leakages, every API endpoint scopes query lookups dynamically:
1. **Request Header**: The gateway intercepts headers for `X-Workspace-ID`.
2. **Context Validation**: Checks if the user is a registered member of that workspace.
3. **Database Scoping**:
   ```python
   db.query(Project).filter(
       Project.id == project_id,
       Project.workspace_id == current_workspace_id
   ).first()
   ```

---

## 2. Role-Based Access Control (RBAC)

Subsystem actions enforce permissions at route layer parameters:
- `WORKSPACE_ADMIN`: Configures similarity and decision policies, overrides stage results.
- `MEMBER`: Creates projects, triggers evaluation jobs, reads reports.
- `VIEWER`: Read-only access to dashboards, graphs, and recommendations.

---

## 3. JWT & Session Hardening
- **Signature Security**: Tokens utilize HMAC SHA-256 signatures with environment key constraints.
- **Expiry Rules**: Access tokens expire in 15 minutes; Refresh tokens are tracked in secure registries.
