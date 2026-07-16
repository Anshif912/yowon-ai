# ADR-004: Repository Connection Strategy

## Status
Accepted (Enterprise Freeze v4)

## Context
Code integration spans public and private hosting services (GitHub, GitLab, Bitbucket, local files).

## Decision
Abstract connections out of project models. ProjectMetadata manages webhook states, sync status (UP_TO_DATE, SYNCING, etc.), default branch, and commits metrics.

## Consequences
- decouples Git service providers logic from evaluation execution pipelines.
