# Calendar, Dashboard & Artwork Audit

**Chat:** `01 · Core OS & Calendar` (calendar/overview, projects/tasks, navigation, data integrity, QA).
**Scope:** the "audit and clean the Marlin Marketing OS" brief, focused on Calendar, Dashboard and (to confirm it needn't change) Artwork.
**Method:** read-only code inspection of `index.html` at `main` @ `878f31d` (17 Nov 2026). No SharePoint data, columns, or flows were read, changed, or touched. Every citation below was opened and re-verified directly against that commit — nothing here is taken on a sub-agent's word alone; two findings from the initial pass were corrected after direct verification (see §2.4).
**Not done:** a live-site check, a SharePoint column dump, or any runtime/sign-in test. Those need a live session against the real tenant, which this audit didn't have. Treat every "Wired"/"confirmed" label below as *the code does this*, not *this has been seen working against production data*.

---

## 1. Confirmed bugs (ranked by impact)

### 1.1 "Overdue" is computed from start date alone, never end date — `healthCheck()`
**index.html:7296-7315.** This is the single root cause behind activities like a standing weekly special or a members-lounge perk showing as overdue purely because they launched a while ago.

```js
function healthCheck(ev){
  if(!ev||!ev.start)return{level:'green',label:'No date'};
  const stage=ev.stage||'Intake';
  ...
  if(stageIdx>=doneIdx)return{level:'green',label:'Complete'};
  const daysOut=Math.round((new Date(ev.start+'T00:00:00')-new Date())/864e5);
  if(stageIdx===liveIdx)return{level:'green',label:'Live'};
  if(daysOut<0)return{level:'red',label:'Overdue — event passed'};   // line 7307
```

`ev.end` is never read in this function. Anything whose `WorkflowStage` hasn't been manually bumped to exactly `'Live'` or past `'Done'` — plausible for an always-on fixture that was never pushed through a one-off approval pipeline — goes red the moment its original `start` date is in the past, regardless of whether it's still genuinely running.

Used by: Cross-Venue cards/timeline (`cvRenderVenue`/`cvRenderTimeline`, index.html:7607/7626), Gantt, Venue-Monthly, and **Projects' own "at risk" calculation** (`renderProjects`'s `risksFor`, index.html:13416 — confirmed directly, not from a sub-agent report: `const risky=linked.filter(ev=>healthCheck(ev).level==='red');`). So this one function's blind spot also pollutes the Projects page's risk list, not just Calendar-adjacent views.

By contrast, the generic *task*-lateness check used everywhere else (My Work, Dashboard, Personal Tasks, Design Jobs) is correctly `task.due && task.due<today` — a task's own due date, never an activity's start date. **Only `healthCheck()` conflates the two.** This matches the brief's own distinction exactly: a live promotion is not overdue merely because its start date is old.

### 1.2 "All Venues" activities duplicate under every venue — confirmed in exactly two places
Not a data problem, not Cross-Venue's grouping (which is clean — see §2.1) — it's two specific per-venue render loops that both independently OR-in `'All Venues'` while iterating venues:

- **Dashboard → "This Month" widget**, `renderDashThisMonth`, index.html:7963:
  ```js
  venues5.map(v=>{
    const vEvts=thisMonthEvts.filter(e=>e.venue===v||e.venue==='All Venues');
  ```
  Any `venue==='All Venues'` activity (e.g. a cross-venue Loaded Rewards push) renders once per venue card — **6 times**, on the exact widget the original "November overview" complaint is almost certainly describing.
- **Gantt, day mode**, index.html:9396-9397:
  ```js
  venueOrder.forEach(vn=>{
    const vEvts=evts.filter(e=>e.venue===vn||e.venue==='All Venues');
  ```
  Same mechanism, same result, inside Gantt's per-venue swimlanes.

