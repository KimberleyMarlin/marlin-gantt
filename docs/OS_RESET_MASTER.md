# Marlin Work OS — Reset Master Register

**Canonical location:** `KimberleyMarlin/marlin-gantt` → `docs/OS_RESET_MASTER.md` (not yet committed — see "Open actions"). Mirror: Claude Project 01 → `docs/OS_RESET_MASTER.md`.
**Rules and Claude Project structure:** `MARLIN_CLAUDE_PROJECTS_RESET.md` (9 Nov 2026). This file holds the live register, inventory and decisions that follow from it.
**Last coordination pass:** 9 Nov 2026, chat `00 · Coordination & Master Backlog`.

---

## 0. Evidence base for this pass

| Source | What was checked | Limits |
|---|---|---|
| GitHub `main` @ `a973f06` (28 Oct 2026, PR #127) | Full clone, 367 commits, `index.html` (15,438 lines), all 6 repo docs, 30+ remote branches | Read-only (anonymous clone). No push access from this session. |
| 22 Sept baseline | Branch `backup/pre-design4-2026-09-22` (`bd02b25`) used as the "September audit" code state | The 22 Sept audit document itself is not in the repo or the Claude Project. Audit findings are taken from the reset brief. |
| Deployed site | **Not checked.** `kimberleymarlin.github.io` is blocked from this session's network. | Need a manual check that the live site serves `a973f06`. |
| SharePoint | **Not checked.** List/column schemas were not read. | List GUIDs come from code (`LIST_IDS`, line 2557). Column mapping still needs a live dump. |
| Runtime behaviour | **Not tested.** No sign-in, no writes, no reload tests. | Every "Wired" status below means *the code calls a real SharePoint list*. It does not mean the save was verified on reload. |

Nothing in this register is marked `[x]`. Code evidence alone doesn't meet the definition of done.

---

## 1. Differences between the September audit and today's code

About 85 PRs have merged since 22 Sept (#43 to #127). Commits stopped on 28 Oct.

| Area | 22 Sept (`bd02b25`) | Today (`a973f06`) | Register impact |
|---|---|---|---|
| `/lists/null/items` | `LIST_IDS.myTasks:null`, so shared-task writes went to a null list | `myTasks:'8dd02125…'` ("Tasks & Job Tickets", confirmed 5 Oct, PR #55). Every shared-task save, toggle and delete path checks `if(!LIST_IDS.myTasks&&!isPreviewMode)` and shows a visible "not connected" message (lines 3266, 8391, 10977, 11210, 11614). | SAFE-02: **looks fixed in code; needs a runtime re-test** |
| Phantom save | With the list ID null, `saveTask()` pushed a local `T-<timestamp>` item and closed the form as if it had saved | The local-push branches (lines 11311, 11598) now only run in explicit **UI Preview** mode, which is labelled "UI preview — no live SharePoint data" | SAFE-02: **looks fixed in code; needs a runtime re-test** |
| Silent write failures | Several | One left: the `SeriesId` anchor PATCH in "Duplicate as next month" (line 3630) uses `.catch(()=>{})` | **PR-1** |
| Optimistic UI rollback | Mixed | Task toggle/delete, Personal Task toggle/delete and Project link/unlink all roll back and alert on failure (lines 11320–11360, 11677–11690, 12443–12500) | SAFE-03: needs reload tests |
| Project unlink | n/a | Unlinking sends `ProjectId:null` to a Number column (4 call sites). Whether Graph accepts this is unverified. The failure alert always blames "column may not exist", even when that isn't the cause. | SAFE-03 test + **PR-1** (honest error) |
| Approval → tasks | `runPlaybook()` was never called | Approval opens a preview/confirm overlay, creates only the ticked jobs linked via `CampaignLookupId`, and moves the activity forward only when every job succeeds (PR #79, 14 Oct) | FLOW-01 / SUB-03: **built, unverified** |
| Task ↔ Activity link | Title-text matching; `submitJob()` wrote a field nothing read | `CampaignLookupId` written and read, with title as a fallback (PR #75) | PROJ-01: built, unverified |
| Calendar | Week/Month | Day and Year added (#47). Day redesigned (#114), month range bars (#97, #108), Gantt, Venue Month and Cross-Venue now run as sub-views of the same Calendar panel | CAL-02: mostly built, unverified |
| Navigation | Duplicate Submit, separate Pipeline, "Budget" | Duplicate Submit removed (#16), Pipeline folded into Activities (#18), Budget renamed Finance (#17). Calendar is already the post-login default (line 4601). | UX-01: partly done |
| CRM writes | `CRM_WRITE_ENABLED=true` since 10 Sept (`5e39b3e`) | Unchanged: live writes to the CRM lists. The project doc of 31 Aug still says "locked". | **Decision needed** (CRM is parked under the reset rules) |
| New scope since the audit | — | Drive Search + Google Drive OAuth (#55, #58), Photo Tagging + Google Vision AI rename (#57, #67), Featured Image picker (#90), Email-to-Task (#91), Dashboard Widget Library (#85), Reporting roll-ups (#88), specialist briefs (#87), Idea Bank lifecycle (#78) | These grew scope during the freeze period. Classified below. |
| **Security** | — | `GOOGLE_VISION_API_KEY` sits in plain text in a **public** repo (line 2551, committed 13 Oct, #64) | **SAFE-05 (new)** |
| Repo docs | — | `FIELD_MAPPING.md`, `SUBMISSION_WORKFLOW.md` and `DECISIONS.md` were last updated 12 Aug and are stale (for example, SUBMISSION_WORKFLOW still says the playbook isn't wired). `TECH_DEBT.md` was updated 14 Oct. No `OS_RESET_MASTER.md` exists yet. | DOC-01 |
| Branches | — | 30+ stale `claude/*`, `agent/v15–v18*` and `backup/*` branches | SAFE-01 housekeeping (archive list only, no deletes without Kim) |

Claude Project 01 docs (`ARCHITECTURE.md`, `DATA_MODEL.md`, `TECH_DEBT.md`, dated Aug) describe `marlin-os-v2.html`, which is **not** the production file. These files and the eleven legacy `.html`/`.jsx` uploads should be replaced by repo-sourced copies. Until then, treat them as history.

---

## 2. Module inventory (code-evidenced, runtime unverified)

**Key:** **Wired** = reads/writes a real SharePoint list in code · **Partial** = wired but incomplete or with a known gap · **Duplicate** = another entry point onto records already shown elsewhere · **Placeholder** = static or no data, presented as a module · **Park** = outside the reset's core flow · **Broken** = confirmed failing (none confirmed this pass).

All Activity-based views read one array, `EVENTS`, loaded from `Marketing & Activations 2026` (`269191b2…`). No second Activity store was found. ✅

| Nav item (section) | Panel | Source of truth | Class | Owner chat | Notes |
|---|---|---|---|---|---|
| Dashboard (Today) | `overview` | Activities, Tasks | **Duplicate / Partial** | P01·01, P03·02 | Overlaps both Calendar Overview and Insights. The widget library (#85) adds more dashboard surface. Needs a "no invented metrics" check (CAL-03). |
| My Work (Today) | `mywork` (`myday` alias) | Tasks & Job Tickets + Personal Tasks + Activity alerts | **Wired** | P01·02 | Agreed single to-do home. |
| Inbox (Today) | `inbox` | Activity Comments (`4d41274c…`) | **Wired** | P01·02 | |
| Personal Tasks (Today) | `personaltasks` | Personal list (`d44e7911…`) | **Wired / Duplicate entry** | P01·02 | Also shown inside My Work. Privacy depends on SharePoint list permissions (SAFE-04). |
| Calendar (Plan) | `calendar` with views day / week / month / year / gantt / venuemonth / crossvenue | Activities + Calendar Reference (`f0900598…`) | **Wired** | P01·01 | One panel, one data array: a good base for CAL-01/02. |
| Activities (Plan) | `campaigns` (table/pipeline) | Activities | **Duplicate (list view)** | P01·01 | Keep it as a list view inside Calendar, not a separate area. |
| Artwork (Plan) | `artwork` | Activities, Tasks, Projects | **Partial** | P02·03 | Delivery view. |
| Drive Search (Plan) | `drivesearch` | Google Drive API | **Park** | — | A second asset system next to the SharePoint Digital Media library. |
| Photo Tagging (Plan) | `phototagging` | Google Drive + Vision | **Park** | — | Exposed API key (SAFE-05). |
| Idea Bank (Plan) | `ideas` | Ideas list (`545ce799…`) | **Wired** | P02·00 | Pre-submission drafts. Belongs under Submit. |
| Submissions (Deliver) | `approvals` | Activities at Intake/Review | **Wired** | P02·02 | Approve → job preview (#79). |
| Projects (Deliver) | `projects` | Projects (`fade78c7…`) + `ProjectId` links | **Partial** | P01·02 | Link/unlink via a Number `ProjectId` column, not a Lookup. Unlink is untested. |
| Shared Work Setup (Deliver) | `mytasks` | Tasks & Job Tickets | **Duplicate / Admin** | P01·03 | Configuration screen. Move to Admin. |
| Design Jobs (Deliver) | `design` | Activities | **Duplicate (filtered view)** | P02·03 | |
| Workload (Deliver) | `workload` | Tasks + Activities | **Partial** | P02·03 | |
| Loaded Rewards (Programs) | `loaded` | Activities + Offer Variants/Mechanics | **Wired** | P02·00 | Filtered program view, plus offer editing. |
| Ticketing (Programs) | `ticketing` | Activities | **Duplicate (filtered view)** | P02·00 | Financial role-gating was fixed in v12. Re-verify under SAFE-04. |
| Specials (Programs) | `specials` | Activities, Projects, Personal Tasks | **Duplicate (filtered view)** | P01·01 | Reads Personal Tasks: check this doesn't leak private titles. |
| Social (Programs) | `social` | **None (static HTML)** | **Placeholder** | P01·03 | Hide. |
| Contacts & Mailing (Business) | `crm` | 8 CRM lists, **writes ON** | **Park (live-write risk)** | — | Decision D-2. |
| Venues (Business) | `venues` | `VENUES_DATA` hard-coded + Activities | **Partial** | P01·01 | Venue lives in code, not data (tech debt). |
| Finance (Business) | `budget` (+ reporting roll-ups) | Activity budget fields | **Partial** | P03·03 | Only UI-gated. Raw Graph responses still expose financials (TECH_DEBT). |
| Oversight (Business) | `operations` | Tasks | **Duplicate** | P01·03 | Overlaps Workload. |
| Admin & Schema (Business) | `schema` | SharePoint metadata | **Wired (admin)** | P01·04 | Keep. This is the tool for SAFE-01 column dumps. |
| Appearance (Business) | `appearance` | Local settings | **Admin** | P01·03 | |
| — (not in nav) | `sponsorships` | `STATIC_SPONSORSHIPS`, `LIST_IDS.sponsorships:null` | **Placeholder / orphan** | P01·03 | Hard-coded list shown as "Total Agreements". Not reachable from nav. Remove or label. |
| — (Calendar sub-views) | `gantt`, `venuemonth`, `crossvenue` | Activities | **Wired** | P01·01 | Reached only through Calendar. Good. |
| Submit (top button) | `submit` | Activities | **Wired** | P02·01 | SUB-01. |
| Guest Reviews | — | — | **Not built** | P03·01 | Nothing in code. REV-01 starts from zero. |

**Totals:** 26 nav items and 33 panels. The target is 6 areas plus Admin.

---

## 3. Proposed navigation (owner: P01·03, delivered under UX-01)

| Target area | Absorbs | Notes |
|---|---|---|
| **Calendar / Overview** (home) | Calendar (all 7 views), Activities list, Dashboard overview, Specials / Loaded / Ticketing as **filter chips** | One logic, one record set. Programs become filters, not destinations. |
| **Submit** | Submit form, Idea Bank (drafts), Submissions triage tab (reviewers only) | Internal approvals stay here, not under Reviews. |
| **Projects** | Projects, Design Jobs, Workload, Artwork | Delivery views of linked Activities and Tasks. |
| **My Tasks** | My Work (shared + Personal tab), Inbox | Personal Tasks stays private, shown as a tab, not a second nav item. |
| **Reviews** | — | **Hidden until REV-02 ships.** No empty shell. |
| **Insights** | Finance + reporting roll-ups, Venues, Dashboard widgets | Role-gated. Every number needs a freshness label (MKT-02). |
| *Admin (secondary, restricted)* | Admin & Schema, Shared Work Setup, Oversight, Appearance | |
| *Hidden / parked* | Social, Sponsorships, Drive Search, Photo Tagging, Contacts & Mailing | Hide from nav. Don't delete code until a decision is logged. |

Do this as hide/regroup only: no rebuilds, no new panels.

---

## 4. Priority sequence

**Next three work items:** SAFE-05 → SAFE-01 (column dumps) → PR-1 + SAFE-02/03 reload tests.

| # | ID | Claude Project · chat | Depends on | Status |
|---|---|---|---|---|
| 1 | **SAFE-05** (new) Restrict and rotate the exposed Google Vision API key | Kim / IT, logged in P01·04 | — | `[ ]` Not started |
| 2 | **SAFE-01** Inventory (this file) + live-site check + SharePoint column dump per `LIST_IDS` list + stale-branch list | P01·00 / P01·04 | — | `[ ]` IN PROGRESS: code inventory done 9 Nov; deploy + schema evidence outstanding |
| 3 | **SAFE-02** PR-1 (below) + re-test the shared-task save/toggle/delete paths | P01·04 | SAFE-01 | `[ ]` Code suggests fixed; awaiting runtime test |
| 4 | **SAFE-03** Reload tests: Activity CRUD, shared task CRUD, Personal Task CRUD + subtasks, Activity↔Project and Personal Task↔Project link/**unlink** | P01·04 | PR-1 | `[ ]` |
| 5 | **SAFE-04** One controlled record per conditional section (FIELD_MAPPING), skipped-field reporting, SharePoint permission audit (Personal Tasks, Campaigns financials, CRM lists) | P01·04 | SAFE-03 | `[ ]` |
| 6 | **CAL-01** Confirm one normalised Activity model | P01·01 | SAFE-04 | `[ ]` Strong code evidence (single `EVENTS`) |
| 7 | **SUB-02** Verify Work Requests route to a real list and appear on the Calendar | P02·04 | SAFE-02 | `[ ]` Likely done (#55), verify |
| 8 | **UX-01 (hide-only slice)** Hide Social, Sponsorships and parked modules; move admin screens | P01·03 | SAFE-01, D-1 | `[ ]` Pulled forward: low-risk, removes fake content |
| 9 | **CAL-02** Day/Week/Month/Year agree on dates, venue filters, stages (Perth timezone) | P01·01 | CAL-01 | `[ ]` Mostly built |
| 10 | **SUB-01** Guided form: durable record + genuine confirmation | P02·01 | SAFE-04 | `[ ]` |
| 11 | **SUB-03 / FLOW-01** Verify approval → job preview → linked tasks (#79) | P02·02 / P02·03 | SUB-01 | `[ ]` Built, unverified |
| 12 | **PROJ-01** Project with expandable linked Activities/Tasks | P01·02 | SAFE-03 | `[ ]` Partial |
| 13 | **TASK-01** Personal Tasks inside Projects, private view preserved | P01·02 | PROJ-01 | `[ ]` Partial (#41) |
| 14 | **CAL-03** Overview: real deadlines, risk reasons, coverage gaps, no invented metrics | P01·01 | CAL-02 | `[ ]` |
| 15 | **REV-01** Review source map (nothing built) | P03·00 | — | `[ ]` IN PROGRESS: source map drafted in `docs/P03_REVIEWS_MARKETING_INTEL.md` §3; awaiting Kim (P3-D4, P3-D5) |
| 16 | **MKT-01** Minimal KPI list | P03·00 | — | `[ ]` IN PROGRESS: KPI list proposed in `docs/P03_REVIEWS_MARKETING_INTEL.md` §5; awaiting Kim (P3-D1 to P3-D3) |
| 17 | **REV-02**, **MKT-02** | P03·01 / P03·02 | REV-01, MKT-01, SAFE-04 | `[ ]` |
| 18 | **UX-01 (full)** Six-area regroup | P01·03 | CAL-03, PROJ-01 | `[ ]` |
| 19 | **QA-01** End-to-end journey | P01·04 + P02·04 | all above | `[ ]` |
| 20 | **DOC-01** Refresh FIELD_MAPPING, SUBMISSION_WORKFLOW, DECISIONS, TECH_DEBT from repo truth; retire stale Claude Project docs | P01·00 | ongoing | `[ ]` |

---

## 5. First data-integrity PR — **PR-1: "No silent or misleading write results"**

**ID:** SAFE-02a · **Area:** P01·04 · **Owner:** TBC (Kim to assign; Claude Code session with push access)

**Problem:** One Graph write still fails silently, and the Project link/unlink failure message can name the wrong cause. Both make the SAFE-03 reload tests hard to read.

**Current behaviour (verified in code @ `a973f06`):**
1. `index.html:3630`: in "Duplicate as next month", the PATCH that writes `SeriesId` onto the original activity is fire-and-forget with `.catch(()=>{})`. If it fails, the user sees "Created … for next month" and the series link is quietly lost. This is the only `.catch(()=>{})` in the file.
2. `setActivityProjectId()` (line 12449) and `setPersonalTaskProjectId()` (line 12489) roll back correctly on failure, but the alert always says the `ProjectId` column "may not exist". The real HTTP status and Graph error text are thrown away, including for 400s from the `null` used to unlink.

**Desired behaviour:** every failed write tells the user what failed, with the real status and message. Success messages appear only after a confirmed `res.ok`.

**Smallest safe change (index.html only, about 15 lines):**
- (1) `await` the SeriesId PATCH, check `res.ok`, and on failure keep the created activity but show: *"Created next month's activity, but couldn't link the original into the series (HTTP {status}: {message})."* Drop the `.catch(()=>{})`.
- (2) In both `set…ProjectId` functions, include `res.status` and the response text in the thrown error and in the alert. Mention the missing-column hint only when Graph's message says the field doesn't exist.
- (Optional 3) Sidebar pill at line 723: show "Preview · not saving" when `isPreviewMode` is on, instead of the static "Live · SharePoint".

**Explicitly not in this PR:** changing the `ProjectId:null` payload (wait for SAFE-03 evidence), touching any field mapping, refactoring the other 68 write calls, CRM changes.

**Dependencies:** push access to `marlin-gantt` from the implementing session.

**Acceptance tests:**
1. Normal path: duplicate an activity, reload, and confirm both items exist and share `SeriesId` in SharePoint.
2. Forced failure: block the `…/items/{originalId}` PATCH in DevTools request blocking. The new item is created, the warning shows the HTTP status, and no "series linked" claim appears.
3. Link and unlink an Activity to a Project, then reload. The SharePoint `ProjectId` matches the UI. If unlinking fails, the alert shows the real Graph error (this becomes SAFE-03 evidence).
4. Same as test 3 for a Personal Task.
5. Regression: Personal Task save, shared task save and Activity edit still behave the same.

**Evidence to record:** PR link, commit SHA, screenshots of tests 2 and 3, SharePoint item IDs checked.

---

## 6. Decisions needed from Kim

| ID | Decision | Recommendation |
|---|---|---|
| D-1 | Can parked modules (Social, Sponsorships, Drive Search, Photo Tagging, Contacts & Mailing) be **hidden from nav** now? | Yes. Hide only, keep the code, log it in DECISIONS. |
| D-2 | `CRM_WRITE_ENABLED=true` has been live since 10 Sept. Under the reset, CRM is parked. Turn writes off until a controlled test is recorded? | Yes, unless someone is actively importing. The flag already exists, so this is a one-line change. |
| D-3 | Google Vision key: restrict it to the GitHub Pages referrer and the Vision API only, or rotate it and move the key off the client? | Restrict now (no code change), then decide whether AI renaming stays (it's parked). |
| D-4 | Deployment: confirm GitHub Pages serves `main` @ `a973f06` | Kim to open the live site and check the footer or version badge. |
| D-5 | Who owns PR-1 and SAFE-03 testing? | Assign a named owner per the rules. |

---

## 7. Cross-project dependencies

| From | To | Dependency |
|---|---|---|
| P01·04 SAFE-02/03/04 | P02 (all) | Submission work waits until shared-task writes and field-rejection handling are verified. |
| P01·01 CAL-01 | P02·03 FLOW-01 | Playbook tasks must link to the normalised Activity (`CampaignLookupId`). |
| P01·03 UX-01 | P03·01, P03·02 | The Reviews nav stays hidden and Insights absorbs Finance and roll-ups. P03 doesn't add nav items. |
| P01·04 SAFE-04 | P03·02/03 | Financial fields are only UI-gated. Insights can't expose financials to new roles until the permission audit is done. |
| P02·00 | P01·01 | Activity Group/Subtype taxonomy (#80) drives both submission types and Calendar filters. One list, `ACTIVITY_GROUPS`. |

---

## 8. Tech debt surfaced this pass (to fold into `docs/TECH_DEBT.md`)

- **Venues hard-coded:** `VENUES_DATA`, `BRAND_OPTIONS` and `VENUE_SHORT_CODES` are code, not data, so adding a venue means a deploy. Medium.
- **Two asset systems:** SharePoint Digital Media (canonical per the 15 Sept decision) and Google Drive (Drive Search, Photo Tagging). Medium; parked.
- **`ProjectId` is a Number, not a Lookup:** no referential integrity. Deleted projects leave orphan IDs. Low–medium.
- **Static "Live · SharePoint" pill:** it doesn't reflect the actual connection state. Low; optional in PR-1.
- **Stale branches:** 30+. Low.

---

## 9. Change log

- 2026-11-09: Register created by chat 00. Code inventory from `a973f06`. Nothing marked complete.
- 2026-11-09: Committed to `marlin-gantt` at `docs/OS_RESET_MASTER.md` by the My Work implementation session (push access confirmed). My Work Plan Phase 2 (PR #131) merged same day, ahead of this register's snapshot at `a973f06` — see that PR's description for what changed. PR-1 picked up immediately after by the same session since it depends only on push access, which this session already has.
- 2026-11-10: P03 opened (`docs/P03_REVIEWS_MARKETING_INTEL.md`). REV-01 and MKT-01 drafted for decision. Two reporting fixes in `index.html`: the Post-Campaign Report no longer carries values from one activity to the next, and the dashboard Ticket Revenue uses the saved figure. Both need a live re-test.
- 2026-11-11: P03 decisions recorded (see `docs/P03_REVIEWS_MARKETING_INTEL.md` §6). MKT-02 first slice built in `index.html` ahead of SAFE-04: it adds no financial access for new roles (money KPIs stay behind `canViewBudget`). Needs the `ReportSubmittedAt` column and a live re-test.
