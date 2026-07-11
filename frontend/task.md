# YOWON AI Software OS Upgrade — Scroll Delegation Checklist

- [ ] Phase 1: Parent Layout Refactor
  - [ ] Rebuild `src/components/layout/AppLayout.tsx` to be non-scrollable and overflow-hidden.

- [ ] Phase 2: Refactor ReportPage & IntelligencePage
  - [ ] Rebuild `src/pages/ReportPage.tsx` with persistent fixed sidebar and scrollable workspace container.
  - [ ] Rebuild `src/pages/IntelligencePage.tsx` with persistent fixed sidebar and scrollable workspace container.

- [ ] Phase 3: Add Scroll Wrappers to Dashboard Pages
  - [ ] Add `overflow-y-auto p-6` wrapper to `src/pages/DashboardPage.tsx`.
  - [ ] Add `overflow-y-auto p-6` wrapper to `src/pages/ProjectsPage.tsx`.
  - [ ] Add `overflow-y-auto p-6` wrapper to `src/pages/SubmitPage.tsx`.
  - [ ] Add `overflow-y-auto p-6` wrapper to `src/pages/HistoryPage.tsx`.
  - [ ] Add `overflow-y-auto p-6` wrapper to `src/pages/SettingsPage.tsx`.
  - [ ] Add `overflow-y-auto p-6` wrapper to `src/pages/LeaderboardPage.tsx`.
  - [ ] Add `overflow-y-auto p-6` wrapper to `src/pages/JuryDashboardPage.tsx`.
  - [ ] Add `overflow-y-auto p-6` wrapper to `src/pages/EvaluatePage.tsx`.

- [ ] Phase 4: Verification & Build Check
  - [ ] Confirm type safety compilation (`npm run build`).
