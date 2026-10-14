# Activity taxonomy & workflow audit — Phase 0

Produced: 2026-10-14, against `index.html` as merged to `main` (post ed95a8a).

This is the Phase 0 deliverable for the "Master Briefing, Activity Classification & Ticketing System" brief: an audit of what the Hub actually does today, classified Keep / Refine / Consolidate / Add, plus the compatibility risks and a proposed sequence. It supersedes the stale parts of `FIELD_MAPPING.md` and `SUBMISSION_WORKFLOW.md` (both dated 2026-08-12) without replacing them — those get updated as each phase actually ships.

## 1. Current-state findings

### 1.1 Activity Type is defined three different ways
- **Submit form** (`#fActType`): `Event`, `Promotion / Offer`, `Campaign` — 3 values, no `Maintenance / Update`.
- **Activity detail popup** (`editField('Activity Type', ...)`): `Event`, `Promotion / Offer`, `Campaign`, `Maintenance / Update` — 4 values, no blank.
- **Bulk import**: no list at all — the raw CSV cell is written straight to `ActivityType` with zero validation.
- `autoSelectPlaybook()` matches lower-cased `'maintenance / update'`, which the Submit form can never produce — so a brand-new activity can never land in that playbook branch from the main form.
- Legacy compat: `f.ActivityType||f.ActivationType||''` — a still-live fallback to an even older field name.

### 1.2 Business Stream ("Marketing Funnel") — inconsistent
- Submit form: 6 values, no `Marketing Operations`.
- Detail popup: 7 values (adds `Marketing Operations`), plus a blank option the submit form lacks.
- Bulk import silently defaults to `Loaded Rewards` if nothing is set (`if(!fields.BusinessStream)fields.BusinessStream='Loaded Rewards'`).

### 1.3 Campaign Silo ("Marketing Silo") — only exists post-submission
- One list, only in the detail popup: `Hero, Momentum, Always-On, Organic, Maintenance`.
- No field on the Submit form at all — a silo can't be set until after creation.
- Two separate in-memory property names (`marketingSilo` and `campaignSilo`) are both populated from the same `CampaignSilo` SharePoint column in two different places.

### 1.4 Brand ("Primary Brand") — not on the Submit form
- Detail popup only: `The Left Bank, The Ravenswood, Whitfords Brewing Co, Hotel Darwin, Mustang Bar, Loaded Rewards, Beerland Brewing`.
- At submission time it's only ever force-set to `Loaded Rewards` when the activity is a Loaded item — otherwise left blank until someone edits it afterward.
- Venue and Brand are separately hand-maintained lists that happen to mostly overlap (6 venues, +`Loaded Rewards` only on the Brand side) — exactly the "different concepts, don't conflate" problem the brief calls out, except today they're not conflated so much as *duplicated*.

### 1.5 The approval → task pipeline is disconnected (confirmed, matches your own TECH_DEBT.md)
- `PLAYBOOK_TEMPLATES` (11 templates: Ticketed Event, Live Music, Loaded Rewards, Supplier Activation, Venue Activation, Functions Campaign, Seasonal Campaign, Hero Campaign, Recurring Event, Maintenance, default) and `runPlaybook(ev)` are fully written — they'd post each template's tasks to My Tasks and advance the stage.
- `runPlaybook` is **never called**. Dead code.
- `approveCampaign()` only PATCHes `WorkflowStage` (Intake→In Design, or Review→Live) and sends a notification. **No task, job, or design brief is ever created on approval, today.**
- This is exactly your `TECH_DEBT.md` entry "Approval playbook exists but is not connected" — still true, unchanged.

