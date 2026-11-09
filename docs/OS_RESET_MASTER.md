# Marlin Work OS | Canonical Reset Build Register

**Started:** 2026-11-09  
**Status:** Phase 0 audit underway. **Nothing below is verified complete.**  
**Initial main snapshot:** `a973f067e2a3689c881eaed0518e859f250bc089` (main as inspected 2026-11-09; commit dated 2026-10-28).  
**Source:** The 2026-11-09 Marlin Claude Projects Reset handoff. This file is its GitHub-tracked build register.  
**Scope:** One deployed Marketing OS, split into Claude workspaces, not separate applications.

## Operating rules

1. **SharePoint is operational truth.** Use the existing `Marketing & Activations 2026` list as the master Activity backbone, unless a verified decision says otherwise. Confirm exact internal fields and permissions before changing any data.
2. **GitHub is build truth.** Use `KimberleyMarlin/marlin-gantt`; check main and open branches/PRs before editing. Do not overwrite other work or assume a PR is deployed.
3. **This is the ONE build register.** Update this file with an actual commit for status changes; do not count a chat message or an unchecked checkbox as evidence.
4. **One task, one owner, one definition of done.** Every item records an owner, state, dependency, tested outcome and PR/commit/SharePoint evidence.
5. **No false persistence claims.** Test actual record writes and relationships after full reload. No simulated success banners for failed Graph writes.
6. **SharePoint permissions are the access boundary.** A hidden UI control is not secure data access.
7. **Freeze feature expansion during Phase 0.** Park CRM integrations, speculative AI agents, website rebuilds, sponsorship extras and new standalone apps.
8. **Keep existing working components.** Do not build a second calendar, submission inbox, task store, dashboard or venue portal.

## Claude Projects and chat ownership

### 01 · Marlin | Core OS & Calendar
- **00 · Coordination & Master Backlog** (single coordination chat, owns this file and cross-project dependencies)
- **01 · Calendar & Overview** (calendar views, filters, risks, coverage)
- **02 · Projects & Tasks** (Activities, Work Requests, private Personal Tasks and links)
- **03 · Navigation & UX Cleanup** (simplification, misleading or duplicate panels)
- **04 · Data Integrity, Access & QA** (saving, deleting/unlinking, error handling, access and reload tests)

### 02 · Marlin | Submissions & Delivery
- **00 · Submission Rules & Types**
- **01 · Job Submission Form**
- **02 · Triage & Approvals**
- **03 · Playbooks & Task Generation**
- **04 · Submission QA**

### 03 · Marlin | Reviews & Marketing Intelligence
- **00 · Sources & Metrics**
- **01 · Customer Reviews** (guest/customer reviews, not internal approvals)
- **02 · Marketing Dashboard**
- **03 · Campaign Reporting**
- **04 · Reviews & Reporting QA**

**Target OS navigation:** Calendar / Overview (default) | Submit | Projects | My Tasks | Reviews | Insights. Admin is secondary/restricted. Existing Gantt and venue calendars are views of the same records, not new databases.

## Priority build register

### Phase 0 · Freeze, inventory and data safety (complete before feature builds)
- [ ] **SAFE-01** Snapshot main, deployed UI and SharePoint mapping. Classify modules as live/partial/prototype/duplicate/broken/park. **Done:** Evidence-linked inventory with source, version, and verification limits.
- [ ] **SAFE-02** Re-test phantom-save and /lists/null/items routes. **Done:** Failed writes visible and unsafe controls disabled or corrected; test with actual reload.
- [ ] **SAFE-03** Verify create/edit/delete/unlink persistence. **Done:** Record and relationship in SharePoint match state after reload.
- [ ] **SAFE-04** Verify exact-field errors, required columns and SharePoint permissions. **Done:** No silent dropped fields or UI-only privacy assumptions.

### Phase 1 · Calendar and work capture
- [ ] **CAL-01** One normalized Activity model across Calendar. **Done:** All views show same records and consistent filters.
- [ ] **CAL-02** Day/Week/Month/Year calendar views. **Done:** Dates, venues and stages agree across views.
- [ ] **CAL-03** Meaningful overview of upcoming activity, deadlines and risks. **Done:** No invented KPIs or redundant dashboards.
- [ ] **SUB-01** One guided job submission form. **Done:** Real durable record and honest confirmation.
- [ ] **SUB-02** Route Work Requests as Activity subtypes until shared-work model proven. **Done:** No null-list POST; relevant records appear in Calendar.
- [ ] **SUB-03** Triage/approvals linked to Projects and Activities. **Done:** Owner, next action and decision history visible.

### Phase 2 · Projects and tasks
- [ ] **PROJ-01** Project workspace with linked Activities, requests and milestones. **Done:** No duplicate source; durable links.
- [ ] **TASK-01** Reuse Personal Tasks within Projects while preserving private standalone view. **Done:** Checkbox, subtasks, order, edits persist; access tested.
- [ ] **FLOW-01** Playbook tasks at the relevant delivery stage. **Done:** Assignment, edit, skip and Project link function correctly.

