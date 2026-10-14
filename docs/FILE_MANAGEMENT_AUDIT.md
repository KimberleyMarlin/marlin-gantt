# File Management, Image Upload, Tagging & Job Archiving — Phase 0 audit

Produced: 2026-10-14, against `index.html` as merged to `main`.

Phase 0 deliverable for the "File Management, Image Upload, Tagging & Job Archiving" workstream. Audits what the Hub already does in each named area, flags what's operational vs. missing vs. actually broken, and feeds the PR sequence this workstream follows (PR 1 = this audit + the cascading-archive fix; PR 2+ = file/media work, not started yet).

## 0. Critical finding — live, exposed Google Cloud Vision API key

**`GOOGLE_VISION_API_KEY` (index.html, top-of-file constants) is a real, hardcoded, billable Google Cloud API key sitting in this app's client-side JavaScript.** Since this is a static GitHub Pages site, that key is visible to anyone who views the deployed page's source — no sign-in required to see it, unlike every Microsoft Graph call in this app (which needs a signed-in M365 token). It's actively used: Photo Tagging calls `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}` directly from the browser.

This predates this session — I didn't introduce it, I found it while auditing Photo Tagging for this workstream. It's a genuine, live risk: anyone who finds the key (viewing source, or finding it in GitHub history, which doesn't disappear even if the live line is edited) could run up Vision API usage against Marlin's Google Cloud billing, or exhaust quota, with no connection to this Hub's own authentication at all.

**Recommended immediate action (yours to take — I can't do this myself):** rotate/revoke this key in Google Cloud Console now, independent of anything else in this PR. A new key placed back in the same client-side location would be exposed again just as fast, so Photo Tagging's AI-suggestion feature needs an architectural fix (the image-recognition call moved behind something that isn't the public browser — a small server-side proxy, or routed through Power Automate, which already exists as a server-side actor in this system) before it's safe to keep using. This PR does not touch Photo Tagging code — that's a decision for you, given "do not introduce new paid services... without approval" applies to however it gets fixed.

## 1. SharePoint Activity folders and `JobFolderURL`

- `JobFolderURL` is a real, already-confirmed column on `campaigns`, written back by the **existing Power Automate flow** after it creates each Activity's folder — the Hub only reads it (`jobFolderUrl`), never creates or guesses the path itself.
- This session already fixed a real production break in that flow (the automatic-naming engine's `|` separator broke folder creation; now `_`) — nothing about folder creation or its trigger is touched by this PR, per your explicit instruction.
- Activity detail shows the folder link when present; there's no UI yet for "folder pending" vs. "folder ready" beyond the link simply being blank until Power Automate writes it.

## 2. Digital Media / Drive Search — two separate, unrelated systems today

- **"Drive Search"** (`renderDriveSearch`/`searchGoogleDrive`) is a **Google Drive** search — a person connects their own Google account via OAuth and searches their Google Drive for images. It has nothing to do with SharePoint and nothing to do with Activities.
- **"Digital Media"** (`DIGITAL_MEDIA_DRIVE_ID`, used by Photo Tagging) is a real **SharePoint document library drive**, browsed folder-by-folder. This is the Hub's actual reusable-asset store today, separate from any one Activity's `JobFolderURL` folder.
- These two are not connected to each other, and neither is connected to Activity folders. There's no existing bridge between "files in an Activity's own folder" and "reusable assets in Digital Media" — Phase 2's "Investigate the existing Digital Media storage... before creating a new location" is answered: **Digital Media is the existing reusable-asset location to build on**, not something to replace.

## 3. Photo Tagging

- Browses/searches the Digital Media SharePoint drive (folder navigation + a cached flat index for search).
- Calls Google Vision directly from the browser for AI label suggestions (see the critical finding above), writing results to an `AITags` column.
- No manual tag add/remove/edit UI found, no multi-select bulk tagging, no controlled vocabulary (Venue/Brand/Project/Asset Type/etc.) — it's AI-labels-only today, and those labels are suggestions written straight to the file with no review step visible in the code (worth confirming directly, but no "approve this tag" UI was found).
- No upload capability — Photo Tagging only browses what's already in Digital Media; it doesn't add to it.

## 4. Image uploads and previews

**Nothing exists.** No drag-and-drop, no `<input type="file">` for images, no Microsoft Graph upload-session code anywhere in `index.html`. Phase 3 (Image Upload Experience) is genuinely new work, not a stabilisation of something partial — though it should land inside the existing Digital Media drive and Activity `JobFolderURL` folders as destinations, not a new storage location.

## 5. Artwork and Design Jobs

- Design Jobs panel (`renderDesign`) tracks Activities in `In Design` stage / with a `designBriefDue` date — a workflow view, not a file manager.
- Design Brief overlay (`openDesignBrief`/`saveDesignBrief`) captures brief text against an Activity.
- A separate Artwork panel/feed exists (`PANEL_TITLES.artwork`) — not yet audited in depth; worth a closer look before Phase 6 (Artwork Approval & File Versions) starts, since it's the thing that workstream explicitly says to preserve rather than replace.
- None of these link to actual files beyond the one shared `JobFolderURL` per Activity and free-text "what's needed" fields (`AssetTVsDetail`, `AssetNewsletterDetail`, the new specialist-brief fields from the previous workstream) — there's no "this specific image/file is the approved final asset" link anywhere yet.

## 6. Existing metadata and tagging

Only `AITags` (Photo Tagging's AI output) was found. No Venue/Brand/Project/Campaign/Asset Type/Usage Rights/Approval Status columns exist on the Digital Media library today — Phase 4's metadata model is new work, not an extension of something already there, though it should be built as real SharePoint document-library columns (consistent with how the rest of this Hub already treats SharePoint columns as the source of truth) rather than a parallel database.

## 7. SharePoint file storage and permissions

The Hub never implements its own access control for files — every file operation found (Digital Media browsing, the planned uploads) goes through Microsoft Graph with the signed-in user's own token, so real SharePoint permissions are already the enforcement boundary. Nothing to build here; Phase 3's security requirement ("use existing M365 authentication context and actual SharePoint permissions") is already how this app works everywhere else.

## 8. Job creation, archival and deletion — the confirmed regression, now fixed in this PR

- **Creation**: `submitEvent()` creates the Activity in SharePoint; Power Automate reacts to that and creates the folder. Unaffected by this PR.
- **Archival** (`archiveCampaign()`/`denyCampaign()` → `persistArchiveState()`): confirmed to **only** PATCH the Activity's own `Status`/`WorkflowStage`/`Description`. It never looked at `MY_TASKS`, `PERSONAL_TASKS`, or anything else — exactly the regression reported. **Fixed in this PR** — see below.
- **Deletion**: there is **no delete function at all** anywhere in the codebase today (confirmed by search). Phase 1's "Delete Job" (soft-delete, preview of dependents, confirmation, separate permanent-delete permission) is entirely new work. **Deliberately not built in this PR** — see "What's deferred" below.

## 9. Related Tasks, subtasks, approvals, reminders and follow-ups

- **Shared Tasks** (`MY_TASKS`) link to an Activity by the real `Campaign` Lookup column (`campaignLookupId`, a stable SharePoint id) — this session's earlier work already fixed the write/read mismatch that used to make this unreliable (see `TECH_DEBT.md`).
- **Personal Tasks** (`PERSONAL_TASKS`) link to an Activity via `LinkedActivityId`, also a stable id. This list is private to exactly one person (gated by `canAccessPrivatePersonalTasks()`); nobody else's session ever loads its contents. Personal Tasks already support subtasks via `ParentTaskId`.
- **Approvals**: there is no separate "Approval" record — approval state *is* the Activity's own `WorkflowStage` (Intake/Review/etc). Nothing extra to cancel beyond the Activity's own state, which archiving already updates.
- **Notifications** (`NOTIFS`): entirely computed fresh from live `EVENTS`/`MY_TASKS` state on every render — not stored records. Once the underlying Activity and its linked Tasks correctly reflect "closed", the notifications that reference them stop generating on their own; there's no separate notification table to clean up.
- **Checklists**: no distinct checklist entity exists anywhere in the codebase. The closest equivalents are Personal Tasks' subtasks and the Promote/Artwork matrix's per-channel checkboxes (which belong to the Activity record itself, not a separate child record).

## 10. My Work, Dashboard and Project relationships — the actual bug mechanism

Every "is this task still active" check across My Day, My Tasks, My Work, Team Workload, the Dashboard's widgets and Projects' work-count reads a task's **own** `status` field directly — none of them ever checked whether the task's *parent* Activity was archived. And critically, **none of these checks recognised `'Cancelled'` as a closed state for a task** (only `'Done'`/`'Complete'`/`'Completed'`, or in several places literally only `'Done'`) — so even if archiving had set a linked task's status to `'Cancelled'`, it would have kept showing up as "open" everywhere anyway. This is why the regression was invisible from any one place: there was no single spot to fix, and the one plausible fix (writing a cancelled status) wouldn't have worked without this separate bug also being fixed.

**Fixed in this PR**: a shared `isTaskClosed(status)` helper (mirroring the existing `isArchived(event)` for Activities) now backs every one of these ~30 call sites, so "closed" means the same thing everywhere a task's status is checked.

## What this PR (PR 1) actually does

1. `isTaskClosed()` helper + every active-task filter, count and notification across My Day, My Tasks, My Work, Team Workload, Projects and the Dashboard updated to use it, so `'Cancelled'` is finally recognised as closed everywhere, consistently.
2. `findDependentWork(activity)` — finds a Job's directly-dependent, still-open Shared Tasks and (same-user-only) Personal Tasks, by stable SharePoint id only, never by title.
3. `cascadeArchiveJobWork(activity, token)` — cancels (never deletes) each one found, tagging its Notes field so a cascade-cancelled item is distinguishable later, and returns a per-item failure list rather than throwing, so one bad field never blocks the rest.
4. `archiveCampaign()`/`denyCampaign()` now preview the dependent-work count before asking for a reason, run the cascade after the Activity itself is successfully archived, and fold the result into the confirmation message — including telling you explicitly if something couldn't be cancelled, rather than reporting a clean success over a partial failure.
5. **Orphaned Task Repair** (Schema Tools, admin-only) — scans every already-archived Activity for Tasks/follow-ups still showing as open (from before this fix existed), previews them, and only cancels on explicit confirmation — per-Activity or all at once.

## What's deliberately deferred to follow-up PRs

- **Delete Job** (soft-delete, dependent-record preview, confirmation, separate permanent-delete permission) — genuinely new, separate-sized feature from the cascade-archive bug fix. Bundling both into one PR risked a much larger, harder-to-review change for an urgent regression fix; this is flagged as its own next PR.
- **Restore** a cascade-archived Job's children — the Notes-field tag this PR adds (`[Auto-cancelled: parent Activity archived]`) lays the groundwork (a cascade-cancelled item is identifiable, separate from one that was already closed independently), but the Restore UI itself isn't built yet.
- Everything in Phases 2–7 (unified file/image management, upload experience, metadata/tagging, asset gallery, artwork versions, dashboard/work-management integration) — explicitly sequenced after this fix in your own delivery order, and blocked in part on your decision about the Vision API key above.
