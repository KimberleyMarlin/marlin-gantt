# Marlin Hospitality OS — Technical Debt

## Approval playbook exists but is not connected

**Issue:** `runPlaybook(ev)` contains task templates for design, web, social, EDM, POS, signage and other work, but no production code calls it. `approveCampaign()` currently changes `WorkflowStage` from `Intake` to `In Design` and sends notifications only. It creates no linked task or design brief. **Risk:** The Hub visually implies an activity has entered planning/design while Luca and the other delivery owners may have received no actionable job. **Priority:** High. **Recommended future fix:** Add an approval preview that shows the proposed jobs derived from `Channels`, `AssetsNeeded`, ticketing, Loaded and POS answers. Let the approver confirm owners and due dates, then create only those tasks, link them to the activity, and mark the activity's creation flags only after all required writes succeed.

## Campaign task lookup is not consistently mapped

**Issue:** Manually submitted jobs write `RelatedCampaignId`, while the existing task model and earlier specifications refer to `LinkedCampaignID` or a campaign lookup. Auto-playbook tasks currently write neither. **Risk:** Design and delivery tickets cannot reliably navigate back to their parent activity, and duplicate prevention is weak. **Priority:** High, before connecting automatic job creation. **Recommended future fix:** Confirm the actual My Tasks lookup column internal name and type, then use that one mapping in manual jobs, design briefs and playbook tasks.

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
