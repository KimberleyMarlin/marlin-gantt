# Live test: job tickets and approval flow

Covers SUB-03 / FLOW-01 and the shared-task write checks for SAFE-02 in `OS_RESET_MASTER.md`. Run it against the live SharePoint lists, signed in to the Hub with a real account.

- **Time:** about 75 minutes.
- **Who:** Kimberley, because Part A uses Schema Tools, which only Kimberley can use. Parts B to H can be run by anyone with approve rights, with a second person available to receive an assignment email.
- **Record:** fill in the Result column (Pass / Fail plus a note) as you go. For any Fail, copy the exact on-screen message and take a screenshot.

Use `TEST` at the start of every title so the test records are easy to find and delete in Part I.

## Before you start

| # | Check | Expected | Result |
|---|---|---|---|
| 0.1 | Open the Hub and sign in | Sidebar footer shows Live · SharePoint. Your role is shown next to your name. | |
| 0.2 | Open **Admin & Schema** | Page loads with the list of proposed SharePoint columns. | |
| 0.3 | In **Proposed SharePoint columns**, find **Design Job Created** (Marketing & Activations 2026) | Shows as ready. If it shows Missing, add it first (see A.2 for how **Add missing** works). Duplicate protection (Part E) depends on it. | |
| 0.4 | Find **Activity Group** and **Activity Subtype** (Marketing & Activations 2026) | Both ready. If missing, add them the same way. Ticket selection in Part C depends on them. | |
| 0.5 | Find **Sent Back Note** (Marketing & Activations 2026) | Ready. If missing, add it the same way. Part H's "Send back" status depends on it. | |

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
| B.8 | **Team Work Register → ＋ New task**. Title `TEST register task`, pick any activity under **Linked campaign**. Save. | In SharePoint the item's Campaign = that activity and Venue = that activity's venue. | |
| B.9 | Open `TEST register task` to edit | The Linked campaign dropdown shows the activity you picked (not "Not linked"). | |
| B.10 | Change Linked campaign to **Not linked to a campaign** and save | Saves. In SharePoint, Campaign is now empty. If the Hub shows "clearing the activity link was rejected", note it as a Fail: SharePoint refused to blank the lookup. | |
| B.11 | **Design → ＋ Submit Brief**. Title `TEST brief`, pick an activity, venue and job type. Submit. | In SharePoint the new item's Campaign = that activity, and Venue = the venue you picked. | |

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
| C.2 | C1 rows | Web tickets (ticket platform, website page) default to **Didier**; design and signage to Luca. Design brief (notes list Meta, TVs and the TV detail), ticket platform (notes show the platform), website page, social launch and reminder, in-venue signage: all **ticked**. EDM row present but **unticked**, with "unticked: Newsletter not selected". | |
| C.3 | C2 preview header | "Playbook: Loaded Rewards · chosen from Activity Group: Campaigns & Marketing › Loaded Rewards Campaign". | |
| C.4 | C2 rows | Push notification row **unticked** ("App not required"). POS pricing update ticked, with your POS notes. EDM ticked. | |
| C.5 | C3 preview | "Playbook: Request: POS". A single POS update ticket with your POS notes. | |
| C.6 | In C1, change one owner to yourself and one due date, tick EDM back on, untick in-venue signage. Select **Create tasks & Approve**. | Toast "approved → In Design, tasks created — *n* owners emailed", with no Venue-in-Notes warning. Activity leaves Submissions and shows as Planning. | |
| C.6a | Each owner other than you checks their inbox | Exactly **one** email each, "*n* new job tickets: TEST ticketed gig", listing only their own tickets with due dates. You get no email for the ticket you assigned to yourself. If the toast says "email not sent to …", note who. | |
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
| E.3a | Only if Design Job Created was **missing** at step 0.3 and you chose not to add it: approve a new `TEST no flag` activity with tickets | After the toast, a red message says the "Design Job Created" marker did not save and approving again could create a second set. Otherwise mark Not run. | |
| E.3 | Submit `TEST double click`. In the preview, double-click **Create tasks & Approve**. | Each ticket is created once (check the count in SharePoint). | |

## Part F: failure handling

This needs a ticket to fail on purpose. The simplest way is for someone with SharePoint list-settings access to make **TaskType** temporarily reject one value. Skip this part if that isn't practical, and note it as not run.

| # | Step | Expected | Result |
|---|---|---|---|
| F.1 | Submit `TEST failure`, approve it, and select Create with a ticket that will fail | Message "*n* task(s) could not be created — the activity stays at Intake", naming the failed ticket and the HTTP status. Activity is still in Submissions at Intake. | |
| F.2 | Undo the list change and select **Retry remaining & Approve** | Only the failed ticket is created (no duplicates of the ones that already saved). Activity then moves to In Design. | |

## Part G: recurring "Duplicate as next month"