### 1.6 My Tasks parent-activity link — three incompatible mechanisms (confirmed, matches TECH_DEBT.md)
- Manual job submission (`submitJob`) **writes** `RelatedCampaignId`.
- The My Tasks read-back (`loadMyTasks`) **reads** a completely different lookup column, `Campaign` — it never looks at `RelatedCampaignId` at all.
- The dead `runPlaybook` writes **neither** field.
- Personal Tasks (Kimberley's private list — a different SharePoint list entirely) uses yet another pair: `LinkedActivityId` (the real one, an EVENTS id) with `LinkedCampaignID`/`LinkedCampaign` as a legacy fallback.
- Net effect: a manually submitted job cannot currently be traced back to its activity through the read path at all. This is your own TECH_DEBT.md "Campaign task lookup is not consistently mapped," unresolved, and it's the single biggest blocker to building anything in brief section 17 (task generation) safely.

### 1.7 The "Copy" section is scattered, not a dedicated section — and includes 3 dead fields
There is no single tabbed/segmented Copy area today. What exists, all inline in the one scrolling activity-detail popup:
- **Description** — short text, always visible, editable.
- **Long Description** — only shown if the real `LongDescription` column exists; falls back to being tagged inside `Description` otherwise.
- **Loaded-only app copy** (`AppHeading`, `AppShortDescription`, `AppDescription`) — only visible when the activity is a Loaded Rewards item.
- **POS Notes** — only visible if POS is required; stored tagged inside `Description`, not its own column (known tech debt).
- **`KeyMessage`, `CTA`, `Tagline`** — fetched from SharePoint into memory on every load, but **there is no edit field, no render, and no save-back for any of the three, anywhere in the app.** They're ghost columns: present in SharePoint, invisible in the Hub.
- Separately, the **Design Brief overlay** (a different workflow, not the Activity record itself) has its own unrelated "Copy & content" fields — `Copy / Text to include`, `Key message / tone`, `Reference images` — stored nowhere near `KeyMessage`/`CTA`/`Tagline`.

**I need you to tell me which of these two is "the existing Copy section I particularly like"** before I touch anything here — they're genuinely different things today, and the brief's Section 13 requirements (headline, sub-headline, primary/secondary CTA, mandatory info, tone/style, approval states) match neither exactly. See open question 1 below.

### 1.8 Ideas already exist — this is not new
A real, working, lighter-weight Idea concept already exists, backed by its own SharePoint list, separate from the Activity pipeline — exactly what brief Section 19 asks for. It currently has **two separate entry points** feeding the same list with different field sets (a quick "Submit an Idea" flow with 5 fields, and a fuller Idea Bank "+Add idea" overlay with 10). Neither creates any work item — confirmed lightweight, as the brief wants.

### 1.9 Dead/duplicate plumbing found along the way
- `LISTS` (a second, separate constant duplicating `LIST_IDS.campaigns`'s GUID) — zero other usages, dead code.
- `IDEA_LIST_ID` — a hand-kept constant duplicating `LIST_IDS.ideas`'s GUID rather than referencing it.
- `LIST_IDS.sponsorships` is `null` — a placeholder for a feature that was never built.

### 1.10 Full SharePoint list inventory (`LIST_IDS`)
campaigns (master Activities/Campaigns — "Marketing & Activations 2026"), myTasks (shared "Tasks & Job Tickets"), personalTasks (Kimberley's private list), projects ("Marketing Projects"), offerVariants, offerMechanics (Loaded Rewards offer engine), suppliers (Schema Tools admin only — supplier *selection* in the form actually goes through a separate Lookup mechanism), ideas ("Idea Bank"), calendarRef ("Calendar Reference" — public holidays / key dates), sponsorships (null, unused), comments (activity discussion).

## 2. Keep / Refine / Consolidate / Add matrix

### KEEP
- The Hub as the single authoritative surface (per `DECISIONS.md`) — no competing database, no second portal.
- `Marketing & Activations 2026` (campaigns) as the one master Activity list.
- The Idea Bank concept and its list — already separate and lightweight, as the brief wants.
- Existing WorkflowStage enum and approval stage structure (Intake → In Design → ... → Done) — map display concepts onto it, don't replace it.
- The Event Format / Ticketed? / Recurring? / Seating split, and the Loaded Rewards offer-tier work done this session — both already move in the direction brief Sections 5, 9 and 11 ask for.
- Role-based access, SharePoint as the real permission boundary, Artwork Wall, Photo Tagging/Digital Media integration, Projects mini-Gantt, Calendar.

### REFINE
- Activity Type: one canonical list used everywhere (currently 3 vs 4 vs unvalidated-CSV).
- Business Stream: one canonical list (currently 6 vs 7).
- Campaign Silo: needs to exist on the Submit form, not only after the fact.
- Brand: needs a real, deliberate field on the Submit form instead of being set automatically only for Loaded items.
- The Copy section: pending your answer to open question 1, wire the dead `KeyMessage`/`CTA`/`Tagline` columns into an actual visible, editable section (they already exist in SharePoint — nothing to add there, just surface them) rather than leaving them silently fetched and dropped.

### CONSOLIDATE
- Pick **one** canonical campaign-lookup field for My Tasks (read and write both use it), fix `submitJob`/`loadMyTasks` to match, and only then is it safe to connect automatic task creation. This is the one true blocker before any of brief Section 17 can be built safely.
- `marketingSilo` vs `campaignSilo` → one property name.
- `LISTS` and `IDEA_LIST_ID` → remove, reference `LIST_IDS` directly.
- The two Idea submission entry points → either merge into one, or keep two deliberately (quick capture vs. detailed) and say so explicitly — open question 2.

### ADD (genuinely missing, real new work)
- A real **Activity Group** taxonomy layer (the 7 groups × many subtypes in brief Section 4) — doesn't exist; today's `ActivityType` is flat (Event/Promotion/Campaign/Maintenance). This needs to be schema-driven (one config object), not hardcoded into a 5th place.
- A true progressive-disclosure, multi-step wizard — today's Submit form is one long page with inline show/hide, not the 7-step flow in Section 3.
- ~~Automatic Activity naming engine (`[Venue/Brand] | [Type] | [Name] | [Period]`)~~ — **done 2026-10-14**: `composeAutoActivityTitle()` builds this live on the Submit form from Venue/Brand, Activity Type (or the active template's name), Activity Detail and Start Date; stays editable, stops auto-overwriting once hand-edited. The old narrower "{Template} — {Item}" builder (`composeActivityTitle()`) is archived in place, not deleted, in case this needs rolling back.
- Food & Beverage, full Events, and Promotions conditional templates at the depth described (PLU/SKU, dietary/allergen, guest collateral, bump-in/out, canonical single offer definition shared across briefs) — none of this exists today.
- Digital Advertising, Website, Email, SMS briefs as structured work items — don't exist; today it's a free-text Channels multi-select only.
- Approval → task-creation connection itself (wiring `runPlaybook`-equivalent logic to the approval flow, with the preview/confirm step the brief asks for, not immediate silent creation).
- Reporting/completion capture (attendance, redemptions, reach, etc.) with roll-up by venue/brand/stream/type/silo/project/period — only budget/spend/tickets-sold exist today.

## 3. Compatibility risks
1. Any new "Activity Group" field is additive — it must not replace or repurpose `ActivityType`'s existing values, per the brief's own instruction. Needs a new column.
2. Consolidating the My Tasks campaign-lookup field means existing job records written under the old field names become unreadable by the new logic unless backfilled — needs a one-time migration, not a silent cutover.
3. Connecting approval → automatic task creation is a real behavioural change your whole team will notice immediately (today, approving something creates nothing). Needs the preview/confirm step, not instant-on.
4. None of this can be tested by me directly — I have no live Microsoft 365/SharePoint session; every SharePoint-side change (new columns, confirming existing ones) has gone through you running a script or doing it in SharePoint directly, all session. That doesn't change here, and schema changes at this scale will need more than one round of that.

## 4. Open questions before any Phase 1 code is written
1. **Which "Copy section" do you mean** in "preserve the existing Copy section, I particularly like that part" — the Activity detail's Description/Long Description/Loaded app-copy fields, or the separate Design Brief overlay's Copy/Key message/Reference fields? They're unrelated today and I don't want to guess and enhance the wrong one.
2. The two existing Idea entry points (quick vs. detailed) — merge into one, or keep both deliberately?
3. Given the real scope here (this audit alone found 10 distinct findings, and the brief's full ask is a multi-week rebuild of the submission/taxonomy/workflow system), **do you want this done as a long sequence of small, reviewable PRs** — same as everything else this session — **starting with the safe CONSOLIDATE fixes** (unify the Activity Type/Business Stream lists, fix the My Tasks lookup, remove the dead duplicate constants) **before** the bigger ADD items (Activity Group taxonomy, the wizard, the new briefs)? I'd recommend that order specifically because the CONSOLIDATE items are what make the ADD items (task auto-generation in particular) safe to build at all.
