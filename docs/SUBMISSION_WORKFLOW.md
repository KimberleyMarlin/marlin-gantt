# Submission to delivery workflow

Updated: 2026-11-10.

## Terminology

- **Activity**: a record in `Marketing & Activations 2026` (code: `EVENTS`, `approveCampaign`).
- **Job ticket**: an item in the shared SharePoint list **Tasks & Job Tickets** (`LIST_IDS.myTasks`, GUID `8dd02125…`). Linked to its activity through the `Campaign` lookup column (`CampaignLookupId`).
- **Tasks & Job Tickets** is not the same list as Kimberley's private **My Tasks** list (`LIST_IDS.personalTasks`). The code key `myTasks` is historical. On-screen labels say "Tasks & Job Tickets".

## Venue on job tickets

Tasks & Job Tickets has a text `Venue` column (added through Admin & Schema). Manual job tickets, approval-created tickets and design briefs write it through `postSharedTask()`. If the column is missing or rejects the value, the save retries once without it, puts a `Venue: X` line at the top of Notes, and tells the user. `loadTasks()` reads the column first and falls back to that Notes line, so older tickets still show their venue.

## Stages

There are five stages: **Intake** (shown as Submissions), **In Design** (shown as Planning), **Review**, **Live** and **Done** (`CANONICAL_STAGES`). In Build and Ready for Live were retired in Nov 2026 (`docs/DELIVERY_STAGES_PLAN.md`). Records still stored with those values are read as Planning and Review (`RETIRED_STAGES`) until the Stage clean-up in Admin & Schema rewrites them.

## Current behaviour

1. **Submit:** Activity submission creates a row at `WorkflowStage = Intake`. Activity Group and Activity Subtype are required on the form, because they decide the job tickets. Bulk import also lands at Intake, with no per-row emails. Its CSV can carry optional "Activity Group" and "Activity Subtype" columns, and the preflight log lists rows without a Group.
2. **Triage:** The activity appears in Submissions for the reviewer, who can Approve, **Send back** or Deny.
   - **Send back** (`sendBackCampaign`) asks for a reason, keeps the activity at Intake, writes the reason to `SentBackNote`, and tags the submitter (or the owner, if no submitter is recorded) in the Inbox. The card shows "Sent back — waiting on submitter" until the activity is next edited, which clears `SentBackNote`. Without the column, the tag still goes out but the card status only lasts until reload, and the approver is told.
   - **Deny** archives the activity.
3. **Preview:** The first approval (Intake → In Design) opens a preview of proposed job tickets (`openApprovalPreview`). Each row shows why it was proposed, plus any detail carried from the submission. Owner and due date are editable, and any row can be unticked.
4. **Create:** Only ticked rows are created (`confirmApprovalTasks`), each linked via `CampaignLookupId` and with the activity's venue in the `Venue` column. Submission detail (asset formats, POS notes, brief notes) goes into the ticket Notes.
5. **Advance:** The activity moves to In Design (shown as Planning) only after every ticked ticket saves. Then `DesignJobCreated` is set so a second approval never creates a second set. On any failure the activity stays at Intake and the failed tickets are listed. Retry only creates the ones that failed.
6. **Email:** once every ticked ticket has saved, each owner (except the approver) gets one email listing their new tickets for that activity (`emailNewJobTicketOwners`). Mail permission is requested on the button click. Email failures are named in the toast and never block approval.
7. **Duplicate flag check:** if SharePoint rejects `DesignJobCreated`, the stage still advances, but the approver is told the marker didn't save and the column needs adding in Admin & Schema.
8. **Skip:** "Skip tasks, just approve" advances without creating tickets.
9. **Auto-move to Review:** when the last open job ticket on a Planning activity is ticked done, the activity moves to Review (`moveToReviewIfTicketsDone`), and the owner is tagged. This only moves forwards. Only tickets linked by `CampaignLookupId` count, and activities with no tickets stay in Planning, marked "No job tickets" on Pipeline. When an approver loads the Hub, tickets finished outside the Hub are caught up (`sweepPlanningToReview`).
10. **Go live:** Review cards on Submissions show **Go Live checks** (`reviewChecklist`). Blocking: all job tickets done; final artwork (Artwork File or Linked Artwork Folder) when there was design or print work; a landing page, booking or ticket link when there was web work. Warnings only: social posts and featured photo. With every blocking check passed, the card shows **Ready** and **Go Live**. Otherwise approvers can **Go live anyway…** with a reason, which is saved to the activity description (`recordGoLiveOverride`), and non-approvers are told what's missing. The same checks run on every route to Live (`confirmGoLive`): the Go Live button, Pipeline and Cross-Venue drag, and the Stage dropdown.
11. **Live on the start date:** when an approver opens the Hub, any Review activity whose start date has arrived and whose Go Live checks all pass moves to Live (`sweepReviewToLive`). Ones that aren't ready stay in Review, marked "Start date passed" on Submissions and Pipeline. There's no Power Automate flow for this yet.
12. **Done:** an activity is only saved as Done once its Post-Campaign Report is in (`savePostCampaign`, as before), or an approver marks it **No report needed…** with a reason (`confirmDone`). The reason is kept as a NO REPORT NEEDED note in the description, and that also clears the "needs report" reminders. The same rule applies to Pipeline and Cross-Venue drags, the Stage dropdown and the bulk "Set stage…" menu. Bulk moves to Live or Done skip activities that don't pass and list them. Past their end date, activities still *show* as Done in the Hub before they're saved that way.