### Phase 3 · Reviews and reporting
- [ ] **REV-01** Map guest review sources, venue coverage, owners and approval rules. **Done:** Evidence-based source and permissions map.
- [ ] **REV-02** Build guest Reviews queue. **Done:** Statuses, unresolved items and venue filters usable.
- [ ] **MKT-01** Agree minimum useful marketing KPIs. **Done:** Source, definition, time range and owner per KPI.
- [ ] **MKT-02** Build dashboard from verified feeds only. **Done:** Visible freshness, comparisons, no fake widgets.

### Phase 4 · Cleanup and release
- [ ] **UX-01** Consolidate unfinished and duplicate navigation. **Done:** Six main areas clear and functional.
- [ ] **QA-01** End-to-end submit > triage > Project/Activity > Calendar > task > complete > report. **Done:** Every handoff traceable and survives reload.
- [ ] **DOC-01** Synchronise architecture, decisions, field map, workflows and tech debt. **Done:** Documentation matches deployed behaviour.

## Phase 0 initial evidence, 2026-11-09

This is an **inventory snapshot**, not a completed acceptance test. The deployed UI shows a sign-in boundary, so authenticated SharePoint persistence has **not** been tested.

| Area | Evidence observed | Preliminary classification | Next verification |
|---|---|---|---|
| GitHub repo | Main SHA above, `index.html` and existing `docs/` records | Live source present | Inspect code and deployed revision |
| SharePoint Activities | Marketing Hub displays `Marketing activities 2026`; live OS UI reports 290 activities | Live surface, writes unverified | Verify list GUID/internal fields and controlled read/write |
| Calendar | Day/Week/Month/Year, Gantt and venue views visible in OS UI | Existing, not a new build | Cross-view same-record/date/venue test |
| Projects | Projects and work rollups appear in OS navigation; Oct 14 audit refers to Marketing Projects list | Existing, persistence unverified | Project links, unlink and reload |
| Personal Tasks / My Work | UI and list references exist; 205 personal tasks displayed in live OS snapshot | Existing, reliability in progress | Check task save/toggle and roles |
| Submission / approvals | Submission controls and Intake-stage records visible; docs describe playbook preview | Existing, end-to-end unverified | One controlled submission and link chain |
| Loaded Rewards | Program area and monthly offers already visible | Existing specialised feature | Keep as secondary workflow; verify fields |
| Design / photos / media | Art, Drive Search, Photo Tagging, Design Jobs in OS UI | Existing specialised features | Verify persistence, do not recreate |
| Reporting | Charts and marketing dashboard placeholders in UI | UI present; source verification needed | Identify real KPI connections/freshness |
| Guest Reviews | No dedicated Reviews navigation confirmed in visible OS | Requested, not verified as built | Inventory review sources before build |
| Admin | Schema tools/role access included in UI and docs | Existing but requires audit | Verify permissions at SharePoint layer |

### Conflicts and warnings to reconcile

- Existing repo docs are **different ages**. `docs/FIELD_MAPPING.md` and `docs/SUBMISSION_WORKFLOW.md` are from August 12; `docs/TAXONOMY_AUDIT.md` and `docs/TECH_DEBT.md` record October 14 changes. Treat later statements as leads, not proof the deployed build matches.
- October `TECH_DEBT.md` marks **Campaign task lookup** and **Approval playbook connection** resolved. Re-test before creating new fixes for those items.
- As at this snapshot **8 pull requests are open**: #4, #94, #95, #103, #104, #116, #128, #129. PR #94 and #95 explicitly say **DO NOT MERGE YET**. PR #128 and #129 are unmerged My Work changes with manual live checks pending. Do not equate PR description tests with deployment.
- PR #129 requires a new SharePoint `Hub User Prefs` list and GUID for cross-device preferences; confirm whether it has since been created before wiring or merging.
- The earlier reset's phantom-save and `/lists/null/items` concern remains **unverified**, not a currently confirmed defect. Test safely with the authenticated live schema before calling it fixed.
- Public code snapshot `index.html` is over 1 MB and the connector returned empty file content when reading it; **full source-level validation is still outstanding**. Do not infer a negative from lack of searchable code.

### First three actions, in order

1. **SAFE-01:** Finish evidence-based mapping of existing modules and live SharePoint list IDs/fields against the deployed build.
2. **SAFE-02:** Audit every submission/save route, especially null-list targets, false success alerts and partial-field failures; isolate or disable unsafe routes.
3. **SAFE-03/04:** Run controlled SharePoint create/edit/unlink/reload and permission checks before moving into Calendar or Reviews features.

## Work item update format

- **ID:** `SAFE-01` etc.
- **Owner / Claude Project / chat:**
- **Status:** Not started | In progress | Blocked | In review | Verified complete
- **Problem and actual verified behaviour:**
- **Desired smallest safe change:**
- **Dependencies / cross-project requests:**
- **Acceptance tests and actual outcomes:**
- **PR, commit, or SharePoint evidence:**
- **Decision log update and next action:**

## Weekly coordination ritual

Read this file and open PRs. Record verified completed items, blocked items, scope changes, and the next three actions. Park unrelated ideas. Do not start new modules before the end-to-end foundation is dependable.
