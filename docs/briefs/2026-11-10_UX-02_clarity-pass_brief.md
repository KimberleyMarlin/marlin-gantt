# Claude Code brief — UX-02 "Answer the common questions fast"

**Repo:** `KimberleyMarlin/marlin-gantt` · **File:** `index.html` (pull fresh `main` first — do not work from an old snapshot)
**Register links:** UX-01 (nav regroup), CAL-02 / CAL-03 (Calendar + Overview), SUB-01 (Submit)
**Read first:** `docs/DESIGN_SYSTEM.md`, `docs/CALENDAR_DASHBOARD_AUDIT.md`, `docs/OS_RESET_MASTER.md` (sections 2–3)

> **Update 18 Nov:** UX-03 runs first and sets the navigation and page shell. **PR-C changes:** the Dashboard isn't trimmed in place; it folds into **My Work** (the home page since #131), done as UX-03 PR-4. Several items here may already be partly done: #134 (honest save messages), #139/#140 (brand, Work Sans, no red), #155 (overdue false positives, All Venues duplicates) and the CAL-FIX work in the 18 Nov handoff. **In step 0, say which parts of each work package are already done, and skip them.** The visual rules are in `docs/DESIGN_SYSTEM.md`.

---

## 1. Goal

Make the OS answer the questions people actually ask, without them needing to understand how the SharePoint lists are organised:

| Question | Page that answers it |
|---|---|
| What's on this month (for my venue)? | **Calendar** |
| What creative is needed, and what's ready? | **Artwork** |
| What do I need to do next? | **Dashboard** (short action list) / **My Work** |
| What are the full details of this activity? | **Activity record** (opened from any of the above) |
| How do I add something new? | **Submit** (one route only) |

Each page gets **one job**. The same full list should not appear in several places.

**This is a presentation-layer pass.** No new panels, no new SharePoint lists or columns, no changes to how data is written.

---

## 2. Ground rules (apply to every change)

1. **Inventory before you change anything.** Do step 0 and stop for sign-off.
2. **Display labels sit on top of stable internal values.** Never rename a SharePoint choice value or column. Add a label map in the code (internal value → plain label) and use it everywhere the value is shown.
3. **Derived, not stored.** "Next action", "Needs review" and "Overdue" are calculated in the browser from existing fields. Nothing new is written to SharePoint.
4. **Don't invent fields or rules.** If a cue or flag needs a field that doesn't exist, list it as an open question. Do not add it.
5. **Dates are Australia/Perth, date-only.** "This month" and "upcoming" must use Perth calendar days. Never fix an off-by-one date by adding or subtracting a day; find the conversion.
6. **"Overdue" has a strict definition.** Only show it when there is a linked task with a due date in the past that isn't complete. Do not mark an activity overdue because of its own start date, stage or missing data. Lead-time deadlines (briefing date, creative deadline) aren't built yet, so they can't trigger it either.
7. **Hide, don't delete.** Anything removed from a page stays in the code behind a flag until a decision is logged.
8. **Small PRs.** One work package per PR (section 4), each easy to verify and roll back. If this session has no push access, deliver each as a branch + patch file.
9. **Preserve working behaviour.** Filters, edit paths, the photo/folder-link fix from 10 Nov and role-gating on financial fields must work exactly as before.

---

## 3. Step 0 — Inventory (report back, then stop)

Produce a short report covering:

- **Status values:** every distinct workflow stage/status value found in code (`WorkflowStage` and any others), where each is displayed, and a proposed plain-language label for each. Example: if a stage means artwork is the outstanding action, the label should say that ("Needs artwork"), not describe the team's internal state.
- **Duplicate surfaces:** every place the full activity list or a near-copy of it is rendered (Dashboard widgets, Activities table, Design Jobs, Specials, Ticketing, Loaded etc.).
- **Dashboard contents:** each summary block on `overview`, what it counts, and which other page already shows the same thing.
- **Next-action candidates:** a draft rule table (see 4.4) built **only from fields that exist**, with the field names you'd use.
- **Data-quality candidates:** which checks in 4.5 are possible with current fields.
- **Baseline click counts** for the three success tasks in section 6, measured on current `main`.
- **Screenshots** of Calendar, Artwork, Activities and Dashboard at 1440px and 390px wide, before any change.

**Stop here.** Kim confirms the label map, rule table and dashboard cut list before PR-B onwards.

---

## 4. Work packages (one PR each, in this order)

### 4.1 PR-A — Plain labels
- Add a single label map (internal value → display label) for statuses/stages and any other user-facing choice values.
- Use it on every page, filter chip, badge and tooltip. No raw internal names or SharePoint column names visible to non-admin users.
- **Test:** spot-check each status on Calendar, Activities, Artwork and Dashboard; filters still match the same records as before.