Not yet verified against live SharePoint (SUB-03 / FLOW-01 in `OS_RESET_MASTER.md`).

## Seeing an activity's job tickets

- The activity detail view has a **Job tickets** section (`jobTicketsSectionHtml`), above Design. It lists every linked ticket with owner, venue, due date and status, plus "*x* of *y* done". Anyone who can see the activity sees it. People who can edit a ticket can tick it done or open it to edit, and the section redraws.
- Submissions cards and the Activities table show a "*x*/*y* tickets" chip.
- Tickets are matched to an activity by `CampaignLookupId`, or by title for older tickets (`jobTicketsForActivity`, the same rule as My Work).

## Team queues

The **Queues** page (sidebar, replacing Design Jobs; panel id `design`, `renderDesign`) lists open job tickets by TaskType, in tabs:
- **Design:** Design Asset, Print / Signage
- **Web:** Web Update
- **Social & EDM:** Social Post, EDM / Newsletter, Paid Ad
- **Ops & POS:** POS Update, Admin
- **Other:** everything else

Filters are All, Mine, Unassigned and Overdue, and rows are sorted by due date. Each activity's **Build Channels** (Web, POS, Loaded, Social & EDM) is now calculated from its tickets and read-only. The old hand-set status fields only show for activities with no tickets of that kind.

## Other ways job tickets are created

- **Manual job** (Submit → Maintenance / Update Ticket, `submitJob`): writes `CampaignLookupId` and `Venue`; emails the assignee.
- **Team Work Register** add/edit (`saveTask`): writes `CampaignLookupId` and the activity's `Venue` when an activity is picked. On edit the link is only rewritten when it changes, and "Not linked" clears it.
- **Design brief** (`saveDesignBrief`): writes `CampaignLookupId` for the chosen activity, plus `Venue`; emails the assignee.
- **Duplicate as next month** (`duplicateAsNextMonth`): the new month is created at In Design with no approval, then the job ticket preview opens for it (`openApprovalPreview` in `duplicate` mode). Tickets are chosen from the original activity's answers with the new month's dates. **Skip, no job tickets** is available. Creating tickets sets `DesignJobCreated` without notifying the submitter.

Default owners in the preview: design → the first design-role user (Luca), web → Didier (`DEFAULT_WEB_OWNER_EMAIL`), marketing → the approver, ops → the first ops-role user. Defaults are only filled in when the approver is admin or management.

## How the proposed tickets are chosen

### Step 1: base template (`autoSelectPlaybook`)

Activity Group/Subtype decides first (`playbookFromActivityGroup`). Activities with no Group fall back to the original ActivityType/EventFormat/BusinessStream logic (`playbookFromLegacyFields`).

| Activity Group / Subtype | Template |
|---|---|
| Events & Entertainment with Ticketed? = Yes, or subtype Ticketed Event | Ticketed Event |
| Live Music / Entertainment | Live Music |
| Recurring Event | Recurring Event |
| Function / Private Event Promotion, Functions & Events Campaign | Functions Campaign |
| Other Events & Entertainment subtypes | Venue Activation |
| Loaded Rewards Campaign | Loaded Rewards |
| Supplier / Trade Campaign, Supplier-Funded Promotion, Supplier Product Activation | Supplier Activation |
| Other Campaigns & Marketing subtypes | Seasonal Campaign |
| New Menu, Menu Update, Menu Price Change, Existing Menu Amendment | Menu Change |
| Other Food & Beverage subtypes | Product Feature |
| Promotions & Offers (other subtypes) | Promotion |
| Content & Communications | Request: Social / EDM / SMS / Website / Content Shoot / General, by subtype |
| Venue, Brand & Collateral | Request: Print / Design / Website / Venue Info, by subtype |
| Maintenance / Work Requests | Request: Design / POS / Website / Booking / Print / General, by subtype |

The mapping lives in `PLAYBOOK_BY_SUBTYPE` and `PLAYBOOK_BY_GROUP`. The templates live in `PLAYBOOK_TEMPLATES`.

### Step 2: submission-answer rules (`buildProposedTickets`)

Rules add a ticket only when the template doesn't already cover that kind of work. Otherwise they add their detail to the existing ticket. When the submission says work isn't needed, the matching template ticket is shown **unticked** rather than removed, so the approver can tick it back on.

| Submission answer | Effect |
|---|---|
| Any `AssetsNeeded` | Design ticket, with the selected formats and TV/newsletter detail in Notes |
| In-venue or TVs asset | Print / screen ticket, assigned to design |
| Website channel or asset, or landing page required | Website ticket, with website brief notes |
| Ticketed | Ticket platform ticket (platform, price, capacity, launch date) plus website listing |
| Meta channel or asset | Social / Meta ticket, with Meta brief notes. If channels were answered without Meta, social tickets are unticked. |
| Google Ads channel | Google Ads setup and tracking ticket, with brief notes. If channels were answered without Google Ads, those tickets are unticked. |
| Newsletter channel or asset, or Loaded "Newsletter required = Yes" | EDM ticket. Unticked when Newsletter required = No, or channels were answered without Newsletter. |
| Loaded Rewards | Loaded app setup ticket. Unticked when App required = No. |
| POS required | POS ticket with POS notes. When POS is "Not Required", template POS tickets are unticked. |

## Still open

- Live test of the full approval flow (SUB-03 / FLOW-01), using `docs/LIVE_TEST_JOB_TICKETS.md`.
- Later stages: per-team queues, Review with artwork or final URLs, and Live/Done advancing from job tickets.
