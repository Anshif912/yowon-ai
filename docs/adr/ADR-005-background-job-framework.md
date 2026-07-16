# ADR-005: Background Job Framework

## Status
Accepted (Enterprise Freeze v4)

## Context
Codebase parsing, indexing, and evaluations are long-running operations.

## Decision
Create an abstract job queue ledger (`BackgroundJob` model) that logs priority, execution progress, status, results, and cancellation tokens.

## Consequences
- Prevents thread blockage.
- Gives frontend clients a unified API to query processing progress of asynchronous operations.
