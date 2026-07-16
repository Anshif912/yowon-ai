# ADR-002: Role-Based Access Control (RBAC) Model

## Status
Accepted (Enterprise Freeze v4)

## Context
Multiple actors collaborate on evaluation projects with varying clearance levels.

## Decision
Implement explicit scopes mapping (GLOBAL, ORGANIZATION, WORKSPACE, PROJECT) to roles:
- Primary Owner & Co-owner: Full configuration rights.
- Contributor: Code import, comment discussion, release versions.
- Reviewer: View metrics, submit reviews.
- Observer: Read-only access.

## Consequences
- Standardizes permissions checking before executing mutations.
