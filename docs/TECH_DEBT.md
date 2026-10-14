# Marlin Hospitality OS — Technical Debt

## POS notes need a dedicated SharePoint column

**Issue:** The Hub previously wrote the Updates Required text to an unconfirmed `POSNotes` field, so SharePoint could reject and skip it. v16 preserves those notes inside a tagged section of the existing Description field and separates them again when loading. **Risk:** The fallback is reliable and human-readable, but POS notes are not independently filterable or reportable in SharePoint. **Recommended future fix:** Create a confirmed multiple-lines-of-text column for POS update notes, record its real internal name, migrate the tagged Description sections, then switch the Hub mapping to that column.

## Approval playbook exists but is not connected — RESOLVED 2026-10-14

**Issue (as it was):** `runPlaybook(ev)` contained task templates for design, web, social, EDM, POS, signage and other work, but no production code called it. `approveCampaign()` only changed `WorkflowStage` from `Intake` to `In Design` and sent notifications. It created no linked task or design brief, even though the Hub visually implied planning/design had started.

**Fix:** The first (Intake → In Design) approval now opens a preview overlay of the proposed jobs for that activity's playbook template, with editable owner/due date per row and the ability to untick any that aren't needed. Only ticked rows are created, each correctly linked via `CampaignLookupId` (the "Campaign task lookup" fix above). Only once every ticked row succeeds does the activity actually advance to In Design, with `DesignJobCreated` set so re-approving (or double-clicking) never creates a second set of tasks. A partial failure keeps the activity at Intake and shows exactly which tasks didn't land, so nothing is silently half-done. "Skip tasks, just approve" remains available for activities that genuinely need none. The old `runPlaybook()` is left in the file, archived with a comment, not deleted — it was never wired up and the new preview/confirm flow fully replaces what it would have done.

**Still open:** the playbook template choice (`autoSelectPlaybook`) is still driven by `ActivityType`/`EventFormat`/`BusinessStream` rather than the richer Activity Group taxonomy the briefing-system work proposes — revisit once that taxonomy exists.

## Campaign task lookup is not consistently mapped — RESOLVED 2026-10-14

**Issue (confirmed via audit):** `loadMyTasks()` read the real "Campaign" Lookup column (`f.Campaign.LookupValue`) into `campaignLookup`, but manual job submission (`submitJob`) wrote a completely different, never-read field (`RelatedCampaignId`) — so selecting a campaign when submitting a job had no visible effect anywhere in the Hub. The dead `runPlaybook()` wrote neither. Downstream code (`myWorkItems()`'s shared-tasks mapping, the Projects work-count rollup) then matched a task back to its Activity by **title text**, which breaks if the Activity is ever renamed.

**Fix:** `submitJob()` now writes `CampaignLookupId` (the standard Graph write key for a Lookup column named `Campaign`), matching what `loadMyTasks()` already reads. `runPlaybook()` (still disconnected — see below) does the same, so it's correctly set up for whenever it's wired in. `loadMyTasks()` now also captures `f.Campaign.LookupId` as `campaignLookupId`; both places that resolved a task's Activity by title now try that stable id first, falling back to title matching only for older records saved before this fix.

**Still open:** Personal Tasks (a separate, private list) uses its own pair, `LinkedActivityId`/`LinkedCampaignID` — already id-based and not affected by this issue, left as-is.

## Financial data is not yet separated at the SharePoint layer

The Hub hides financial fields from roles without `canViewBudget`, and v12 closes the known UI gaps. This is presentation-level control, not column-level security. Users who can read the Campaigns list can potentially inspect the raw Microsoft Graph response.

**Recommended fix:** move Budget Allocated, Actual Spend, Supplier Contribution, and other confidential finance fields into a separate `Campaign Financials` list. Restrict that list to admin and management, link records by Campaign item ID, and merge the data in the Hub only for permitted roles.

## Access roster is embedded in the HTML

Known users are mapped in `ROLE_MAP` and `ROLE_NAME_MAP`. This fixes current access quickly but requires a code deployment whenever staff or roles change.

**Recommended fix:** create a restricted `Marketing Hub Access` SharePoint list with Active, User Email or Object ID, Role, Venue Access, and Notes. The Hub should read this list on sign-in and fail closed if no active row exists.

## SharePoint list permissions need a live audit

Hub roles decide what the interface displays. SharePoint still decides whether each signed-in person can read or write the underlying Campaigns, Tasks, Ideas, Comments, Projects, Offer Mechanics, Suppliers, and asset libraries.

Define a least-privilege Microsoft 365 group for Hub users, then grant list permissions deliberately. Venue submissions and comments require Contribute access to their target lists. Read-only calendar users do not need write permission everywhere.

## My Tasks has no Venue column

v12 preserves the selected venue in Notes, for example `Venue: The Left Bank`. This is human-readable but not reliably filterable.

**Recommended fix:** add a Venue Choice column to `My Tasks`, update submission and loading code to use it, then remove the Notes workaround.

## Retire stale copies and the unexplained Azure app

Older Gantt and Hub files used inconsistent SharePoint internal field names. They should remain retired now that the GitHub Pages `index.html` is authoritative. The separate Azure AD application ID previously found only in `marlin-gantt-dashboard.html` should be identified and retired if unused.
