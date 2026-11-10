# Submission to delivery workflow

Updated: 2026-11-10.

## Terminology

- **Activity**: a record in `Marketing & Activations 2026` (code: `EVENTS`, `approveCampaign`).
- **Job ticket**: an item in the shared SharePoint list **Tasks & Job Tickets** (`LIST_IDS.myTasks`, GUID `8dd02125…`). Linked to its activity through the `Campaign` lookup column (`CampaignLookupId`).
- **Tasks & Job Tickets** is not the same list as Kimberley's private **My Tasks** list (`LIST_IDS.personalTasks`). The code key `myTasks` is historical. On-screen labels say "Tasks & Job Tickets".

## Current behaviour

1. **Submit:** Activity submission creates a row at `WorkflowStage = Intake`. Bulk import also lands at Intake, with no per-row emails.
2. **Triage:** The activity appears in Submissions for the reviewer.
3. **Preview:** The first approval (Intake → In Design) opens a preview of proposed job tickets (`openApprovalPreview`). Each row shows why it was proposed, plus any detail carried from the submission. Owner and due date are editable, and any row can be unticked.
4. **Create:** Only ticked rows are created (`confirmApprovalTasks`), each linked via `CampaignLookupId`. Submission detail (asset formats, POS notes, brief notes) goes into the ticket Notes.
5. **Advance:** The activity moves to In Design (shown as Planning) only after every ticked ticket saves. Then `DesignJobCreated` is set so a second approval never creates a second set. On any failure the activity stays at Intake and the failed tickets are listed. Retry only creates the ones that failed.
6. **Skip:** "Skip tasks, just approve" advances without creating tickets.
7. **Go live:** Review → Live is a plain one-click approval with no new tickets.

Not yet verified against live SharePoint (SUB-03 / FLOW-01 in `OS_RESET_MASTER.md`).

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

- Live test of the full approval flow (SUB-03 / FLOW-01), which is waiting on SAFE-02/03/04.
- Venue on job tickets: the list has no Venue column, so Venue is kept in Notes.
- Later stages: per-team queues, Review with artwork or final URLs, and Live/Done advancing from job tickets.
