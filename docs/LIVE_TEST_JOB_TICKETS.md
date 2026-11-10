# Live test: job tickets and approval flow

Covers SUB-03 / FLOW-01 and the shared-task write checks for SAFE-02 in `OS_RESET_MASTER.md`. Run it against the live SharePoint lists, signed in to the Hub with a real account.

- **Time:** about 45 minutes.
- **Who:** Kimberley, because Part A uses Schema Tools, which only Kimberley can use. Parts B to F can be run by anyone with approve rights, with a second person available to receive an assignment email.
- **Record:** fill in the Result column (Pass / Fail plus a note) as you go. For any Fail, copy the exact on-screen message and take a screenshot.

Use `TEST` at the start of every title so the test records are easy to find and delete in Part G.

## Before you start

| # | Check | Expected | Result |
|---|---|---|---|
| 0.1 | Open the Hub and sign in | Sidebar footer shows Live · SharePoint. Your role is shown next to your name. | |
| 0.2 | Open **Admin & Schema** | Page loads with the list of proposed SharePoint columns. | |
| 0.3 | In **Proposed SharePoint columns**, find **Design Job Created** (Marketing & Activations 2026) | Shows as ready. If it shows Missing, add it first (see A.2 for how **Add missing** works). Duplicate protection (Part E) depends on it. | |
| 0.4 | Find **Activity Group** and **Activity Subtype** (Marketing & Activations 2026) | Both ready. If missing, add them the same way. Ticket selection in Part C depends on them. | |

## Part A: create the Venue column

