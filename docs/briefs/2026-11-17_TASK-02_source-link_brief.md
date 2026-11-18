# Claude Code brief — TASK-02 "Source link on tasks and job tickets"

**Repo:** `KimberleyMarlin/marlin-gantt` · **File:** `index.html` (pull fresh `main` first)
**Read first:** `docs/OS_RESET_MASTER.md` (sections 2 and 4), `docs/FIELD_MAPPING.md`, `docs/MY_WORK_PLAN.md`, `docs/DESIGN_SYSTEM.md`, `docs/DECISIONS.md` (17 Nov 2026 entries)
**Register links:** TASK-01, SAFE-01 (column dumps), SAFE-04 (permissions)
**Classification:** HIGH VALUE

> **18 Nov note:** references to "My Day" in earlier drafts now mean **My Work** (the home page since #131). The chip follows `docs/DESIGN_SYSTEM.md` (Work Sans, glyph `↗`).

---

## 1. Problem

**Problem.** Tasks are created from emails, Teams messages, meetings and forms, but nothing on the task links back to where the request came from. You have to search the inbox to get the context back.

**Current state.** On 9 Nov, 25 Personal Tasks were created from Kim's inbox. The only place to record the source was the free-text Notes field. The links weren't stored, so they can't be clicked from the OS.

**Desired state.** Any task or job ticket can carry an optional link to its source. It shows as a small clickable chip ("↗ Email") that opens the original message in a new tab.

---

## 2. Architecture

| | |
|---|---|
| **Source of truth** | The original message stays where it is (Outlook, Teams, Jotform). The task stores a **pointer only**: type, link and a short label. Never copy email content into SharePoint. |
| **Interface** | The task / job ticket create and edit forms, plus a chip on every task row (My Work, Personal Tasks, Design Jobs, ticket detail). |
| **Automation** | None in this brief. Later, inbox-triage tools (Claude, Power Automate) can fill the same fields when they create tasks. |
| **Output** | Clickable chip on the row. Nothing else reads these fields yet. |

The same three columns go on **both** task lists, so a task promoted from Personal to Shared keeps its source:
- **Tasks & Job Tickets** (shared)
- **Personal list** (`d44e7911…`)

---

## 3. Proposed columns (confirm in step 0 before anyone creates them)

| Display name | Internal name (proposed) | SharePoint type | Required | Values / example |
|---|---|---|---|---|
| Source type | `SourceType` | Choice (single) | No | `EMAIL`, `TEAMS`, `MEETING`, `FORM`, `PHONE_IN_PERSON`, `OTHER` |
| Source link | `SourceUrl` | **Multiple lines of text, plain text** | No | `https://outlook.office365.com/owa/?ItemID=…` |
| Source label | `SourceLabel` | Single line of text | No | `Chloe Jaenicke · WA Wedding & Bride · 4 Nov` |

**Why these types**
- **SourceUrl isn't single-line text.** Outlook web links are about 270 characters, and single-line text stops at 255, so links would be silently cut off.
- **SourceUrl isn't a Hyperlink column.** Graph v1.0 doesn't reliably write Hyperlink columns (see the 10 Nov photo/folder-link decision and #137).
- **SourceType stores stable codes.** The app maps them to display labels: `EMAIL` → "Email", `PHONE_IN_PERSON` → "Phone / in person". If the existing task lists store display text in their Choice columns instead, report it in step 0 and follow the existing convention.

**Creating the columns (Kim, in SharePoint list settings):** type the internal name first (e.g. `SourceUrl`, no spaces) and save. Then rename the display name to "Source link". SharePoint fixes the internal name on first save (the `Departement` lesson).

---

## 4. Business rules

1. **All three fields are optional.** A task saves normally without them.
2. **Type is inferred if blank.** When `SourceUrl` is set and `SourceType` is empty, the app infers the type at save time and stores it:
   - `outlook.office365.com`, `outlook.office.com` or `outlook.cloud.microsoft` → `EMAIL`
   - `teams.microsoft.com` → `TEAMS`
   - `jotform.com` → `FORM`
   - anything else → `OTHER`
3. **Only safe links are clickable.** A link is clickable only if it starts with `https://`. Anything else shows as plain text. Never render `javascript:` or `data:` URLs.
4. **Links open in a new tab** with `rel="noopener noreferrer"`. Clicking the chip must not toggle, complete or open the task row (My Work 2.5 row actions included).
5. **Chip text.** The chip shows `SourceLabel`. If there's no label, it shows the type label ("Email"), with the full label in a tooltip.
6. **Mailbox privacy.** A link into someone's own mailbox only opens for that person. On **shared** tasks and job tickets, the chip tooltip says "May only open for the person who added it". The task description must still hold the context others need.
7. **Promoting a task keeps its source.** "→ Shared" (create a linked Shared Task from a Personal Task) copies the three Source fields to the new shared item. This copies a reference only, not the content.
8. **Editing.** All three fields are editable after creation and can be cleared.

---

## 5. Interface

- **Create/edit form:** a collapsed **"Source (optional)"** section under Notes, containing Type (select), Link (text input) and Label (text input). Pasting a link fills Type automatically (rule 2) and can be overridden.
- **Task rows:** a small chip (`↗ Email`, `↗ Teams`, `↗ Form`…) on the meta line next to the due date and project.
- Styling per `docs/DESIGN_SYSTEM.md`: Work Sans, `--ink-muted` text, `--accent` on hover.

---

## 6. Work packages

**Step 0: inventory, then stop for sign-off**
- List IDs for **Tasks & Job Tickets** and the **Personal list** from `LIST_IDS`
- A column dump of both lists, using Admin & Schema (SAFE-01)
- **Check whether a link, URL, reference or source column already exists** on either list (including anything added by Email-to-Task, see `docs/EMAIL_TO_TASK_AUDIT.md`). If it does, propose reusing it and don't add a second one.
- Where the read and write field mappings live for each list
- How Choice values are stored on these lists (codes or display text)
- Confirm the "Sequence" save warning (see section 8) is unrelated to this work

**Kim:** create the three columns on both lists, per section 3.

| PR | Scope | Key test |
|---|---|---|
| **PR-1 Mapping** | Read and write mapping for the three fields on both lists. Update `docs/FIELD_MAPPING.md`. | Create, reload and edit a task on each list, with and without a source; values persist exactly |
| **PR-2 Form + chip** | Form section, row chip, type inference, URL safety, tooltip, copy on "→ Shared" | A 270+ character Outlook link saves intact and opens the right email; a `javascript:` link is not clickable; clicking the chip doesn't toggle the row; a Personal Task stays private; "→ Shared" carries the source across |

**Follow-up (not code):** once PR-1 is live, backfill the 25 Personal Tasks created on 9 Nov with their email links. Claude has the title → link list and can do this through the edit form.

**Every PR:** before and after screenshots at 1440px and 390px; a regression check that other task fields and other lists are untouched; a `docs/CHANGELOG.md` entry.

---

## 7. Out of scope

- Creating tasks automatically from email (Outlook flag → task, Power Automate, an Outlook add-in). This is HIGH VALUE once these fields exist, and needs its own brief.
- Storing any email or message content
- Activity ↔ Task relationships (`ProjectId`, `ParentActivityId`). Those are separate links.
- Fixing the "Sequence" warning (logged in section 8)

---

## 8. Tech debt

**Issue:** Outlook `ItemID` links can stop working if the email is moved to another folder or the mailbox is reorganised.
**Risk:** Old source links break with no warning.
**Priority:** Low
**Recommended future fix:** Add a `SourceMessageId` column holding the email's `internetMessageId`, which stays the same when the email moves, and resolve it through Graph when the link fails.

**Issue:** Saving a Personal Task returns "Task saved, but these fields were not accepted by SharePoint: Sequence" (seen on every save, 9 Nov).
**Risk:** Drag-to-reorder ("My order") probably isn't persisting. The warning also trains users to ignore real save errors.
**Priority:** Medium. Check under SAFE-04, and check whether `docs/MY_WORK_PLAN.md` phases have already fixed it.
**Recommended future fix:** Confirm whether a `Sequence` column exists on the Personal list. Then either create it, or stop sending it from the app.
