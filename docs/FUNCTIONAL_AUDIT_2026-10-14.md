# Functional audit — stabilise before extending

Produced: 2026-10-14. Scope: the repository as merged to `main`, plus the still-open PR #89 (cascading Job archiving). This is the audit-only deliverable requested instead of further feature work — **nothing in sections 1–5 below has been implemented**, except the two narrow, explicitly-approved items noted in "What was actually changed this session" at the end. PR #89 has **not** been merged.

## How to read this

Each numbered finding has: **Location**, **Expected**, **Actual**, **Severity** (Critical / High / Medium / Low), **Root cause**, **Recommended fix**, **Complexity** (S/M/L), **Dependencies**. Severity is about user/data impact, not how hard the fix is.

---

## 1. Job Completion and Archiving

### 1.1 — PR #89 fixed Archive/Deny; Completion has no equivalent check at all
**Location:** `savePostCampaign()` (Post-Campaign Report — the normal "Completed" path, sets `WorkflowStage:'Done'`).
**Expected:** Completing a Job identifies remaining open Tasks/follow-ups and prompts for a resolution, per your spec — not silently cancelling required work, but also not leaving it dangling.
**Actual:** `savePostCampaign()` only ever PATCHes the Activity's own fields. It doesn't call `findDependentWork()`/`cascadeArchiveJobWork()` (both added in PR #89) or anything equivalent. A Job marked Completed with genuinely open Tasks still attached gets no check, no prompt, nothing.
**Severity:** High.
**Root cause:** Completion and Archival are two separate code paths that grew independently; PR #89 only touched the Archive/Deny path because that's what was reported broken.
**Recommended fix:** Reuse `findDependentWork()` (already stable-id-based, already privacy-correct for Personal Tasks) from `savePostCampaign()` too. But *don't* reuse `cascadeArchiveJobWork()`'s auto-cancel as-is — your spec explicitly wants a **prompt to resolve** on Completion (mark done / reassign elsewhere / explicitly cancel), not an automatic cancel. That's a small modal: show the dependent-work list, let the user pick a resolution per item (or bulk), then write it. The auto-cancel path PR #89 built is the right *mechanism*; Completion needs a *picker* in front of it instead of firing it unprompted.
**Complexity:** M (reuses PR #89's finder/canceller; new UI is a short list + per-row action, no new data model).
**Dependencies:** PR #89 merged first (this builds directly on `findDependentWork()`).

### 1.2 — `renderDesign()` shows Jobs forever once they've ever had a design brief date
**Location:** `renderDesign()`, base filter: `EVENTS.filter(e=>['In Design'].includes(e.stage)||e.designBriefDue)`.
**Expected:** Completed or archived Jobs disappear from the active Design page.
**Actual:** The filter is `stage is 'In Design'` **OR** `designBriefDue is set` — with no `!isArchived(e)` check anywhere. `designBriefDue` is never cleared once set, so any Job that ever had a design brief due date keeps appearing on this page permanently, including ones that are Done, Archived, Cancelled, or Denied. This is almost certainly "old Jobs continue appearing" that you flagged.
**Severity:** High — directly reported, confirmed root cause, trivial blast radius to fix.
**Root cause:** The `designBriefDue` half of the OR was never guarded by archive state; likely written before `isArchived()` existed as a shared concept.
**Recommended fix:** `EVENTS.filter(e=>!isArchived(e)&&(['In Design'].includes(e.stage)||e.designBriefDue))`. One line. A separate "Archive/Completed" filter chip (same page, `globalShowArchive`-style toggle) covers your "view completed Jobs through an Archive filter" requirement.
**Complexity:** S.
**Dependencies:** None.

**Also noticed in the same function:** the `'indesign'` filter chip checks `['In Design','Design Review'].includes(e.stage)` — `'Design Review'` isn't a real `WorkflowStage` value anywhere else in the app (the real stages are Intake/In Design/In Build/Review/Ready for Live/Live/Done). Looks like dead/stale code referencing a stage that was renamed or never existed. Low severity (harmless no-op clause), worth deleting alongside the fix above.

### 1.3 — Confirmed, self-found: PR #89's own fix mislabels cancelled tasks as "Completed" in several stat tiles
**Location:** My Day (`renderMyTasksInline`), My Work (`renderMyWork`), Personal Tasks (`renderPersonalTasks`) — all in the currently-open PR #89.
**Expected (your explicit check):** Cancelled tasks are not counted as successfully Completed in reports or dashboards.
**Actual:** PR #89 introduced `isTaskClosed()` (Done + Complete + Completed + Cancelled) to fix the original "still shows as active" bug — correctly. But three stat tiles literally labeled **"Completed"**/**"Done"** were built from that same broad `isTaskClosed()` count, so a task cancelled because its parent Job was archived inflated those numbers as if it were genuinely finished.
**Severity:** Medium (not data loss, but a real reporting-accuracy regression — introduced by the fix itself).
**Root cause:** One helper was being asked to answer two different questions ("is this still active" vs. "did this get done") with one boolean.
**Status: already fixed in this session, as an additional commit on the same open PR #89** (not merged). Added a stricter `isTaskDone()` (Done/Complete/Completed only, no Cancelled) and repointed the three "Completed"/"Done" stat numbers to it. The broader `isTaskClosed()` is kept for the actual "exclude from active views" job it was built for, and for the "Closed" (renamed from "Completed") history list in My Day, which still correctly shows cancelled items for reference — just no longer mislabeled as a success count.
**Complexity:** (done) S.
**Dependencies:** None — self-contained within PR #89.

### 1.4 — Same category of issue, pre-existing, at the Activity level (not yet fixed)
**Location:** Finance page's "📊 Campaign Performance" roll-up (`renderBudget()`, from the already-merged reporting-roll-ups PR #88): `const completed=EVENTS.filter(e=>e.stage==='Done'||e.status==='Complete'||e.status==='Archive'||e.status==='Archived');` — then sums Tickets Sold/Revenue/Redemptions/Covers across that set, under the label "Completed".
**Expected:** Only Activities that actually ran and were properly completed count toward performance totals.
**Actual:** An Activity that was **Archived or Denied** (withdrawn, never ran, or ran and was pulled) counts identically to one that ran and had a real Post-Campaign Report filed.
**Severity:** Low–Medium (reporting nuance, not a crash or data-loss risk; depends on how often Activities get archived after accumulating partial numbers).
**Root cause:** Same "one broad category standing in for two different meanings" pattern as 1.3, just at the Activity/Status level instead of Task/Status.
**Recommended fix:** Narrow that roll-up to `e.stage==='Done'` only (the value `savePostCampaign()` sets on genuine completion) — drop `Complete`/`Archive`/`Archived` from that specific set. Small, isolated change to already-merged code; flagging rather than changing it in this audit-only pass.
**Complexity:** S.
**Dependencies:** None.

### 1.5 — PR #89 cannot be verified live from here — what needs checking before merge
I re-read `findDependentWork()`/`cascadeArchiveJobWork()` critically against your three questions:
- **"Does SharePoint accept the proposed Cancelled status?"** — unknown from code alone. If the `Status` column on Shared Work Items or Personal Tasks is a strict Choice field without a `Cancelled` option, the group PATCH fails and `patchImportOptionalFields()`'s existing per-field retry correctly falls back and reports it as a **named failure** (not a silent success) — so the failure mode is safe, but whether it actually succeeds needs a live SharePoint check. If `Cancelled` isn't an accepted choice, the fix is a one-line addition to `SCHEMA_KNOWN_GAPS`/a SharePoint choice-list edit, not a code change.
- **"Are dependent tasks located correctly?"** — confirmed by code reading: `findDependentWork()` matches only on `campaignLookupId===ev.spId` (Shared Tasks) and `linkedActivityId===ev.id` (Personal Tasks), both stable SharePoint ids, never title. This matches your explicit rule. Can't be fully confirmed without live data that actually has these links populated.
- **"Does the cascade work end to end?"** — logically yes (traced the full call path from `archiveCampaign()`/`denyCampaign()` through to the PATCH calls and local state updates), but has never run against real SharePoint.
**Recommended before merge:** a single controlled live test — one test Activity with one linked Shared Task and one linked Personal Task (if you have Personal Tasks access), archive it, confirm both tasks end up `Cancelled` in SharePoint and disappear from My Work/My Tasks/Team Workload, then run **Orphaned Task Repair** (Schema Tools) to confirm the scan comes back clean. This is exactly Phase 8 test #1 from your file-management brief.
**Complexity:** N/A (testing, not code). **Dependencies:** none — can be done as soon as you're ready, independent of everything else in this audit.

---

## 2. Venue Spreadsheet Import

### 2.1 — The Activity bulk importer is CSV-only with a rigid, exact-header requirement
**Location:** `readBulkImportFile()`: `const required=['Title','Venue','Start','End','Activity Type']; const missing=required.filter(header=>!Object.prototype.hasOwnProperty.call(rows[0]||{},header)); if(missing.length)throw new Error('Missing CSV columns: '+missing.join(', '));`
**Expected:** Flexible mapping — read whatever columns the venues' existing spreadsheet actually has.
**Actual:** Exact column header match required (`Title`, `Venue`, `Start`, `End`, `Activity Type`, plus optional ones read by exact name in `optionalImportFields()`). No mapping UI. No XLSX support in this specific importer (despite the `xlsx` library already being loaded and used elsewhere in this same file). Any deviation — different header wording, extra columns, different order — throws immediately.
**Severity:** High for your stated goal (this *is* "forcing the venues to recreate their spreadsheet in a rigid template").
**Root cause:** Built for a known, fixed CSV export format, not general spreadsheet ingestion.
**Recommended fix — and the best news in this audit: you already have the exact pattern you want, built and working, just for a different list.** The **Key Dates importer** (`readKeyDateImportFile()`, `KD_IMPORT_FIELDS`, `autoMapKeyDateHeaders()`, `renderKeyDateImportMapping()`) already does everything Phase 2 of your file-management brief asked for: reads CSV *and* XLSX (via the same `xlsx` library, multi-sheet aware), extracts real headers from the file, auto-maps them to known fields via alias lists (e.g. `title` matches any of `title`/`event`/`event name`/`name`/`ship`/... ), shows an editable mapping UI before anything is read as data, and only then runs its own preflight/duplicate check. **Port this pattern to the Activity importer** instead of building a new one: define an `ACTIVITY_IMPORT_FIELDS` alias table (reusing the bulk importer's existing field list — Title, Venue, Start, End, Activity Type, Long Description, Member/Regular Price, Supplier, Product, Loaded Rewards), reuse `autoMapKeyDateHeaders()`'s matching logic generically, and reuse the **existing, already-good** duplicate-detection in `preflightBulkImport()` (title+venue+date-overlap, plus the `ImportRef` tag for stable re-matching across repeated imports) rather than rebuilding that part at all.
**Complexity:** M — it's substantially *reuse*, not new architecture; the main new work is the generic field-alias config and wiring the existing mapping-UI pattern to a second importer.
**Dependencies:** None technically, but **you've said the venues haven't finished updating their source spreadsheet — don't build this yet, and definitely don't run an import against partial data.** This is accurately scoped as "audit and plan only" per your instruction.

### 2.2 — Unclear whether updating an existing record (the "repair" path) avoids re-triggering Power Automate
**Location:** `runBulkImport()`'s repair path (PATCHing an existing matched Activity) vs. its create path (POSTing a new Campaigns item).
**Expected:** Updating an existing Activity during import must never re-trigger Power Automate's folder creation or create a duplicate folder.
**Actual:** Not something I can verify from this codebase alone — Power Automate's trigger condition lives in Power Automate itself, not in this repo. A PATCH to an existing item is very unlikely to re-fire a "when an item is created" trigger, but I can't confirm that without seeing the flow's actual trigger configuration, which per your standing instruction I'm not to touch or inspect-by-changing.
**Severity:** Medium (real risk if wrong, but likely already safe given Power Automate trigger conventions).
**Recommended fix:** Not a code fix — a one-time confirmation: check the flow's trigger type in Power Automate (should be "when an item is **created**", not "created or modified"). If it's already created-only, nothing to do. Flagging so it's verified once, consciously, before any real import runs.
**Complexity:** N/A (verification). **Dependencies:** none.

### 2.3 — The existing importer's hardcoded cutoff date may reject legitimate historical venue rows
**Location:** `preflightBulkImport()`: `else if(start<'2026-07-01'){status='invalid';reason='Before the approved 1 July 2026 cutoff';}`
**Actual:** Any row starting before 1 July 2026 is marked invalid outright, regardless of source. If the venues' spreadsheet includes anything earlier (past events worth having on record, or activities that started before the cutoff and ran past it), this importer will reject them with no override.
**Severity:** Low (configuration, not a bug) — flagging since it's exactly the kind of silent discard your brief says to avoid ("Preserve unmapped information for review rather than silently discarding it").
**Recommended fix:** When the new mapping-based importer is built (2.1), make this a configurable/reviewable threshold rather than a hard `throw`-equivalent invalid, or at minimum report *why* clearly in the per-row preview so nothing is dropped without the person doing the import seeing exactly which rows and why.
**Complexity:** S (bundle into the 2.1 rebuild). **Dependencies:** 2.1.

---

## 3. Historical SharePoint Files

### 3.1 — No index exists linking SharePoint files to Activities/Projects/Jobs today
**Location:** N/A — doesn't exist. The only per-Activity file link in the whole app is the single `JobFolderURL` column (one link, written once by Power Automate). Digital Media (the SharePoint document library Photo Tagging browses) has no metadata connecting any file back to an Activity, Project or Job at all.
**Expected:** Existing files discoverable from within the Hub, matched to Activities/Projects/Jobs, with an Unlinked Files review queue for anything that can't be matched automatically.
**Actual:** Nothing to match with yet — no metadata model, no index, no queue.
**Severity:** N/A (greenfield, not a bug) — this is genuinely new work, confirming Phase 3's framing.
**Recommended approach:** Don't scan the whole library on every page load. Microsoft Graph's `/delta` query on a drive (`GET /drives/{id}/root/delta`) is built exactly for "give me what changed since last time" — the natural mechanism for "incremental indexing... without repeatedly importing the entire library." Store the last delta token (e.g. in a small SharePoint list row, or `localStorage` per-admin as a starting point) and resume from it on each scan. Match files to Activities by the most reliable identifier available — likely a folder-path convention under each Activity's own `JobFolderURL` folder, or a lightweight metadata column on the file itself — with anything that can't be matched landing in an "Unlinked Files" view rather than being silently skipped.
**Complexity:** L (new indexing job, new metadata/queue UI, real design decisions about the matching rule that should be reviewed before building, per your explicit "do not rebuild... before I provide the existing design reference" caution applying here too in spirit).
**Dependencies:** Should follow Phase 2's manual-tagging work (section 4 below) so there's a metadata model to attach matches to, rather than inventing two metadata systems back to back.

### 3.2 — File permissions, versions, IDs: already correctly deferred to SharePoint
**Location:** Every file-touching code path in the app (Digital Media browsing, Photo Tagging, the single `JobFolderURL` link).
**Actual:** Confirmed — nothing in this app re-implements SharePoint permissions, file IDs, or version history. Every file operation goes through Microsoft Graph with the signed-in user's own token, so SharePoint's own ACLs, ids, URLs and version history are already the source of truth and are never duplicated. This is correct and should stay this way for Phase 3 work — nothing to fix here, just confirming it as a sound foundation.

---

## 4. Activity Detail Workspace

**Not touched in this audit's code, per your explicit instruction to wait for the design reference.** Documenting current shape only, so the eventual tab refactor has an accurate starting map:

`renderActivityDetail()` builds one continuous page/popup in sequence: core identity fields (title, venue, dates, type/group/subtype) → conditional template fields per Activity Group (Food & Beverage / Events & Entertainment / Promotions & Offers / Loaded Rewards — four separate conditional blocks added this session) → Loaded Rewards setup (App fields + per-tier Offer Mechanics + Communications/Redemption) → Supplier & Product → Specialist Briefs (Website/Meta/Google Ads/SMS) → POS → Channels/Artwork needed → Design Brief → linked Tasks/Personal Tasks → Reporting (Post-Campaign Report) → approvals. All in one scroll, which matches your "too overwhelming, too long" assessment exactly — there's a lot of real, working functionality in there, it's just all visible at once regardless of which part someone currently needs.

Rough mapping to your proposed tabs, for when you're ready:
- **Overview** — core identity fields, stage/status, health check, next action.
- **Activity / Campaign Brief** — Activity Type/Group/Subtype, conditional template fields, Loaded setup, Supplier & Product.
- **Copy & Messaging** — Description/Long Description, Specialist Briefs (Website/Meta/Google Ads/SMS/Newsletter), App copy fields. (This is also where the still-unresolved "which Copy section did you mean" question from the earlier taxonomy audit would finally get settled, once you're looking at both candidates side by side in context.)
- **Jobs & Tasks** — linked Shared Tasks, Personal Tasks, Design Brief, approval history.
- **Artwork & Files** — JobFolderURL, Design status, (future) linked Digital Media assets.
- **Results & History** — Post-Campaign Report, Reporting & Performance figures, archive/audit trail.

This reuses every existing field and data source already there — no new SharePoint columns, no duplicate forms — it's purely a presentation reorganisation. Not started; waiting on your reference design as asked.

---

## 5. Functional audit — core journeys

| Journey step | Works? | Persists to SharePoint? | Reloads correctly? | Related views update? | Permissions enforced? | Errors reported clearly? | Duplicates/orphans risk? |
|---|---|---|---|---|---|---|---|
| **Submit → Intake** | Yes | Yes (`submitEvent()`, with removable-groups retry for unconfirmed columns) | Yes | Yes | `canEditCampaigns()` gate on edit, open submission for all signed-in users | Yes — per-field retry names exactly which fields were dropped | Low — `ImportRef`/title+venue+date matching only applies to bulk import, not manual submit; a genuine duplicate manual submission isn't blocked, but that's a people-process question, not a code defect |
| **Approval → In Design** | Yes | Yes (`approveCampaign()`) | Yes | Yes | `canApproveCampaigns()` | Yes | The approval→task-generation preview/confirm flow (fixed earlier this session) already prevents double-task-creation via `DesignJobCreated` |
| **Activity → Job (manual ticket)** | Yes | Yes (`submitJob()`, writes `CampaignLookupId`) | Yes | Yes | Open to signed-in users | Yes | Low — id-based linkage, already fixed earlier this session |
| **Job → Task** | Yes | Yes | Yes | Yes, **except** `renderDesign()` (finding 1.2) | n/a | Yes | See 1.2 |
| **Task → Artwork** | Partial | `DesignStatus`/`AssetsNeeded` persist; no link to an actual file exists yet (section 3) | Yes for what exists | Yes for what exists | n/a | Yes | None found — just genuinely not built yet |
| **Completion** | Partial | Yes for the Activity's own fields; **no dependent-work check** (finding 1.1) | Yes | **No** — a completed Job with open tasks doesn't prompt or resolve anything | `canEditCampaigns()` | Yes for what it does do | **Confirmed gap** — this is finding 1.1 |
| **Archive/Deny** | Yes, pending live verification | Yes, including cascade (PR #89, not yet merged) | Yes | Yes, including My Work/My Tasks/Dashboard (PR #89) | `canEditCampaigns()`/`canApproveCampaigns()` | Yes — partial-failure messages name what couldn't be cancelled | Addressed by PR #89; see 1.5 for what still needs a live check |
| **Delete** | Does not exist | n/a | n/a | n/a | n/a | n/a | n/a — flagged in PR #89's own description as deliberately deferred, not forgotten |

No new duplication or orphan-record defects were found beyond what's already listed above and in `docs/FILE_MANAGEMENT_AUDIT.md`.

---

## Proposed PR sequence (nothing below has been built; this is the plan to review)

1. ~~Vision API key removal + graceful disable~~ — **done this session** (see below), since it was explicitly requested as an immediate action, not part of the paused workstream.
2. ~~isTaskDone() reporting fix inside PR #89~~ — **done this session**, as a commit onto the still-open, still-unmerged PR #89, since it's a bug in that PR's own unreleased change.
3. **Live-verify PR #89** per 1.5, then merge (your call, your test).
4. **`renderDesign()` archive filter fix** (1.2) — one line, isolated, very low risk. Small enough to bundle with #5 or ship alone.
5. **Job Completion dependent-work prompt** (1.1) — reuses PR #89's finder, adds a resolution picker instead of auto-cancel.
6. **Activity-level Performance roll-up fix** (1.4) — one line in already-merged code, isolated.
7. **Venue spreadsheet importer** (2.1/2.2/2.3) — only once the venues' source spreadsheet is actually finished, per your own instruction. Reuses the Key Dates importer's mapping engine rather than inventing a new one.
8. **Manual bulk-tagging** for Digital Media (your explicit priority over AI tagging) — single-image manual tagging already exists (`ptEditTags`); multi-select "apply to many" doesn't yet. Small, additive, no new infrastructure.
9. **Historical file indexing** (section 3) — larger, needs the matching-rule design decision made consciously before building.
10. **Activity Detail tabs** (section 4) — waiting on your reference design.

---

## What was actually changed this session (the two explicitly-approved items, not the paused workstream)

1. **Google Cloud Vision API key removed from the public JavaScript** (`GOOGLE_VISION_API_KEY` is now blank, with a comment explaining why and what re-enabling it safely would need). Photo Tagging's browsing, folder navigation, whole-library search and **existing manual tag editing** (`ptEditTags`/`ptSaveTagsManually` — already existed; the earlier Phase 0 audit incorrectly said no manual tagging UI existed, corrected here) all continue to work exactly as before, gated only on `DIGITAL_MEDIA_DRIVE_ID` now, never on the Vision key. Where the AI-tagging button used to appear, there's now either nothing (key absent) or a calm "AI-assisted tagging is currently disabled — tag by hand" notice instead of a broken button or a repeated API-error message. No new key, paid service or backend introduced.
2. **`isTaskDone()` fix** inside the still-open PR #89, per finding 1.3 above.

Both are small, isolated, and don't touch Power Automate, SharePoint permissions, or anything in the paused workstream.
