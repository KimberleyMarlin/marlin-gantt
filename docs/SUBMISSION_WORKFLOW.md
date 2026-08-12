# Submission to delivery workflow

Updated: 2026-08-12.

## Current live behaviour in v13

1. Activity submission creates a row in `Marketing & Activations 2026` at `WorkflowStage = Intake`.
2. The submission is tagged to the review recipient and appears in Submissions.
3. Approve changes the activity stage to `In Design`, displayed as Planning.
4. No design, web, marketing, POS or other job is created automatically.

The codebase contains `PLAYBOOK_TEMPLATES` and `runPlaybook(ev)`, but `runPlaybook` is not called by the approval path.

## Required target workflow

1. **Submit:** Venue or head office provides the core activity and reveals only relevant ticketing, Loaded, POS, channel and asset fields.
2. **Triage:** Marketing reviews the activity, corrects dates and mechanics, and confirms which deliverables are actually required.
3. **Work preview:** Approve opens a preview of proposed tickets rather than immediately creating every template task.
4. **Assign:** The approver confirms owner and due date for each proposed ticket.
5. **Create atomically:** The Hub creates linked My Tasks records, sends assignee notifications, then advances the activity to Planning. If required task creation fails, the activity remains in Intake and shows the exact failure.
6. **Produce:** Designers, web, marketing and operations work from their queues. Every ticket links back to the same parent activity.
7. **Review:** Completed deliverables move to Review, with artwork or final URLs attached.
8. **Launch:** Final approval advances the activity to Live. Completion and reporting close it as Done.

## Proposed job rules

| Submission answer | Proposed job |
|---|---|
| Any `AssetsNeeded` selection | Design Asset ticket containing the selected formats and details |
| Website channel or Website asset | Website update/page ticket |
| Meta channel | Social/Meta ticket |
| Google Ads channel | Paid media setup and tracking ticket |
| Newsletter channel or Newsletter asset | EDM/newsletter ticket |
| Ticketed Event | Ticket platform/publish ticket, plus website listing if required |
| Loaded Rewards | App setup, selected newsletter work, selected design work, and POS work only when requested |
| POS required | POS Update ticket containing the submitted POS notes |
| In-venue or TV assets | Print/screen asset ticket assigned to design |

## Blocking schema decision

Before automatic creation is connected, confirm the real My Tasks parent-activity field. The source currently uses `RelatedCampaignId` in manual Job submission, while earlier specifications refer to `LinkedCampaignID` or a SharePoint lookup. One authoritative lookup field must be used by manual jobs, design briefs and playbook jobs. This is necessary for activity navigation, duplicate prevention and reliable reporting.