### 4.2 PR-B — Calendar opens usefully
- Calendar (already the post-login default) opens on **Month view, current Perth month**.
- **Venue filter chips** visible above the calendar without opening a menu. Selected venue persists for the session (per-viewer; wrap any `localStorage` in try/catch).
- Add a **compact list toggle** for busy months: one row per activity — date range, venue, title, plain status, next-action cue (once 4.4 lands).
- Gantt, Year, Venue Month and Cross-Venue stay available as secondary views, not the default.
- **Test:** an activity spanning month end appears in both months; a date-only activity on the 1st appears on the 1st (not the 31st); venue filter returns the same records in month grid and compact list.

### 4.3 PR-C — Dashboard trimmed to two things
- Keep: a **short action list** (top items needing someone to act, max ~8, each linking to its record) and a **small upcoming snapshot** (next 14 days, compact).
- Everything else that duplicates Calendar, Activities or Insights gets hidden behind a flag and replaced with a link to the full page.
- No invented or unlabelled metrics. Any number left on the page must say what it counts.
- **Test:** every item in the action list opens the correct record; nothing on the dashboard contradicts the Calendar for the same date range.

### 4.4 PR-D — Next-action cue on each item
- One short cue per activity (e.g. "Upload artwork", "Confirm end date", "Review offer"), with a direct link to the place you do it.
- Rules come from the **signed-off rule table** from step 0. Format:

  | Priority | Condition (existing fields only) | Cue | Links to |
  |---|---|---|---|

- Precedence: if several rules match, show the highest-priority one only. No cue if nothing matches. No rule may depend on another cue (no circular logic).
- Shown in: compact Calendar list, Activities table, Artwork, Dashboard action list.
- **Test:** one test record per rule, plus one that matches two rules (higher priority wins) and one that matches none (no cue).

### 4.5 PR-E — Data problems visible, not alarming
- A neutral **"Needs review"** marker (not red, not "error") for: missing start or end date, end before start, status that doesn't map to a known label, and likely duplicates (same venue + same title + overlapping dates — flag only, never merge).
- A reviewers' filter: "Show items needing review".
- "Overdue" only per ground rule 6.
- **Test:** seed or find one record per check; confirm the marker appears and nothing else on the page changes; confirm no activity shows "Overdue" without a late linked task.

### 4.6 PR-F — Artwork: scannable first, visual second
- Default to a **compact row/grid with small thumbnails** so a month of promos fits on screen; large cards become an optional view.
- Keep the thumbnail wherever it helps identify a job (Artwork rows, compact Calendar list, activity record header). Reuse the existing `EventImageRef` thumbnail resolution — don't add new image calls.
- Group or filter by "Needs artwork" / "Artwork ready" using the label map.
- **Test:** a busy month is scannable at 1440px without scrolling past more than one screen per ~10 items; thumbnails load within the existing 6-at-a-time limit.

### 4.7 PR-G — Submit is predictable
- Confirm there is **one** "Submit activity" route (duplicate was removed in #16 — verify nothing reintroduced it).
- Sensible defaults (e.g. venue pre-filled from the active venue filter where present), required fields clearly marked, validation messages that say what's missing.
- Confirmation **only after a confirmed `res.ok`**, stating what was saved (title, venue, dates) and linking to the new record.
- **Test:** submit, reload, find it on the Calendar; force a failure (DevTools request blocking) and confirm the real error shows and no success message appears.

---

## 5. Every PR must also

- Include before/after screenshots of affected pages at **1440px and 390px**. No horizontal scroll at 390px; tap targets usable.
- Re-run the existing Activity edit, task save and photo/folder-link paths (regression).
- Update `docs/CHANGELOG.md`, and `docs/DECISIONS.md` where something was hidden or a rule defined.

---

## 6. How success is measured

Measured from the post-login screen on current `main` (baseline in step 0) and again after each PR. Report clicks and whether any typing/searching was needed.

| Task | Target |
|---|---|
| Find all of **one venue's** promotions this month | ≤ 2 clicks |
| See **what needs action** across the group | 0–1 clicks (visible on landing or one click away) |
| Open the **artwork or activity record** for a named promo | ≤ 3 clicks |

Plus: every item showing a cue links to the right place; no item shows "Overdue" without a late linked task.

---

## 7. Out of scope

- New SharePoint columns, lists, or changes to write payloads
- The full six-area nav regroup (UX-01 full) — only use existing panels
- Lead-time deadline calculations (briefing/creative deadlines by activity type)
- CRM, Reviews, Drive Search, Photo Tagging, Social, Sponsorships
- Any refactor not needed for the work package in hand

## 8. Open questions for Kim (answer before PR-D/PR-E)

1. Sign-off on the status label map and the next-action rule table (from step 0).
2. Which dashboard blocks can be hidden (cut list from step 0)?
3. Should the venue filter remember the last venue per person, or reset each visit?
4. Who reviews "Needs review" items — group marketing only, or venue managers too?
