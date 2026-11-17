# Marlin OS — My Work to-do list: build plan

How to use this: paste this whole file into Claude Code from inside the `marlin-gantt` repo (or commit it as `docs/MY_WORK_PLAN.md` and say "work through docs/MY_WORK_PLAN.md, one phase at a time"). Do one phase per pull request. Stop and check with Kimberley wherever it says DECISION.

## Context for Claude Code

* The app is the single file `index.html` (~15.4k lines), deployed on GitHub Pages. SharePoint lists, accessed via Microsoft Graph, are the source of truth. Read `docs/DECISIONS.md` and `docs/TECH_DEBT.md` first.
* Goal: make My Work (`#p-mywork`) Kimberley's one place to see, add, prioritise and tick off everything. Other task views either feed into it or move out of the way.
* Kimberley's four problems, in her words: too many places, things don't save or stick, adding a task is too slow, and she can't see priorities.
* Task data today:
   * `PERSONAL_TASKS` comes from the private Personal Tasks list (`LIST_IDS.personalTasks`), via `loadPersonalTasks()`, `savePersonalTask()` and `togglePersonalTask()`.
   * `MY_TASKS` comes from the shared Work Register list (`LIST_IDS.myTasks`), via `loadTasks()`, `saveTask()` and `toggleTask()`.
   * Activities come from `EVENTS`. `NOTIFS` attaches warnings to them.
   * `myWorkItems()` merges all three. The Dashboard widgets already use it.
* Task views today:
   * My Work: the bucket board and the "Today, three things" slots.
   * Personal Tasks: the manage and bulk-edit page.
   * Shared Work Setup: the team Work Register.
   * My Day: `#p-myday`. No sidebar item opens it, so it's orphaned.
   * Dashboard My Tasks widget
* Ground rules:
   * Do not create a new task list. Extend the existing lists.
   * Do not create or change SharePoint lists, columns or Power Automate flows without Kimberley's OK.
   * Fail safe: if a save fails, put the UI back the way it was and say so. Never show a false success.
   * Keep role-gating intact. Non-Kimberley roles use My Work with Shared tasks and Activities only. `canAccessPanel('personaltasks')` must keep hiding personal data from them.
   * Test every phase in UI Preview mode (`previewMode()`, seeded by `seedPersonalTaskPreview()` and `seedTaskPreview()`). Also test signed in as a non-admin role.
   * Escape all user text with `escapeAttr()`. The My Day render currently injects `t.title` raw.

## Phase 1 — Make things save and stick (bugs and persistence)

### 1.1 Fix the double toggle in My Day — confirmed bug
`toggleMyDayTask(id)` (around line 8342) flips `t.status` and then calls `toggleTask()`, which flips it again before it PATCHes SharePoint. So ticking a task in My Day writes its original status back, and nothing changes. My Day is retired in Phase 2, but until then fix it: remove the local flip and just call `toggleTask(t.id)`.

### 1.2 Tick-off should feel instant, and come with Undo
`togglePersonalTask()` and `toggleTask()` only re-render after the Graph call finishes, so a tick in My Work lags. Make both optimistic:

1. Flip the status and re-render My Work, Personal Tasks and the badges immediately.
2. PATCH SharePoint.
3. If the save fails, roll back, re-render, and show an error.

When something is marked done, show a small toast for about 6 seconds: "Done · Undo". Undo re-toggles the task.

### 1.3 "No priority" really means no priority

* `loadPersonalTasks()` maps `priority: f.Priority || 'Medium'`. A task saved with "No priority" therefore reloads as Medium. Change the mapping to `f.Priority || ''`.
* Check `loadTasks()` for the same default and fix it the same way.
* Put the priority options in the order Critical, High, Medium, Low in `#tPriority`, `#ptPriority`, `#ptBulkPriority` and every other priority dropdown. Some currently read Critical, Medium, High, Low.

### 1.4 Personal tasks need a status, not just done or not done
The personal task form has no Status field, so a personal task can never be Blocked or In Progress. That means the "Needs a decision" bucket never gets personal items.

* Add a Status dropdown to `#addPersonalTaskOv` with Not Started, In Progress, Blocked and Done.
* When Blocked is chosen, show a "What's it waiting on?" field that writes `Blocker`. `loadPersonalTasks()` already reads `f.Blocker`.
* Show the blocker text on My Work rows.
* Check that the Status column's choice values in SharePoint include all four (use Schema Tools / `SCHEMA_KNOWN_GAPS`). Add `In Progress` and `Blocked` if they're missing. DECISION: confirm with Kimberley before adding choices.

