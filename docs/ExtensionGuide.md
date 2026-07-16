# YOWON AI — Enterprise Core Extension Guide (v1.0)

This guide documents how developers must extend YOWON AI without modifying V1.0 Core tables or stable APIs.

---

## 1. Extension Strategy Principles

### 1.1 Appending Database Models
If a new feature (e.g. Jira Ticket Integration) requires database state:
- **Do not** add columns directly to `Project` or `Workspace`.
- **Do** create a new table (e.g. `JiraIntegrationSetting`) mapping a Foreign Key pointing back to `Workspace.workspace_id`.

### 1.2 Adding Custom Compliance Rules
To add custom compliance checks:
- Extend the `DecisionPolicy` criteria fields using dynamic configuration parameters or registry decorators.
- Expose the new logic through additional submodules in `modules/decision_intelligence/policies/`.

### 1.3 Event-Driven Extensions
Utilize the Event Bus to build async extensions. E.g.
- Listen for `DECISION_GENERATED` to trigger Slack notifications or sync tickets in external issue trackers.
- Listen for `RECOMMENDATION_CLOSED` to trigger automatic source code merge workflows.
