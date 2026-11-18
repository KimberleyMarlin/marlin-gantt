# Claude Code handoff — 18 Nov 2026: work queue + Calendar fixes (CAL-02 / CAL-03)

**Repo:** `KimberleyMarlin/marlin-gantt` · **File:** `index.html` (pull fresh `main` before each PR)
**Read first (in the repo):** `docs/CALENDAR_DASHBOARD_AUDIT.md` (PR #154), `docs/OS_RESET_MASTER.md`, `docs/HIDDEN_MODULES.md`, `docs/DESIGN_SYSTEM.md`
**Written by:** Claude Project 01 (coordination). Line numbers come from the audit write-up or from an older copy, so **verify each one against live `main` before acting on it.**

> ### Repo check, 18 Nov (read-only, `main` @ `04c93cf`)
> Done before this handoff was sent. Step 0 should confirm it, not repeat it.
> - **#154** (Calendar/Dashboard audit) is merged.
> - **#155 "Fix overdue false-positives and All-Venues duplication"** is merged. **Review it against sections 3.2 and 3.4 below** and only do what's still missing. Don't start CAL-FIX-2 or CAL-FIX-4 from scratch.
> - **PR-1 / SAFE-02a** is done (#134). Queue item 5 is dropped.
> - The **10 Nov photo/folder links fix** is merged (#137). The **12 Nov `ad-report.html` patch is not** in the repo.
> - **Vision key:** removed from the code (#147). It's still in the git history, so Kim still needs to revoke or restrict it in Google Cloud (K-1).
> - `CRM_WRITE_ENABLED` is still `true` (K-3).
> - The **brand is adopted** (#139, #140). Visual rules are in `docs/DESIGN_SYSTEM.md`.
> - **UX-03 and TASK-02 haven't started.**
> - **My Work** is the home page (#131). Where this file says "My Day", read **My Work**.

---

## 0. Status report first. No code yet.

Report these, then stop and wait for Kim:

1. Current `main` SHA, and any PRs merged after `04c93cf`.
2. What #155 changed, mapped against sections 3.2 and 3.4: what's covered, and what's still missing.
3. **Confirm or rule out the "today is yesterday" bug** (section 3.1). Paste the definition of every `today` / `todayStr` used for task lateness and the Calendar grid, and the value it gives in a Perth browser.
4. A list of open PRs and branches touching `index.html`.

---

## 1. Rules for this batch

- **One PR open on `index.html` at a time.** Merge it before starting the next, then pull fresh `main`. Several briefs touch the same file.
- **No SharePoint list, column or flow changes** in sections 2–3. UI and logic only.
- **Dates:** Perth (`Australia/Perth`). Date-only concepts are compared as `YYYY-MM-DD` strings. **Never fix a date bug by adding or subtracting a day.**
- **Visual system:** `docs/DESIGN_SYSTEM.md` (Work Sans, no red; use `--attention`/rust).
- **Hide, never delete** (`docs/HIDDEN_MODULES.md`).
- **Every PR:** before and after screenshots at 1440px and 390px, regression check (same records load, financial gating unchanged, Personal Tasks private), plus a `docs/CHANGELOG.md` entry.

---

## 2. Queue (in order)

| # | Item | Brief / spec | Depends on |
|---|---|---|---|
| 1 | **CAL-FIX-1 Perth date helper** | Section 3.1 | Step 0 item 3 |
| 2 | **CAL-FIX-2 Explicit activity status + attention reasons**: only what #155 didn't cover | Section 3.2 | 1 |
| 3 | **CAL-FIX-3 Shared, recurring-aware date-range helper** | Section 3.3 | 1 |
| 4 | **CAL-FIX-4 "All Venues" duplicate + vanish bugs**: only what #155 didn't cover | Section 3.4 | 3 |
| 5 | ~~PR-1 / SAFE-02a~~ | Done in #134 | — |
| 6 | **UX-03 Nav and shell**: step 0, then PR-2 to PR-6 | `docs/briefs/2026-11-17_UX-03_nav-and-shell_brief.md` | 1–4 merged |
| 7 | **TASK-02 Source link on tasks** | `docs/briefs/2026-11-17_TASK-02_source-link_brief.md` | Step 0 there; Kim creates 3 columns |
| 8 | **Calendar month overview (new default Calendar view)** | Audit section 6, with section 3 below | 3, 4, and UX-03 PR-3 (shared page header) |
| 9 | **UX-02 clarity pass** | `docs/briefs/2026-11-10_UX-02_clarity-pass_brief.md` | UX-03 merged |

**Not in this batch:**
- **Jobs / job templates** (the "5 new lists" proposal): waiting on Kim's scope decision. Don't create lists.
- **Dashboard de-duplication** (audit §1.3) and the **`reportrequired` widget**: folded into UX-03 PR-4 (the Dashboard folds into My Work). Don't clean up Dashboard widgets separately; only make the small CAL-FIX-4 change to them.
- **Design Jobs / Workload / Oversight urgency consolidation** (audit §1.4): after UX-03.

---

## 3. Calendar fix specs

### 3.1 CAL-FIX-1: Perth date helper

**Suspected bug (verify in step 0).** An older copy of the app uses this pattern in My Tasks and the Calendar month grid:

```js
const today=new Date();today.setHours(0,0,0,0);
const todayStr=today.toISOString().split('T')[0];
// and in the month grid:
const dateStr=realDate.toISOString().split('T')[0];
```

Local midnight in Perth is 16:00 UTC the previous day, so `toISOString()` gives **yesterday's date, all day**. If this is still in live code:
- Tasks are flagged late a day later than they should be (`task.due < todayStr`).
- Key dates and public holidays in the month grid land one day early (`dateStr` is matched against `KEY_DATES`).

**Fix:**
- Add two helpers near the other date utilities (reuse them if #155 already added equivalents):
  - `todayYMD()`: today's date in Perth as `YYYY-MM-DD`, using `Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Perth'})`.
  - `ymd(date)`: a locally constructed `Date` → `YYYY-MM-DD` from `getFullYear()/getMonth()/getDate()`, **not** `toISOString()`.
- Replace every `toISOString().split('T')[0]` (and `.slice(0,10)`) that turns a **local calendar date** into a string. List each site changed in the PR description.
- **Don't change SharePoint write payloads** in this PR (e.g. `DueDate: …+'T12:00:00Z'`). List any write-side uses you find as findings only.

**Tests:**
- In a Perth browser at 9am and at 7pm: `todayYMD()` equals the real date.
- A task due yesterday shows as late today; a task due today does not.
- A public holiday shows on its correct day in Month view, e.g. 25 Dec 2026 on Friday 25 Dec.
- Activities still appear on the same days as before.

### 3.2 CAL-FIX-2: explicit status + attention reasons

**Problem (audit §1.1):** `healthCheck()` set red/amber/green from start date only, never read end date, and called ongoing items "overdue". It feeds Cross-Venue, Gantt, Venue Monthly and the Projects at-risk list. **#155 addressed part of this: compare first.**

**Rule: "Overdue" applies to tasks only.** Activities never show "Overdue".

**Activity date state** (one value, from `ev.start`, `ev.end` and `todayYMD()`):

| State | Rule |
|---|---|
| `UPCOMING` → "Upcoming" | `start > today` |
| `LIVE` → "Live" | `start <= today && end >= today` |
| `FINISHED` → "Finished" | `end < today` |

Archived items (`isArchived(e)`, unchanged) are hidden as they are today. `Status = Paused` shows "Paused" instead of the date state.

**Needs attention** (separate from the date state; zero or more reasons, always shown as text):

| Reason code | Rule | Label |
|---|---|---|
| `TASKS_LATE` | Linked tasks (`CampaignLookupId`, title fallback as today) with `due < todayYMD()` and not complete | "{n} tasks late" |
| `PREP_BEHIND` | `start` within `ATTENTION_PREP_DAYS` (one constant, **14**) of today, not yet live, and `stage` is `Intake` or `In Design` | "Starts in {n} days, still in {stage}" |
| `CHECK_DATES` | No parseable `start` | "Check dates" |

- New function, for example `activityAttention(ev) → {state, reasons:[{code,label}]}`. Replace each remaining `healthCheck()` call site with it. Keep `healthCheck()` in place but unused, with a comment pointing to the replacement.
- **Colour:** no reasons → neutral; any reason → `--attention` (rust). No red, no traffic light.
- The Projects at-risk list uses `reasons.length > 0`.
- The wording and the 14-day threshold need **Kim's confirmation before merge** (section 4).

**Tests:**
- An activity that started last month and ends next week, with no late tasks → "Live", no attention.
- One that starts in 10 days at `Intake` → "Starts in 10 days, still in Intake".
- One with 2 late linked tasks → "2 tasks late".
- A finished activity → "Finished", not overdue.
- Cross-Venue, Gantt, Venue Monthly and Projects all show the same result for the same activity.

### 3.3 CAL-FIX-3: shared date-range helpers (recurring-aware)

The audit proposes one `activityOverlapsRange()` helper. **A plain span overlap would show a weekly recurring item (e.g. trivia every Tuesday, Jan to Dec) on every day.** The current month grid avoids this by checking `RecurringDay`. Keep that behaviour with **two** helpers:

- `activityOverlapsRange(ev, fromYMD, toYMD)`: `ev.start <= toYMD && ev.end >= fromYMD`. Use it for the month overview groups, Gantt bars, lists and the Dashboard date-window widgets.
- `activityOccursOn(ev, dayYMD)`: within the span **and**, if `ev.recurringDay` has values, the weekday matches. Move the existing `RecurringDay` logic from the month grid into this helper. Use it for Day, Week and Month day cells, and in `showCalDayPopup`.

Rules:
- Compare `YYYY-MM-DD` strings only; build range bounds with `ymd()`.
- Records with no parseable start are left out of views and counted in a visible "Check dates ({n})" link that lists them. Don't guess a date.
- Migrate the call sites the audit lists in §2.5 **one view per commit**, with a before/after record count for each view in the PR description. The counts should match, except where a difference is an intended fix; explain each one.

### 3.4 CAL-FIX-4: "All Venues" duplicates and disappearing items

**#155 addressed part of this: compare first.** From the audit: `renderDashThisMonth` and Gantt day mode showed an `All Venues` activity once per venue, and the `loadedcampaigns` and `venuesnap` widgets dropped cross-venue activities when a venue filter was on.

- An `All Venues` activity is drawn **once**, in an "All venues" group or row (top of the list or Gantt).
- When a venue filter is on, show items where `venue === filter || venue === 'All Venues'`. Apply it everywhere.
- Put this in one helper (for example `matchesVenueFilter(ev, venue)`) next to the date helpers.
- Dashboard widgets: smallest change only. They fold into My Work in UX-03 PR-4, which must reuse these helpers.

**Tests:** one `All Venues` activity appears once in Dashboard This Month and in Gantt day mode, and still appears in Loaded and Venue Snapshot when filtered to a single venue.

---

## 4. Waiting on Kim (not for Claude Code)

| # | Decision / action | Recommendation |
|---|---|---|
| K-1 | **Google Vision key**: removed from the code (#147) but still in the public git history | Revoke or restrict it in Google Cloud Console. IT can do this; no code needed. |
| K-2 | Activity status wording and the 14-day threshold (section 3.2) | Approve as written, or change the labels |
| K-3 | D-2: turn CRM writes off (`CRM_WRITE_ENABLED=false`) | Yes, contacts are moving to Emma |
| K-4 | Jobs scope (the "5 new lists" proposal) | See below |
| K-5 | TASK-02: create the 3 Source columns after its step 0 report | — |

**K-4: recommended Jobs scope (Project 01 view, pending the full proposal).** You want reusable job checklists stored as data, not code, with each task assignable to a person, starting with the rebrand rollout. That needs **one** new list, not five:
- **Templates** → one new list of template rows (template name, section, task, order, default role, lead days).
- **Jobs** → Marketing Projects records with a record-type column, as proposed. Add the Projects page split (tabs/filter) as an explicit step.
- **Job tasks** → rows in the existing **Tasks & Job Tickets** list, linked by the existing `ProjectId`, plus section and order columns. They then appear in My Work automatically, with no second task list.
- **Comments** → extend Activity Comments as proposed.

Column names are to be confirmed against the live schema. Fix the Personal list's `Sequence` save warning first, because ordering has already failed once.

---

## 5. Evidence to record for each PR

PR link, merge commit SHA, the screenshots listed above, and the tests run with results. Then update the item's status in `docs/OS_RESET_MASTER.md` (CAL-02 / CAL-03 rows) and `docs/HIDDEN_MODULES.md` where relevant.
