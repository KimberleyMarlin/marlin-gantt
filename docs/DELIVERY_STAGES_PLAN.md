# Delivery stages plan: Planning to Done

Status: **proposal, nothing built.** Written 19 Nov 2026 from the code on `main`. It covers gaps 10 and 11 from the 18 Nov job ticket audit. The decisions at the end are Kim's to make before anything is built.

## What the code does today

**The stages.** `CANONICAL_STAGES` has seven: Intake, In Design, In Build, Review, Ready for Live, Live, Done. Intake displays as "Submissions" and In Design as "Planning" (`STAGE_LABELS`).

**What changes a stage:**

| How | From → to | Where |
|---|---|---|
| Approve on Submissions | Intake → In Design | `approveCampaign` → job ticket preview |
| Approve on an In review card | Review → Live | `approveCampaign`, one click, no checks |
| Save a post-campaign report | any → Done | `savePostCampaign` |
| Duplicate as next month | new activity at In Design | `duplicateAsNextMonth` |
| Drag on the Pipeline board, or the Stage dropdown in an activity | any → any | `pipeDrop`, `savePopEdit` |

**What that means in practice:**
- **In Build and Ready for Live** are only ever set by hand (drag or dropdown). Ready for Live is read in one place: the dashboard's Upcoming Launches list (`renderDashUpcomingLaunches`), which would switch to Review items with the Ready badge.
- **Review** is only reached by hand, and approving from Review jumps straight to Live without checking anything.
- **Finishing job tickets** has no effect on the activity's stage.
- **After the end date**, an activity *shows* as Done (`autoCompleted`) without anything being saved. The dashboard then nudges for a post-campaign report.
- **Two parallel progress trackers.** Each activity has hand-set Web / Loaded / Social status fields ("Build Channels": `WebStatus`, `LoadedStatus`, `SocialStatus`). They duplicate what job tickets now track.
- **Design Jobs** (`renderDesign`) lists *activities* that are In Design or have a design brief due, not design tickets. Web, Social/EDM and Ops/POS have no queue at all. People find their tickets in My Work or the Team Work Register.

## (a) Cut to five stages

**Recommendation:** use **Intake (Submissions) → Planning → Review → Live → Done**.

- **In Build** has no meaning a ticket doesn't already give: "tickets in progress" *is* the build.
- **Ready for Live** is the end of Review ("checks passed, waiting for the start date"). It's better shown as a "Ready" badge on a Review card than as its own stage.

**Mapping existing records.** This is a one-off script run from Admin & Schema, with a preview first and a count per stage:

| Stored value | Becomes |
|---|---|
| Intake | Intake |
| In Design, In Build | In Design (still displayed as Planning; the stored value doesn't need renaming) |
| Review | Review |
| Ready for Live | Review, with the Ready badge if its checks pass |
| Live, Done | unchanged |

**Code changes:**
- Drop the two stages from `CANONICAL_STAGES`, the Pipeline columns, stage colours and the Stage dropdown.
- `normaliseStage` maps the old values on read, so nothing breaks before the script runs.
- The SharePoint `WorkflowStage` choice column keeps the old values until the script has run, then they're removed by hand.

## (b) Planning → Review automatically

When the **last open job ticket** on an activity is marked Done, the activity moves to Review. "Open" means anything not Done; Blocked counts as open. The move happens:
- **From the Hub:** whenever a ticket is ticked done or saved as Done (Team Work Register, My Work, the activity's Job tickets section). One shared check runs after the save succeeds.
- **Never backwards automatically.** Re-opening a ticket doesn't pull the activity back to Planning; a person decides that.
- **Not for activities with zero tickets** (approved with "Skip"). These stay in Planning until moved by hand, and get a "No job tickets" badge.

The person who finished the last ticket sees "All job tickets done — moved to Review". The activity owner is tagged in the Inbox.

**Limitation:** tickets marked Done directly in SharePoint, or by a Power Automate flow, won't trigger the move. To catch them, the Hub can run the same check for every Planning activity whenever tickets load. That's a write on page load, so it should run only for approvers.

## (c) What Review shows, and what blocks Go Live

Review becomes a checklist card per activity, on Submissions' **In review** section. Each line shows what the Hub already stores:

| Check | Source | Blocks Go Live? |
|---|---|---|
| All job tickets done | Tasks & Job Tickets | **Yes** |
| Final artwork | `Artwork File`, or a file in `JobFolderURL` / `LinkedArtworkFolderURL` | **Yes**, if the activity had a design ticket |
| Landing page / booking / ticket link | `LandingPageURL`, `BookingURL`, `TicketURL` | **Yes**, if a web or ticketing ticket existed. The link must be filled in. |
| Social posts | Social Posts list, linked by `ActivityId` (status and `PostUrl`) | No. Shown as "2 scheduled, 1 posted". |
| POS done | POS ticket status | Covered by "all tickets done" |
| Featured photo | `EventImageRef` | No. A warning only. |

- **Go Live** replaces today's one-click Approve on Review cards. It stays disabled, with the blocking lines in rust, until the blocking checks pass.
- **"Go live anyway"** (approvers only) asks for a reason, which is saved to the activity's description history, the same way Deny reasons are.
- **The Ready badge** shows when every blocking check passes.

## (d) Team queues built from job tickets

Replace Design Jobs with one **Queues** page. It has four tabs, built from Tasks & Job Tickets by `TaskType`:

| Tab | TaskTypes | Default owner |
|---|---|---|
| Design | Design Asset, Print / Signage | Luca |
| Web | Web Update | Didier |
| Social & EDM | Social Post, EDM / Newsletter, Paid Ad | Marketing (approver) |
| Ops & POS | POS Update, Admin (staff briefs, app setup) | Perrin |

`General` tickets appear under an **Other** filter.

Each row shows:
- the ticket, its activity and venue
- the due date, with an overdue flag in rust
- the owner and status

Rows sort by due date. Filters: Mine / All / Unassigned / Overdue. Anyone can see every queue. Ticking done and editing follow the existing `canEditTeamTask` rules. Ticking the last ticket triggers (b).

**What happens to the old pieces:**
- The **Design Jobs** sidebar item points to Queues → Design.
- **Workload** stays as it is. It already counts open activities plus open job tickets per person.
- The **Build Channels** fields (`WebStatus`, `LoadedStatus`, `SocialStatus`) become read-only and derived from tickets ("2/3 web tickets done"), so there's one source of truth. The SharePoint columns are left in place for old records.

## (e) Live on the start date, Done after the end

**Live.** An activity in Review whose blocking checks pass moves to Live on its start date.
- A static web page can't run on a timer, so the Hub runs this check when an approver opens it.
- A Power Automate flow running at 6am daily would be more reliable. It needs Kim to set up.
- Until then, Review cards past their start date get a rust "Start date passed — go live" warning.

**Done.** Two ways:
1. Saving the post-campaign report sets Done, as today.
2. After the end date, Live activities **show** as Done, as today (`autoCompleted`), but are only **saved** as Done once the report is in.

This keeps "needs report" working. There's no Done without numbers, unless an approver marks an activity Done with "no report needed" and a reason.

## Order of work, once decided

1. **The five-stage cut and mapping (a).** This change is behind every other step.
2. **Queues (d).** No stage logic, and useful straight away.
3. **Planning → Review on last ticket (b).**
4. **Review checklist and Go Live blocking (c).**
5. **Live on the start date and Done rules (e).** Needs the Power Automate decision.

Each step is one PR, with a live-test section added to `LIVE_TEST_JOB_TICKETS.md`.

## Decisions for Kim

1. **Cut to five stages?** This means removing In Build and Ready for Live and folding existing records in as mapped above. *Recommend: yes.*
2. **Move to Review automatically when the last job ticket is done?** *Recommend: yes, forwards only. Activities with no tickets stay in Planning until moved by hand.*
3. **What should block Go Live?** *Recommend: all tickets done, final artwork when there was design work, and the live link when there was web or ticketing work. Social posts and the featured photo are warnings only. Approvers can "go live anyway" with a reason.*
4. **Replace Design Jobs with a four-tab Queues page (Design, Web, Social & EDM, Ops & POS)?** *Recommend: yes.* Also confirm the default owners: Luca, Didier, the approver, Perrin.
5. **Make the Web / Loaded / Social status fields read-only and calculated from tickets?** *Recommend: yes,* so there's one place to update progress.
6. **How should activities go Live on their start date?** Options: a Power Automate flow you set up (most reliable), or the Hub doing it when an approver opens it, with a warning for any missed. *Recommend: start with the Hub plus warning, and add the flow later.*
7. **Allow Done only after the post-campaign report, or "no report needed" with a reason?** *Recommend: yes.*