**Cross-Venue itself does not have this bug** — `cvRenderVenue`/`cvRenderTimeline` group strictly by literal `e.venue`, so an `'All Venues'` activity gets exactly one group of its own there. The other ~8 hits of `e.venue==='All Venues'` found in the file (Calendar's day/week/month views, line ~10092 onward) are a different, correct pattern: *when the viewer has picked one venue to filter by, also show cross-venue items* — a single-result inclusion filter, not a per-venue loop, so not a duplication bug.

**Inconsistent handling elsewhere (opposite failure):** the Dashboard's `loadedcampaigns` and `venuesnap` widgets filter with plain `e.venue===venue`, with **no** `'All Venues'` handling at all — so a cross-venue Loaded Rewards campaign silently *disappears* from those two widgets whenever a specific venue is selected. Two different wrong behaviors (duplicate vs. vanish) from two independently-written implementations of "which venue(s) does this belong to."

### 1.3 Dashboard: the same concepts are computed 3-5 separate times
`renderOverview` (index.html ~7850-8230) renders 16 registered widgets. None of this is wrong data, exactly — but the brief asks for "a small number of non-duplicative, actionable summaries," and right now:

- **`mypriorities`, `overdueblocked`, `mytasks`** each independently re-derive from the same `myWorkItems()` call, re-filtered three separate times for overlapping conditions (overdue/blocked/open-by-due-date) — three different views of one list, not memoized, not sharing a filter.
- **`needsaction`** hand-rolls its *own*, fourth, independent "Blocked" check straight off `MY_TASKS.filter(status==='Blocked')`, bypassing `myWorkItems()` entirely — it can silently disagree with the other three if `myWorkItems()`'s own filtering ever changes and this one doesn't.
- **`next14days`, `thismonth`, `upcominglaunches`** are three separately hand-coded date-window queries over `EVENTS` — three different "what's coming up" definitions (14-day overlap; month-overlap + duration ≤45 days; `Ready for Live` or `Live`-within-30-days) that read as one concept to a user.
- A fifth, independent "completed"/financial roll-up lives inline in `renderOverview`'s own "Results snapshot" block (~8100-8110), reading `EVENTS` directly — not shared with `charts` or anything else.
- `reportrequired` is registered as a widget id/title but no distinct render call for it was found inside `renderOverview` — likely orphaned since its content folded into `needsaction`. **Not confirmed dead, flagged for a direct check before removing anything.**

This is a design/maintainability finding, not a single bug: five independent "what matters right now" calculations is exactly the "competing dashboard surfaces" the brief asks to reduce.

### 1.4 Design Jobs, Workload and Oversight each reimplement their own urgency logic too
Beyond Dashboard: `renderDesign` has its own `designBriefDue<=week` formula; `renderWorkload` buckets by its own `overdue`/`thisWeek`/`nextWeek` split over `EVENTS+MY_TASKS`; `renderOperationsMap` computes its own `task.due<today`/blocked/critical grouping over `MY_TASKS` only. Three more independently-coded "what's late" definitions, on top of Dashboard's five and `healthCheck()`'s one. None of these are each individually wrong (the task-lateness ones all correctly use a task's own due date) — the finding is that there is no single shared helper for "is this late," so each page's definition can drift from the others without anyone noticing.

---

## 2. What is *not* a bug (verified directly, not just reported)

### 2.1 Cross-Venue's grouping is clean
Confirmed directly: `cvRenderVenue`/`cvRenderTimeline` (index.html:7607/7626) group strictly by literal `e.venue`. No duplication there — see §1.2.

### 2.2 Artwork is a clean read/display layer — already matches the brief's intent
`renderArtwork` (index.html:11638, confirmed structure): no upload UI, purely reads `e.eventImageUrl||e.artworkFile` to decide Featured vs. Missing. A card click opens the real Activity record (`showActivityPage`); a missing-image slot opens the *same* photo picker the Activity detail page itself uses — one source of truth, not a second data-entry destination. This already satisfies the brief's "Artwork should not become a duplicate data-entry destination" requirement as-is. Calendar's Day view already deliberately borrows this visual language (image-left/detail-right card, colour-coded border) — confirmed in an explicit comment at its definition.

### 2.3 Job Folder automation's known failure mode is already documented and worked around
A comment at the Job Folder helpers (index.html ~7580) explains the Power Automate flow that's meant to create `JobFolderURL` on approval has failed on at least one known-bad Activity Title pattern; the Hub already ships a manual fallback (link an existing folder, or create one) rather than trying to fix the flow itself. This predates this audit and is unrelated to Calendar/Dashboard — noted for completeness only. `pickEvPhoto`/`linkEvJobFolder`/`createEvJobFolder` were separately fixed for a Hyperlink-column write-shape bug in PRs #135/#137 and look structurally sound now.

### 2.4 Correcting an initial hypothesis: missing End dates do **not** currently cause activities to silently vanish
An earlier pass flagged inconsistent `e.end` vs. `(e.end||e.start)` fallbacks across Week/Day/Gantt/Month as a "silently drops activities with no End date" bug. Direct re-verification shows this isn't actually reachable: `loadCampaigns()` (index.html ~5558, `end:endDate` where `endDate=f.End?...:(recurringDay.length?'<5 years out>':f.Start)`) already guarantees every loaded `EVENTS` item has a non-blank `.end` — defaulting to the Start date for a single-day item, or five years out for a recurring one with no explicit End, specifically so a recurring item is never mistaken for finished. Every code path that creates new Activities (duplicate-as-next-month, bulk import) reloads via this same mapping afterward.

So `e.end` is never actually blank in practice, and the scattered `(e.end||e.start)` fallback seen in some call sites (Month, Dashboard's `thismonth`/`next14days`) is dead/defensive code with no real effect — its *absence* in other call sites (Week, Day, Gantt, Venue-Monthly, `calEventsForDate`) is equally harmless today, for the same reason. **This is downgraded from "active bug" to "redundant, inconsistent-looking code that could mislead a future reader into thinking it's a safety net" — worth tidying for clarity when touching this code anyway, not an urgent fix on its own.**

What *is* real and still open: whether every one of the seven Calendar sub-views does a correct **date-range overlap** (start ≤ month-end AND end ≥ month-start) versus some simpler "start falls within X" check — these do differ in form across views (see §2.5) even though the specific "blank End" failure mode doesn't apply.

### 2.5 Calendar's date-overlap logic is duplicated ~10 times, not shared
Every sub-view (and several smaller helpers — `renderCalMonthlyFeatures`, `showCalDayPopup`, `renderVenueWeeklySpecials`) has its own inline `new Date(e.start+...) / new Date(e.end+...)` comparison. They all currently agree in outcome (per §2.4), but there is no single shared "does this activity overlap this date range" function — which is exactly the kind of duplication that lets one view's logic quietly diverge from the others the next time someone touches just one of them. This is the main structural finding behind the brief's "one logic, one record set" requirement for the new Calendar design (§4).

---

## 3. Page → data-source map

| Page | Panel id | Render fn | Source | Notes |
|---|---|---|---|---|
| Dashboard | `overview` | `renderOverview` | `EVENTS`, `MY_TASKS`, `PERSONAL_TASKS` (via `myWorkItems()`), `PROJECTS`, `KEY_DATES` | 16 widgets, see §1.3 |
| My Work | `mywork` | `renderMyWork` | `myWorkItems()` (Personal + Shared-assigned-to-me + flagged Activities) | Already the one agreed to-do home (My Work Plan Phases 1-2) |
| Inbox | `inbox` | `renderInbox` | Activity Comments list | — |
| Personal Tasks | `personaltasks` | `renderPersonalTasks` | Personal Tasks list | Hidden from nav, reached via My Work link (Phase 2.3) |
| Calendar | `calendar` | `initScheduleView` → 7 sub-views | `EVENTS` (+ Calendar Reference for holidays) | See §1.1, §1.2, §2.5; sub-views: Day (`renderCalendarDay`), Week (`renderCalendarWeek`), Month (`renderCalendar`), Year (`renderCalendarYear`), Gantt (`renderGantt`/`_renderGanttInner`), Venue Monthly (`renderVenueMonth`), Cross-Venue (`renderCrossVenue`) |
| Activities | `campaigns` | `renderCampaigns` | `EVENTS` | List/table view of the same record set as Calendar; now has bulk select/edit (PR #141) |
| Artwork | `artwork` | `renderArtwork` | `EVENTS` (`eventImageUrl`/`artworkFile`) | Clean, see §2.2 |
| Idea Bank | `ideas` | — | Ideas list | — |
| Submissions | `approvals` | `renderApprovals` | `EVENTS` (stage Intake/Review) | Approval → job-task preview via `openApprovalPreview`/`confirmApprovalTasks` (hardcoded `PLAYBOOK_TEMPLATES` — see separate Job Templates proposal review, not part of this audit) |
| Projects | `projects` | `renderProjects` | `PROJECTS`, linked `EVENTS` via `projectId` | Own "at risk" list reuses the buggy `healthCheck()` — see §1.1 |
| Team Work Register | `mytasks` | `renderMyTasks` | Shared Work Items (`MY_TASKS`) | Admin/config view |
| Design Jobs | `design` | `renderDesign` | `EVENTS` (stage In Design, or `designBriefDue`) | Own urgency formula, §1.4 |
| Workload | `workload` | `renderWorkload` | `EVENTS` + `MY_TASKS` | Own urgency formula, §1.4 |
| Loaded Rewards | `loaded` | `renderLoaded` | `EVENTS.loadedRewards` + Offer Variants/Mechanics | Straightforward filtered view, no new issues found |
| Ticketing | `ticketing` | `renderTicketing` | `EVENTS.ticketed` | Straightforward filtered view |
| Specials | `specials` | `renderSpecials` | **None** | Confirmed static placeholder: literal "This page isn't connected to a live data source yet." |
| Social | `social` | `renderSocial` | **None** | Confirmed static placeholder, suggests asking Kim about a real source |
| Contacts & Mailing | `crm` | — | 8 CRM lists | Parked per `docs/OS_RESET_MASTER.md` D-2 |
| Venues | `venues` | — | `VENUES_DATA` (hard-coded JS, not SharePoint) | Confirmed still true, pre-existing tech debt, out of this audit's scope |
| Oversight | `operations` | `renderOperationsMap` | `MY_TASKS` only | Own urgency formula, §1.4; overlaps Workload |

Full `LIST_IDS` mapping (index.html:2642) matches `docs/OS_RESET_MASTER.md` §2 and was reconfirmed unchanged at this commit.

---

## 4. Source-of-truth definitions (confirmed, for the brief's §3 requirement)

- **Activity lifecycle** (`Status` field, confirmed choices): `Active`, `Paused`, `Cancelled`, `Archive` — comment at the field mapping (index.html:5534) names these exactly.
- **Work stage** (`WorkflowStage` field, `CANONICAL_STAGES`): `Intake`, `In Design`, `In Build`, `Review`, `Ready for Live`, `Live`, `Done`.
- **Archived** (`isArchived(e)`, index.html:4563): `true` if `Status` is `Cancelled`/`Archive`/`Archived`, **or** `Stage` is `Done`/`Cancelled`. Correctly keeps the two concepts separate — this function is not part of the problem.
- **Task lateness**: `task.due && task.due < today` on a Shared or Personal Task record — confirmed consistent everywhere it's used (My Work, Dashboard, Personal Tasks, Design Jobs).
- **The one broken concept**: `healthCheck()`'s red/amber/green "at risk" signal (§1.1) conflates "is the activity's start date in the past" with "is this activity on schedule," producing the false positive the brief describes. It is not the same thing as either lifecycle Status or task lateness, and should not be read as either.

---

## 5. Prioritized fix list

All five of these are **UI/query-logic changes only — no SharePoint schema, data, or flow changes** — so per the brief's own rules they can be implemented and reviewed in a branch without waiting on a separate data-cleanup sign-off.

1. **Fix `healthCheck()`** to use `ev.end` (already reliably populated, §2.4) instead of only `ev.start`, and to stop calling an always-on item "overdue" just because `WorkflowStage` hasn't been bumped to `Live`. This is the highest-impact, most isolated fix — one function, used in 4+ places, zero schema impact.
2. **Fix the two confirmed "All Venues" duplication sites** (`renderDashThisMonth`, Gantt day mode) to render a cross-venue activity once, in a clearly-labeled "All venues" position, instead of once per venue row.
3. **Fix the opposite bug** in `loadedcampaigns`/`venuesnap` so a venue-filtered view doesn't silently drop cross-venue activities either.
4. **Extract one shared date-range-overlap helper** and have Calendar's sub-views, the Dashboard's date-window widgets, and the smaller helpers (`renderCalMonthlyFeatures`, `showCalDayPopup`, `renderVenueWeeklySpecials`) call it instead of each hand-rolling the comparison — removes the duplication in §2.5 before it can drift.
5. **Design and build the new Calendar month-overview default view** per the brief's §1 — this is the bigger piece, proposed separately below, and depends on (4).

Dashboard de-duplication (§1.3) and the Design Jobs/Workload/Oversight urgency-formula consolidation (§1.4) are real findings but lower urgency than the Calendar-facing bugs above, since they're about redundant effort and drift-risk rather than a currently-wrong number on screen. Recommend sequencing them after the Calendar work, as their own focused pass.

---

## 6. Proposed Calendar target design (brief §1)

- **Default view**: a month overview (not Day, not Gantt) — month/year label with prev/next, venue and activity-type filter chips that are easy to spot and reset.
- **Inclusion rule**: one shared helper — `activityOverlapsRange(ev, rangeStart, rangeEnd)` — returning true when `ev.start <= rangeEnd && ev.end >= rangeStart`. Since `ev.end` is already reliably populated (§2.4), this needs no new "what if End is missing" guesswork; it does need an explicit, visible flag (not a silent default) for the rare case a record truly has no parseable Start at all, per the brief's "don't guess, flag for review" instruction.
- **Grouping**: by venue, with cross-venue (`venue==='All Venues'`) activities shown exactly once in their own "All venues" group — fixing §1.2 as part of the same rewrite rather than patching the old duplication sites in place.
- **Card**: activity name, venue, start/end, a status chip computed from the corrected lifecycle rules (§4) — not from `healthCheck()` as it stands today — and a small artwork/design indicator reusing Artwork's existing `eventImageUrl||artworkFile` check (§2.2), so Calendar and Artwork read the same field rather than inventing a second "does this have art" signal.
- **Distinctions**: live-this-month / starting-this-month / ending-this-month / upcoming / needs-attention, derived from the corrected Status + Stage + task-lateness definitions (§4), each labeled plainly rather than folded into one ambiguous "overdue."
- **Secondary views**: Day, Week, Year, Gantt, Venue Monthly and Cross-Venue stay reachable as they are today — the brief asks to keep them available, not remove them — but should be migrated onto the same shared overlap helper (§2.5) so they can't silently diverge from the new default view's rules.
- **Visual language**: extend Day view's existing Artwork-style card (image-left/detail-right, colour border) to the Month overview's cards, rather than inventing a new visual system.

---

## 7. Decisions needed before/alongside implementation

- Confirm the "needs attention" / status-chip wording with Kimberley before shipping — the brief is explicit that "overdue" must mean something specific and documented, not a vibe.
- `reportrequired` Dashboard widget (§1.3): confirm it's genuinely orphaned before removing it from the widget registry.
- Sequencing: this audit recommends Calendar fixes (§5 items 1-5) before the Dashboard/Design-Jobs/Workload de-duplication pass — confirm that priority order works for how you want to use the time.

## 8. Explicitly out of scope for this audit

No SharePoint list, column, or Power Automate flow was read, created, or changed. `VENUES_DATA` being hard-coded, the Job Folder flow's known failure mode, and the CRM parked-write-risk (`docs/OS_RESET_MASTER.md` D-2) are pre-existing, already-documented items this audit did not re-litigate.
