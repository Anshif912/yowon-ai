# ADR-001: Workspace Isolation

## Status
Accepted (Enterprise Freeze v4)

## Context
YOWON AI is an enterprise SaaS governance platform that holds sensitive codebase evaluations for accelerators, university labs, and governments. We require strict multi-tenant containment of resource registries.

## Decision
All data retrieval queries (projects, teams, evaluations) must resolve workspace membership validations. Workspace context is cached per-request inside `WorkspaceResolverService` preventing cross-workspace leakage.

## Consequences
- Guarantees data privacy compliance.
- Ensures a workspace can be archived or suspended to immediately lock out members.
