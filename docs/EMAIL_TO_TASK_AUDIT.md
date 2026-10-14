# Outlook Email-to-Task — audit, Hub-side changes, and Power Automate spec

Produced: 2026-10-14. Covers both halves you asked about: the existing outbound task-assignment emails (verified), and the missing inbound email-to-task flow (audited, planned, and given a small Hub-side foundation — no Power Automate flow created or modified).

## 1. Outbound task-assignment emails — verified, working well

The "Operations" section's reference to this feature wasn't describing something broken — `sendMentionEmails()` (and the three call sites that use it: Design Brief submission, manual Job/Task submission, and the Job ticket form) is a real, already-functioning feature. Specifically checked, by reading the code at each call site:

- **`Mail.Send` consent**: requested via `getMailToken()` — tries `acquireTokenSilent` first (no prompt once granted), falls back to `acquireTokenPopup` only if needed. Crucially, it's requested **before** the SharePoint save, still inside the user's original click — the comment in the code explicitly notes this avoids the browser blocking a popup that happens after an intervening `await`. This is correct practice.
- **Graph delivery errors**: `sendMentionEmails()` checks `res.ok` per recipient and pushes a structured failure (`{name,email,error}`) rather than assuming success. Every call site then checks `emailResult.failed.length`/`emailResult.sent>0` before telling the user the email actually went out.
- **Was assignee info saved?** Yes, and checked in the right order: the SharePoint task/brief record is created **first** (its own `res.ok` is checked), and only then is the email attempted. If the SharePoint save fails, no email is ever sent. If the email fails, the save has already succeeded and the user is told the task exists but wasn't delivered by email (e.g. `"⚠️ Brief submitted, but the assignment email was not delivered. It is still visible in My Tasks."`) — never a silent false success.

**No defect found here.** This part of your brief is already in a good state; flagging it as verified rather than inventing a problem to fix.

## 2. Inbound email-to-task — audit of what's there and what's missing

**Nothing exists today.** The "Operations" foundation checklist (`renderOperationsMap()`) has an explicit note: *"On hold — four-person Work Register... the email-to-task flow... all assumed a shared four-person task list would get built out. That's on hold — workload and job assignment now run off Activities instead."* That's the origin of "appears to be on hold" — the original plan specifically assumed creating items in the **shared** Work Register (`MY_TASKS`), which was shelved when the team moved to Activity-based workload tracking.

**Your new instruction changes the target list, which resolves the original blocker**: default to the existing, already-private **Personal Tasks** store, with an explicit, deliberate "convert to shared" action rather than Power Automate deciding that automatically. This sidesteps exactly the problem that put the original plan on hold, and reuses infrastructure that already exists (Personal Tasks' SharePoint list, its subtask support, its due-date/Activity/Project linking) rather than building a second task list.

## 3. What's built in this PR (Hub side only — no Power Automate)

Since Power Automate changes need your explicit approval and I have no access to create or test flows, this PR is the **receiving end** — ready for whenever the flow exists, and independently useful for anything that writes a Personal Task with these fields by hand too:

- `loadPersonalTasks()` now reads `Source` (`'Hub'` by default, `'Outlook'` once the flow exists), `EmailSender`, `EmailLink`, `EmailMessageId`. All four are optional reads with safe fallbacks — no existing Personal Task row is affected.
- Personal Tasks list rows show a small 📧 badge with an "Open email" link for any task with `Source='Outlook'`.
- A **"→ Shared"** button on every open Personal Task (not just Outlook-sourced ones — useful generally) that implements your "deliberately convert it into shared work" requirement: creates a linked Shared Task (title, notes, due date, and the Activity link if one was set) in the existing `MY_TASKS` list, then marks the original Personal Task **Done** with a `[Converted to shared task]` note — preserved as a record, not duplicated as active work, and not deleted.
- 4 new `SCHEMA_KNOWN_GAPS` entries for Schema Tools: `Source` (choice: Hub, Outlook), `EmailSender`, `EmailLink`, `EmailMessageId` — all on `personalTasks`.

No new task list was created — everything above extends Personal Tasks, per your "do not introduce a new task list if existing lists can support this safely" instruction.

## 4. Power Automate flow — requirements for you (or whoever builds it) to review and approve

**Not created.** This is the spec, for explicit approval before anyone builds it.

### Trigger
"When a new email arrives" or "When an email is flagged" (Outlook connector), scoped to a specific category — e.g. a category literally named **"Marlin Hub"** that someone applies to an email they want turned into a task. Categorising (rather than just flagging) is the cleaner trigger: it's an explicit, visible, undoable action the person takes on purpose, and Power Automate's Outlook connector can filter directly on category name.

### Action — create or update a Personal Tasks item
Use the SharePoint "Get items" action first, filtering by `EmailMessageId` equal to the triggering email's `internetMessageId` (a stable identifier Outlook guarantees doesn't change even if the email is later edited, moved, or re-categorised — this is the field to dedupe on, not the email's subject or any Graph-generated item id that can change). If a match exists, stop (or optionally update it, if you want a re-categorised email to refresh the task) — **never create a second item for the same message id.** This is exactly your "prevent duplicates, including when a flagged email is subsequently edited" requirement: the internet message id survives an edit, so the dedupe check still catches it.

If no match, create a new Personal Tasks item:

| Personal Tasks field | Source |
|---|---|
| `Title` | Email subject |
| `Notes` | A short description — the email's body preview, or the whole body if short |
| `EmailSender` | Sender's display name and/or address |
| `EmailLink` | The email's `webLink` (opens it directly in Outlook on the web) |
| `EmailMessageId` | The email's `internetMessageId` — the dedupe key |
| `Source` | Literal `"Outlook"` |
| `Status` | `"Not Started"` |
| Created date | Whatever SharePoint/Graph records automatically — no explicit field needed |
| Owner | Implicit — Personal Tasks is already restricted to one person's access; the flow runs as (or on behalf of) that person |

Due date, Activity link and Project link are **not** set by the flow — per your spec, those are added by the person afterward in the Hub (`openEditPersonalTask`), which already supports all three.

### What this does NOT need
- No new SharePoint list or library.
- No change to the outbound-email flow (section 1) — this is a separate, new flow.
- No AI/content classification — the trigger is the person's own deliberate categorisation action, not automated judgment about what counts as "actionable."

## 5. End-to-end test, once the flow exists

1. Flag/categorise a test email with the "Marlin Hub" category. Confirm a new Personal Tasks item appears with the right Title/Sender/Link/Source.
2. Edit the same email's subject or body, keep the category. Confirm **no second task is created** — the `EmailMessageId` match should find the existing item.
3. Open the task in My Work / Personal Tasks, add a due date, link it to a test Activity. Confirm both persist normally (existing functionality, not new).
4. Click **"→ Shared"**. Confirm a new Shared Task appears in My Tasks with the same title/notes/due date and the Activity link carried over (as a `CampaignLookupId`), and that the original Personal Task is now marked Done with the conversion note — not deleted, not duplicated as two active items.
5. Confirm a second team member who is not the Personal Tasks owner cannot see the original private task's content anywhere — only the converted Shared Task (once step 4 has happened) is visible to them.
