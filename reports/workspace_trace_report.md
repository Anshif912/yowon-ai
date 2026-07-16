# Workspace Context Propagation Trace Report

This trace report validates the end-to-end propagation and DB isolation scope of active Workspaces.

### Scenario: No X-Workspace-ID Header provided
- **Header Value Sent**: `None`
- **Resolved Workspace ID**: `0aa9ac0e-fb8f-43fb-b022-01d89a65066c`
- **User Membership Status**: `OWNER`
- **Workspace Type**: `PERSONAL`
- **Query Filter Enforced**: `Project.workspace_id == 0aa9ac0e-fb8f-43fb-b022-01d89a65066c`
- **SQL Execution Scope**: `SELECT * FROM projects WHERE workspace_id = '0aa9ac0e-fb8f-43fb-b022-01d89a65066c' AND deleted_at IS NULL`
- **Isolation Status**: **PASS** (Data successfully partitioned)

---

### Scenario: X-Workspace-ID Header pointing to Company Workspace
- **Header Value Sent**: `7c46191f-d0ab-456e-ba66-6cdf6f3ad0f4`
- **Resolved Workspace ID**: `7c46191f-d0ab-456e-ba66-6cdf6f3ad0f4`
- **User Membership Status**: `ADMIN`
- **Workspace Type**: `COMPANY`
- **Query Filter Enforced**: `Project.workspace_id == 7c46191f-d0ab-456e-ba66-6cdf6f3ad0f4`
- **SQL Execution Scope**: `SELECT * FROM projects WHERE workspace_id = '7c46191f-d0ab-456e-ba66-6cdf6f3ad0f4' AND deleted_at IS NULL`
- **Isolation Status**: **PASS** (Data successfully partitioned)

---