| # | Step | Expected | Result |
|---|---|---|---|
| A.1 | In **Admin & Schema → Proposed SharePoint columns**, find **Venue** on **Tasks & Job Tickets (shared)** | Shows Missing, type Text. | |
| A.2 | Select **Add missing**. This creates **every** column currently shown as Missing, after a confirmation listing them. | The confirmation lists Venue (and may list other columns the Hub already wants, which is fine). Confirm. The alert says the columns were created and Venue now shows as ready. If you don't want the other columns yet, cancel and tell the developer. | |
| A.3 | In SharePoint, open the **Tasks & Job Tickets** list → Settings | A **Venue** column (single line of text) is listed. | |
| A.4 | Reload the Hub (so it doesn't remember a missing column from earlier in the session) | — | |

If A.1 shows Venue as ready before you've added it, the list already has a column called Venue. Check its type in SharePoint list settings and tell the developer before going on. A non-text Venue column will reject saves, and the Hub will put Venue in Notes instead.

## Part B: manual job ticket (SAFE-02 and Venue)

| # | Step | Expected | Result |
|---|---|---|---|
| B.1 | **＋ Submit something → Maintenance / Update Ticket**. Title `TEST manual ticket`, Venue **Hotel Darwin**, pick any activity in Campaign, Job Type Web Update, a due date next week, assign to the second person, add a note. Submit. | "Job submitted and *name* was emailed." It does **not** say Venue was saved in Notes. | |
| B.2 | In SharePoint, open the new item in Tasks & Job Tickets | Venue = Hotel Darwin. Campaign = the activity you picked. Notes contain only your note, not a "Venue:" line. AssignedTo, DueDate, TaskType correct. | |
| B.3 | Second person checks their inbox | Email "New job assigned: TEST manual ticket" with a link to Tasks & Job Tickets. The link opens the Team Work Register. | |
| B.4 | **My Work** (signed in as the assignee, or Team Work Register → All Team) | The ticket appears with the Hotel Darwin venue tag. | |
| B.5 | Tick the ticket complete, then untick it | Status changes both ways and persists after a reload. | |
| B.6 | Edit the ticket's title and save | Saves and persists after a reload. | |
| B.7 | Delete the ticket | It disappears and is gone from SharePoint after a reload. | |

## Part C: approval creates the right tickets

Submit three test activities with **＋ Submit something → Submit Activity, Event, Offer**. Each start date should be at least four weeks away, so due dates aren't in the past.

| Activity | Activity Group › Subtype | Venue | Other answers |
|---|---|---|---|
| C1 `TEST ticketed gig` | Events & Entertainment › Themed Event | The Left Bank | Ticketed = Yes, platform filled in. Channels: Website, Meta (not Newsletter). Assets: Meta, TVs (with TV detail). POS not required. |
| C2 `TEST Loaded offer` | Campaigns & Marketing › Loaded Rewards Campaign | Whitfords Brewing Co | Loaded = Yes. App required = No. Newsletter required = Yes. POS required with POS notes. |
| C3 `TEST POS change` | Maintenance / Work Requests › POS Update | Mustang Bar | POS required with POS notes. No channels, no assets. |

Then, for each one, open **Submissions** and select **✓ Approve**.

| # | Check | Expected | Result |
|---|---|---|---|
| C.1 | C1 preview header | "Playbook: Ticketed Event · chosen from Activity Group: Events & Entertainment › Themed Event". | |
| C.2 | C1 rows | Design brief (notes list Meta, TVs and the TV detail), ticket platform (notes show the platform), website page, social launch and reminder, in-venue signage: all **ticked**. EDM row present but **unticked**, with "unticked: Newsletter not selected". | |
| C.3 | C2 preview header | "Playbook: Loaded Rewards · chosen from Activity Group: Campaigns & Marketing › Loaded Rewards Campaign". | |
| C.4 | C2 rows | Push notification row **unticked** ("App not required"). POS pricing update ticked, with your POS notes. EDM ticked. | |
| C.5 | C3 preview | "Playbook: Request: POS". A single POS update ticket with your POS notes. | |
| C.6 | In C1, change one owner to yourself and one due date, tick EDM back on, untick in-venue signage. Select **Create tasks & Approve**. | Toast "approved → In Design, tasks created", with no Venue-in-Notes warning. Activity leaves Submissions and shows as Planning. | |
| C.7 | In SharePoint, check C1's tickets | Exactly the ticked rows exist: EDM present, signage absent. Each has Campaign = C1, **Venue = The Left Bank**, your changed owner and due date, and the submission details in Notes. | |
| C.8 | Approve C2 and C3 with the defaults | Same as C.6 and C.7 for their rows. Venue = Whitfords Brewing Co and Mustang Bar. | |
| C.9 | In **My Work** (which shows tickets assigned to you), search for `TEST ticketed gig`. If C1 belongs to a Project, open **Projects**. | Search finds C1's tickets by activity name (this proves the Campaign link is read back). The project card's open-work count includes them. | |

## Part D: skip path

| # | Step | Expected | Result |
|---|---|---|---|
| D.1 | Submit `TEST skip`, any group. Approve it and select **Skip tasks, just approve**. | Toast "approved → In Design (no tasks created)". No tickets in SharePoint for it. | |

## Part E: no duplicates

| # | Step | Expected | Result |
|---|---|---|---|
| E.1 | In SharePoint, open C1 in Marketing & Activations 2026 | Design Job Created = Yes. | |
| E.2 | Set C1's stage back to Intake in the Hub (or WorkflowStage in SharePoint) and approve it again | No preview opens. It goes straight to In Design and no new tickets are created. | |
| E.3 | Submit `TEST double click`. In the preview, double-click **Create tasks & Approve**. | Each ticket is created once (check the count in SharePoint). | |

## Part F: failure handling

This needs a ticket to fail on purpose. The simplest way is for someone with SharePoint list-settings access to make **TaskType** temporarily reject one value. Skip this part if that isn't practical, and note it as not run.

| # | Step | Expected | Result |
|---|---|---|---|
| F.1 | Submit `TEST failure`, approve it, and select Create with a ticket that will fail | Message "*n* task(s) could not be created — the activity stays at Intake", naming the failed ticket and the HTTP status. Activity is still in Submissions at Intake. | |
| F.2 | Undo the list change and select **Retry remaining & Approve** | Only the failed ticket is created (no duplicates of the ones that already saved). Activity then moves to In Design. | |

## Part G: clean up

1. In Tasks & Job Tickets, delete every item whose title contains `TEST`.
2. In Marketing & Activations 2026, delete or archive every `TEST` activity.
3. Leave the Venue column in place.

## Results

| Part | Pass / Fail / Not run | Notes |
|---|---|---|
| Before you start | | |
| A: Venue column | | |
| B: Manual ticket (SAFE-02) | | |
| C: Approval tickets | | |
| D: Skip | | |
| E: No duplicates | | |
| F: Failure handling | | |

Tested by: ________ Date: ________

When every part passes, mark SUB-03 / FLOW-01 and SAFE-02 as verified in `OS_RESET_MASTER.md`.