| # | Step | Expected | Result |
|---|---|---|---|
| G.1 | Open C1 (`TEST ticketed gig`, now In Design) and select **↻ Duplicate as next month** | The confirmation says you'll see its proposed job tickets next. After it's created, the job ticket preview opens with **Create job tickets** and **Skip, no job tickets**, and due dates based on next month's start date. | |
| G.2 | Select **Create job tickets** | Toast "job tickets created". In SharePoint the tickets are linked to the **new** activity (not C1), and the new activity has Design Job Created = Yes. The submitter gets no "approved" message. | |
| G.3 | Duplicate C1 again and select **Skip, no job tickets** | Toast "with no job tickets". No tickets in SharePoint for that new activity. | |

## Part H: activity view, submit form and Send back

| # | Step | Expected | Result |
|---|---|---|---|
| H.1 | Open C1 (`TEST ticketed gig`) from the Calendar or Activities list | A **Job tickets** section, above Design, lists every ticket created in Part C with owner, venue, due date and status, plus "*x* of *y* done". | |
| H.2 | In that section, tick one ticket done | The tick shows straight away and "of *y* done" goes up by one. After a reload it's still done. | |
| H.3 | Click a ticket's title | The ticket editor opens on top of the activity. Change the due date and save: the section shows the new date. | |
| H.4 | **Activities** table, find C1 | Under its stage, a "*x*/*y* tickets" chip matching H.2. | |
| H.5 | Set C2 back to Review (edit its stage) and open **Submissions** | Its card under **In review** shows its "*x*/*y* tickets" chip. | |
| H.6 | **＋ Submit something → Submit Activity, Event, Offer**. Fill in everything except Activity Group, and submit. | It stops with "Please choose an Activity Group and Activity Subtype…". Nothing is created. | |
| H.7 | Submit `TEST send back` properly. On **Submissions**, select **↩ Send back** and give the reason "Please add the ticket price". | Toast "sent back to *you*". The card stays under Submissions with "Sent back — waiting on submitter. Please add the ticket price (*name*, *date*)". After a reload it's still shown. | |
| H.8 | Check the **Inbox** as the submitter | A tag on `TEST send back`: "sent back for changes by *name*: Please add the ticket price. Please edit the activity to resubmit." | |
| H.9 | Open `TEST send back`, edit any field and save | Back on **Submissions**, the "Sent back" message has gone and the card is still at Intake, ready to approve. | |
| H.10 | **＋ Submit something → "Admin: Bulk import activities from a reviewed CSV"**: preflight a CSV with one row that has an "Activity Group" column filled in and one that doesn't | The log starts with "1 row has no Activity Group", naming the second row. After importing, the first row's activity has its Group set. | |

## Part J: five stages

| # | Step | Expected | Result |
|---|---|---|---|
| J.1 | Open **Pipeline** | Columns are Submissions, Planning, Review, Live, Done. There's no In Build or Ready for Live column. | |
| J.2 | Open any activity and look at the Stage dropdown, the Activities stage filter and the bulk "Set stage…" menu | Each offers only the five stages. | |
| J.3 | **Admin & Schema → Stage clean-up** | Shows how many activities are still stored as In Build or Ready for Live, and what they'll become. Activities stored that way already show as Planning or Review elsewhere in the Hub. | |
| J.4 | Select **Save … in the new stages** and confirm | "*n* activities saved in their new stage". In SharePoint, none are left as In Build or Ready for Live. | |
| J.5 | In SharePoint list settings, edit the **WorkflowStage** column and remove the In Build and Ready for Live choices | The column offers only the five stages. Do this after J.4. | |

## Part K: team queues

| # | Step | Expected | Result |
|---|---|---|---|
| K.1 | Select **Queues** in the sidebar (where Design Jobs was) | "Team Queues" page with tabs Design, Web, Social & EDM, Ops & POS, Other. Each tab shows how many open job tickets it has. | |
| K.2 | Open each tab | Design shows the design and signage tickets from Part C, Web the ticket platform and website tickets, Social & EDM the social and EDM tickets, Ops & POS the POS and staff brief tickets. Each row shows activity, venue, type, owner, due date and status, soonest due first. Overdue dates are rust. | |
| K.3 | Try **Mine**, **Unassigned** and **Overdue** | Each narrows the list as named, and the counts match. | |
| K.4 | Tick a ticket in a queue | It leaves the queue (open tickets only). Its activity's Job tickets section shows it done. | |
| K.5 | Click a ticket's activity name | The activity opens. Under **Build Channels** each line now says e.g. "In Progress · 1/2 tickets done". It can't be changed by hand. | |
| K.6 | Sign in as Luca or Didier (design role) | The Hub opens on Queues → Design. | |

## Part I: clean up

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
| G: Duplicate as next month | | |
| H: Activity view, form, Send back | | |
| J: Five stages | | |
| K: Team queues | | |

Tested by: ________ Date: ________

When every part passes, mark SUB-03 / FLOW-01 and SAFE-02 as verified in `OS_RESET_MASTER.md`.
