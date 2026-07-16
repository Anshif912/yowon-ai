# TODO checklist — Software Architecture Intelligence Platform (RI v3)
# YOWON AI — Enterprise Identity, Authentication & Workspace Foundation Checklist

## Phase 1: Backend Base Core (Phase 5.1)
- [x] Create domain folder structure under `backend/core/` and `backend/modules/`
- [x] Implement core settings in `backend/core/config/settings.py`
- [x] Implement `BaseEntity`, `TimestampMixin`, `SoftDeleteMixin` under `backend/core/common/`
- [x] Add standardized global exception handler and schemas in `backend/core/middleware/`

## Phase 2: DB Migrations & Models (Phase 5.1 & 5.3)
- [x] Define SQLAlchemy schemas for users, roles, permissions, organizations, workspaces, invitations, sessions, audit logs in `database.py` or separate domain modules
- [x] Setup alembic migrations or database dynamic initialization routines
- [x] Auto-create `PERSONAL` workspace and default settings upon user registration

## Phase 3: Auth, Org, and Workspace Services (Phase 5.2 & 5.3)
- [x] Implement JWT token rotation, refresh session rotation, device tracking
- [x] Build workspace resolver service dependency `inject_current_workspace()`
- [x] Implement Organizations CRUD and membership rules
- [x] Implement Workspaces CRUD and invite system (code/email/links)
- [x] Wire implicit `workspace_id` data isolation checks in project uploads and evaluations

## Phase 4: Frontend Auth Context & Workspace Switcher (Phase 5.2 & 5.3)
- [x] Create `AuthContext` and token refresh loops in React
- [x] Create `WorkspaceContext` and context switcher hooks in React
- [x] Integrate workspace dropdown selection selector in Topbar
- [x] Build Login, Register, Forgot Password, Reset Password UI pages
- [x] Build Organization & Workspace Settings and management dashboards

## Phase 5: Verification & Safety Tests
- [x] Write integration test cases for register, login, refresh, workspaces CRUD
- [x] Add SQL injection, token replay, session hijacking, cross-workspace isolation tests
- [x] Run production build `npm run build` and verify zero errors
