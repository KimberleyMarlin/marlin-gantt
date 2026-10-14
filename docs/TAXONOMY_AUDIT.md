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
- ~~The two Idea submission entry points~~ — **done 2026-10-14**: both now call one shared `saveIdeaRecord()` instead of each POSTing their own hand-built fields object. Quick Capture stays genuinely quick (fewer fields shown); the Idea Bank overlay shows more. Per Kimberley's own spec: "Save Idea" vs "Continue Brief" actions, an idea is now editable in place (✏️ Edit reopens the SAME record via a PATCH, not a new POST), and "Continue Brief" carries Venue/Activity Type/Description/Ticketed into the Activity submission form. A promoted idea is linked to its resulting Activity (`PromotedActivityId`) so reopening it opens that Activity instead of letting it be promoted twice. Still not built: the full 5-step wizard UI (Steps 2–4 currently reuse the existing Activity submission form's own conditional sections rather than new step panels) — that's bigger work tied to the Activity Group taxonomy and new conditional templates (Phase 2), not yet started.

### ADD (genuinely missing, real new work)
- ~~A real **Activity Group** taxonomy layer~~ — **done 2026-10-14**: `ACTIVITY_GROUPS` (one config object, the brief's 7 groups × ~60 subtypes) drives cascading Group→Subtype dropdowns on both the Submit form and the Activity detail popup. Purely additive — `ActivityType` (Event/Promotion/Campaign/Maintenance) is untouched everywhere it's already used. `ActivityGroup` is a new Choice column (7 values); `ActivitySubtype` is Text rather than Choice, since the ~60 values are already constrained by the Hub's own dropdown and a second SharePoint choice list would just be a harder-to-maintain duplicate. Not yet built: using Group/Subtype to actually drive different conditional question sets per type (the F&B/Events/Promotions templates from brief Sections 8-11) — that's the next logical step, now that the classification layer exists to key off.
- A true progressive-disclosure, multi-step wizard — today's Submit form is one long page with inline show/hide, not the 7-step flow in Section 3.
- ~~Automatic Activity naming engine (`[Venue/Brand] | [Type] | [Name] | [Period]`)~~ — **done 2026-10-14**: `composeAutoActivityTitle()` builds this live on the Submit form from Venue/Brand, Activity Type (or the active template's name), Activity Detail and Start Date; stays editable, stops auto-overwriting once hand-edited. The old narrower "{Template} — {Item}" builder (`composeActivityTitle()`) is archived in place, not deleted, in case this needs rolling back.
- **Food & Beverage conditional template — first slice done 2026-10-14**: a new section (Item Status, Dietary/Allergen Info, Availability Notes, Photography/Supplier Branding Available, Printed/Digital Menu Update Required, Staff Briefing Required) appears on the Submit form only when Activity Group = Food & Beverage. Deliberately doesn't repeat fields the form already asks (Price → RegularPrice, Member Price → LoadedBasePrice, Dates → Start/End, Supplier → existing lookup, POS → existing fPOSRequired). Not yet built: the POS sub-branch depth from brief Section 8 (PLU/SKU, modifiers, tax treatment) and the menu-update sub-branch detail — both read as "if POS/menu update = Yes, collect more" in the brief, bigger than this first slice.
- **Events & Entertainment conditional template done 2026-10-14**: Entry, Doors Open, Minimum Attendance, Reserved Seating, Food, Beverages, Operations Notes — shown only for that Activity Group, reusing the form's existing Ticketed/Capacity/Seating/Recurring fields rather than repeating them.
- **Promotions & Offers conditional template done 2026-10-14**: Promotional Price, Eligible Customer Segment, Offer Conditions, Terms & Conditions, Staff Instructions, Combinable With Other Offers — one canonical offer definition, reusing the existing Regular/Member Price, Long Description, Start/End, Supplier and POS fields rather than re-asking them. Also added Supplier-funded / Proof of advertising-reporting checkboxes, shown for any activity with a supplier involved, not just Promotions.
- **Loaded Rewards Campaign template depth done 2026-10-14**: the App fields (heading/short/long description, booking link) and the per-tier Offer Mechanics/Offer Variants structure (Gold/Platinum/Re-Engagement/etc.) already existed and are untouched. What was missing: `loadOfferVariants()` was already reading `RedemptionPeriod`, `Stackable`, `PushNotificationCopy` and `EmailCopy` off Offer Variants, but nothing in the Hub ever wrote them — those columns already exist in SharePoint and were silently dropped on every save. Added one shared "Communications & Redemption" section (Redemption Period, Stackable checkbox, Push Notification Copy, Email/EDM Copy) to both the Submit form and the post-creation offer editor, applied identically to every tier's Offer Variant row. Not yet built: per-variant `MinimumSpend`/`MaximumDiscount`/`ValidVenues`/`ValidDays`/`RedemptionLimit`/redemption targets — also already read, also never written, flagged in `TECH_DEBT.md` as the next slice; and a dedicated per-variant `SupplierFunding` write (the activity-level Supplier-funded checkbox added with Promotions & Offers covers the same fact today, so this wasn't duplicated).
- **Digital Advertising, Website, Email, SMS specialist briefs — first slice done 2026-10-14**: the Submit form's Promote/Artwork matrix already captured *that* a channel is wanted, but only Newsletter and TVs had anywhere to say what's actually needed — Website, Meta, Google Ads and SMS had none. Added a "Specialist Briefs" section (Website Brief, Meta/Social Brief, Google Ads Brief, SMS Copy) that reveals per channel once it's ticked to promote or to need artwork for (SMS is promote-only — there's no artwork step for a text message). Also added SMS as a new row in the matrix itself, since it wasn't a channel option at all before. These stay free-text, matching the Meta/Google notes pattern already proven in the manual Job ticket form, rather than inventing a heavier structured-brief object. Not yet built: Email as its own specialist brief beyond the existing Newsletter artwork-detail field (Email and Newsletter are being treated as the same channel for now — revisit if Kimberley means something distinct, e.g. transactional/EDM vs. the Newsletter), and linking these briefs through to an actual Design/Web job ticket automatically (today they're just visible context on the Activity, the same read-only-for-now state as every other conditional template this session).
- ~~Approval → task-creation connection~~ — **done 2026-10-14**: the first approval now shows a preview of proposed jobs (editable owner/due date, untickable), creates only what's confirmed, and only advances the stage once that succeeds. See `TECH_DEBT.md`.
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