### 1.5 Save the My Work layout to SharePoint, not just the browser
Bucket placement, manual order, custom buckets, collapsed state and Today's 3 are all stored in `localStorage` (`loadMyWorkPrefs()` / `saveMyWorkPrefs()`). They're lost on another computer, on her phone, or when the browser cache is cleared.
DECISION (Kimberley must approve before you build): create one small SharePoint list called Hub User Prefs.

* Columns: `Title` (the user's email, lower-case), `PrefsJson` (multiple lines of plain text) and `UpdatedAt` (date/time).
* One row per user.
* Permissions: each user's row only needs to be readable and writable by that user. The existing `Sites.ReadWrite.All` scope covers this, so no new consent is needed.
* This is a settings list, not a task list, so it doesn't conflict with the "no new task list" rule.

Then:

* On sign-in, load the user's row into memory. Keep `localStorage` as an offline cache and first-paint fallback.
* `saveMyWorkPrefs()` updates the cache straight away and debounces a PATCH to SharePoint (about 1.5 seconds). If no row exists yet, create one.
* Conflicts: the newest `UpdatedAt` wins. On load, if the server copy is newer than the cache, use the server copy.
* Add `LIST_IDS.hubUserPrefs`. If it isn't set, quietly fall back to `localStorage` only, the way it works today, and show a one-line notice in `#myWorkConfig`.
* The structure is reusable for other per-user settings later, such as the default landing page in 2.2.

### Phase 1 acceptance checks

* Tick a task in My Work. It strikes through immediately, Undo restores it, and a page reload shows the same state.
* Save a personal task with "No priority". After a reload it shows no priority tag.
* Set a personal task to Blocked with a blocker. It appears in "Needs a decision" with the blocker text.
* Drag a task into a custom bucket and fill Today's 3. Open the Hub in a second browser or a private window: the same layout appears.
* With the prefs list unset, nothing breaks and the board behaves as it does today.

## Phase 2 — One home for to-dos

### 2.1 Retire My Day
`#p-myday` has no sidebar item. Its Tasks tab shows only shared tasks with its own logic, and its Approvals tab duplicates Submissions.

* Remove the `#p-myday` markup and these functions: `pickMydayTab`, `renderMyTasksInline` and `toggleMyDayTask`.
* Remove `renderMyDay` too, unless something still needs its feed. Check the call sites around lines 8348, 11317 and 12966. Keep `generateNotifications()` and `NOTIFS`, because My Work uses them.
* Remove the `mydayTaskBadge` and `mydayApprovalBadge` references, around lines 8167, 8210, 10982 and 11028.
* Run a quick search afterwards to confirm nothing still calls removed functions.

### 2.2 Make My Work the front door

* Move My Work to the top of the sidebar, above Dashboard.
* Add a per-user default landing page. Kimberley lands on `mywork`, and everyone else keeps `calendar`. `defaultPanel` is hard-coded to `'calendar'` around line 4634. Read the default from Hub User Prefs (Phase 1.5) and fall back to a role-based default.
* Add a link in the My Work header: "Manage personal tasks →". It opens Personal Tasks for bulk edits, subtasks and project grouping.

### 2.3 Tidy the other task pages, but keep them

* Personal Tasks: keep it as the bulk-edit and subtask page, and move its sidebar item directly under My Work. Rename the header eyebrow to "Manage". It's still private and gated the same way.
* Shared Work Setup: rename the sidebar label to Team Work Register, since this is the team-wide view. No logic changes.
* DECISION: ask Kimberley whether to hide the Personal Tasks sidebar item completely, so it's reachable only from the My Work link.

### 2.4 One definition of "mine"
There are three different `isMyTask()` functions (around lines 8156, 8248 and 10993). They treat unassigned tasks as everyone's, while My Work uses `isCurrentUserAssignment()`, so counts differ between pages.

* Replace all three with `isCurrentUserAssignment()`.
* Show unassigned shared tasks in a separate, collapsible "Unassigned team tasks" bucket on My Work, and only for roles that can edit team tasks (`canEditTeamTask`). Don't mix them into Kimberley's own counts.

### 2.5 Act on a row without opening it
Add a hover menu (desktop) or `⋯` menu (touch) to each My Work row:

* Priority: Critical, High, Medium, Low or none.
* Due: Today, Tomorrow, Next Monday, Pick date, or Clear.
* Mark Blocked or Unblock.
* Pin to Today's 3.
* Personal rows only: "→ Shared", which reuses `convertPersonalTaskToShared()`.

Each action writes to the correct list for that row's kind, optimistically as in 1.2. Respect `canEditTeamTask()`: shared rows the user can't edit show the menu greyed out with a tooltip. Activity rows only get "Open activity" and "Pin to Today's 3".

### Phase 2 acceptance checks

* Kimberley signs in and lands on My Work. A general-role user still lands on Calendar.
* No console errors, and the old My Day functions are gone.
* My Work open count = Dashboard My Tasks widget count = Personal open + Shared assigned to her + her flagged Activities.
* Every row action saves, survives a reload, and is refused cleanly when the user doesn't have permission.

## Phase 3 — Fast capture

### 3.1 Quick-add bar on My Work
Put one input at the top of My Work with the placeholder "Add a task… (e.g. Send cruise brief to Didier fri !high #HD Marketing Plan)". Press Enter to save.

* Who it saves for: for Kimberley (`canAccessPanel('personaltasks')`) it creates a Personal Task. For other roles it creates a Shared task assigned to themselves through the existing `saveTask()` path.
* Light parsing:
   * Dates: `today`, `tomorrow`, weekday names (meaning the next one), `12/11` or `12 Nov` (Australian dd/mm), and `next week` (meaning next Monday).
   * Priority: `!critical`, `!high`, `!med` or `!low`.
   * Project: `#ProjectName`, fuzzy-matched against `PROJECTS`.
   * Activity: `@ActivityName`, fuzzy-matched against non-archived `EVENTS`.
* Strip the tokens out of the title. As she types, show what was recognised as small chips under the input, so she can see what will be saved.
* Add an "Add details…" link that opens the full modal pre-filled with the parsed values.
* Clear and refocus the input after each save, so she can add several tasks in a row. Disable the input while saving, as `savePersonalTask()` already does with its button, so one Enter can't create two tasks.
* Give new tasks the same `Sequence` logic as `savePersonalTask()`, and place them in the correct auto bucket.

### 3.2 Add from anywhere
Add a global shortcut: `N` (when not typing in a field) opens a small quick-add popover on any page, with the same parser. Also add a "+ Task" button to the top bar.

### 3.3 Email to task (Hub side is mostly done)

* My Work rows for Outlook-sourced personal tasks (`source === 'Outlook'`) should show the 📧 badge and an "Open email" link. Today only the Personal Tasks page shows them.
* The Power Automate flow is already specified in `docs/EMAIL_TO_TASK_AUDIT.md` §4. Do not build it. Note in the PR that it's ready for Kimberley to build or approve.

### Phase 3 acceptance checks

* Typing `Check Ravenswood signage proofs tomorrow !high` + Enter creates a task due tomorrow, priority High, titled "Check Ravenswood signage proofs". It appears in the correct bucket straight away and is still there after a reload.
* Ten quick adds in a row create ten tasks, with no duplicates and no focus lost.
* A general-role user's quick add creates a shared task assigned to them, never a personal one.

## Phase 4 — See priorities at a glance

### 4.1 Sort by priority, not just date
Inside each bucket, sort by Kimberley's manual drag order first, then by priority (Critical, High, Medium, Low, none), then by due date. Today the sort is manual order, then due date only.

### 4.2 Make priority visible

* Add a coloured left edge to each row by priority: Critical red, High orange, Medium amber, Low grey, none none. Reuse the existing tag colours.
* Critical rows also get a light red background tint.
* Keep the text tag so the meaning doesn't rely on colour alone.

### 4.3 Today's 3 that helps

* When slots are empty, show up to three suggestions under the widget: overdue first, then Critical or High that are due soonest. Each has a one-click "Pin".
* Let her tick tasks off from inside a slot. A done slot shows strikethrough with a tick until tomorrow.
* Save Today's 3 with the date. On the first visit of a new day, if yesterday had unfinished picks, show "Carry over yesterday's unfinished picks?" with Yes / No.

### 4.4 Clickable header stats
Make the stat tiles (Open, Blocked, Overdue, Completed) act as filters for the board, and click again to clear. Add a "Due today" tile, and add "Done this week" so progress is visible.

### Phase 4 acceptance checks

* In any bucket, Critical items without a manual position sit above Low items with the same date.
* Empty Today slots suggest the right items, and pinning one fills the next empty slot.
* Next-day carry-over offers only yesterday's unfinished picks.

## Out of scope for now (log in TECH_DEBT.md if touched)

* My Tasks still has no Venue column, and the venue is stored in Notes. A separate fix is already logged.
* Moving the access roster into SharePoint.
* Building the Power Automate email flow.

## Definition of done for the whole plan
Kimberley can do all of the following:

* Open the Hub and land on My Work.
* Capture a task in under 5 seconds from any page.
* See what's critical, overdue and blocked without scrolling.
* Pick her three for today.
* Tick things off instantly with Undo.
* Find exactly the same board on any device.
