# P03 · Reviews & Marketing Intelligence

**Scope:** guest reviews, the marketing dashboard, campaign reporting and performance metrics.
**Register items owned here:** REV-01, MKT-01 (P03·00), REV-02 (P03·01), MKT-02 (P03·02), Finance (P03·03). See `docs/OS_RESET_MASTER.md` §2, §4 and §7.
**Opened:** 10 Nov 2026, from `main` @ `0a68252`.

Nothing here is marked done. Code evidence isn't runtime evidence, and REV-01 and MKT-01 both still need Kim's decisions (§5).

---

## 1. Rules this workstream works under

From the register, not new:

- **No new nav items.** Reviews stays hidden until REV-02 ships. Reporting surfaces fold into **Insights** under UX-01 (§7, P01·03 → P03).
- **No financials to new roles before SAFE-04.** Budget, spend, supplier and revenue fields are only gated in the UI (`canViewBudget`). Raw Graph responses still carry them (§7, P01·04 → P03·02/03).
- **No invented metrics.** Every number shown needs a source field, a single definition and a freshness label (MKT-02, CAL-03).
- REV-01 and MKT-01 are research and decisions. They can run now, in parallel with the SAFE items.

---

## 2. What exists today (code-evidenced, runtime unverified)

### 2.1 Guest reviews

**Nothing is built.** No list, no panel, no import and no fields. The only review-adjacent things in the code are:

- The **Google Business Profile** channel tick-box on Submit (`fChanGBP`) and the `GBPUpdateRequired` field.
- The playbook task "Google Business Profile update" (`index.html`, playbook templates).

Every other "review" in the code is the internal **Intake → Review** approval stage or the CRM import review queue. Neither is guest reviews. Under the proposed nav (register §3), internal approvals stay under Submit.

### 2.2 Campaign reporting (post-campaign)

| Piece | Where | Notes |
|---|---|---|
| Post-Campaign Report form | `#postCampaignOv`, `openPostCampaign()` / `savePostCampaign()` | Writes `ActualSpend`, `SupplierContribution` (budget roles only), `TicketsSold`, `TicketRevenue`, `Redemptions`, `Covers`, and appends "What worked / To improve" to `Description`. Sets `WorkflowStage = Done` first, then the other fields one by one, and reports any skipped. |
| Live ROI preview | `calcROI()` | Budget roles only. `(ticket revenue − (spend − supplier)) ÷ (spend − supplier)`. Shown in the form, **not stored**. |
| "Wrap report needed" alerts | notification builder | Fires for every assigned activity at `Done` that isn't archived or cancelled, **including ones already reported** (no "report submitted" flag exists). |

### 2.3 Dashboard and Finance numbers

| Surface | Panel | What it shows | Source |
|---|---|---|---|
| "Reporting Required" card (widget id `reportrequired`, titled "Reporting & Performance" in the widget library) | `overview` → `#ovResults` | Completed count; budget roles also see Actual Spend, Ticket Revenue, Supplier Funds | Activities |
| Reporting Overview charts | `overview` | Activity by month, type mix, Budget vs Spend | Activities |
| Budget roll-up | `budget` → `#bRollup` | Allocated budget grouped by funnel, silo, type, venue, brand, project or period | `BudgetAllocated` |
| Campaign Performance roll-up | `budget` → `#perfStats`, `#bPerfRollup` | Tickets, revenue, redemptions, covers per group | Post-campaign fields |
| Loaded Rewards Campaigns card | `overview` | Loaded activity list | Activities |

None of these numbers carries a freshness label yet.

### 2.4 Definition drift found this pass

The same label means different things in different places. MKT-01 has to settle each one.

| Metric | Dashboard card | Finance panel |
|---|---|---|
| **Completed** | `stage Done` and **not** auto-completed, or status Complete / Archive / Archived | `stage Done` (auto-completed included), or status Complete / Archive / Archived |
| **Ticket Revenue** | Saved `TicketRevenue`, falling back to tickets × ticket price (since this pass, see §4) | Saved `TicketRevenue` only |
| **Reporting required** | Card title says "required", but it shows a results snapshot, not a to-do | n/a |

The card label also differs between the dashboard ("Reporting Required") and the widget library ("Reporting & Performance").

---

## 3. REV-01 · Review source map (draft for Kim)

**Goal:** know where guest reviews live for each venue, who can read them, and how they could reach the OS, before anything is built.

### 3.1 Sources to confirm, per venue

Venues in code: The Left Bank, The Ravenswood, Whitfords Brewing Co, Hotel Darwin, Mustang Bar (`VENUES_DATA`).

| Source | Likely access route | Confirm |
|---|---|---|
| Google Business Profile | Google Business Profile API (reviews read and reply). Needs the venue's GBP owner or manager account and an approved API project. | Who owns each venue's profile? Is there one Google account across the group? |
| TripAdvisor | Content API is limited for owners. The management centre has an export. | Which venues are listed? Is anyone replying today? |
| Facebook / Instagram | Meta Graph API, page recommendations. Needs a page token. | Are recommendations on for each page? |
| Booking platforms (SevenRooms, OpenTable, Resy or similar) | Platform exports or APIs | Which platform does each venue use? Do they collect post-visit feedback? |
| Accommodation (Hotel Darwin, if it has rooms) | Booking.com, Expedia extranets | Are there rooms? Who logs in? |
| Direct (email, comment cards, venue surveys) | Manual | Does anyone log these today? |
| Third-party aggregator already paid for | Vendor API | Does the group already pay for review monitoring? If yes, read from it and don't build ingestion. |

### 3.2 Questions REV-01 must answer before REV-02 starts

1. Which sources matter for each venue (rank the top two)?
2. Who replies to reviews today, and does that change?
3. Is the first version **read-only** (rating trend and new-review count) or does it include **reply workflow**?
4. Where does review data live: a new SharePoint list, or read live from the source? A list means one more SAFE-04 permission audit.
5. Do reviews link to Activities ("reviews mentioning the trivia night")? That needs a decision on matching. Recommend: not in v1.

**Recommendation for REV-02 v1:** read-only, Google Business Profile only, one SharePoint list (`Guest Reviews`: venue, source, rating, date, text, URL, replied y/n), filled by a scheduled Power Automate flow and not from the browser. That keeps API credentials off the client (see SAFE-05 for why).

---

## 4. Fixes made this pass

Small and limited to campaign reporting accuracy. No field mapping or nav changes.

1. **Post-Campaign Report carried values across activities.** `openPostCampaign()` cleared only four of the eight inputs. Ticket Revenue, Covers and both notes stayed filled from the last report opened. Saving would write them onto the new activity, with the notes appended into its `Description`. It now resets every input and the message, pre-fills all saved actuals (Ticket Revenue, Redemptions and Covers were never pre-filled), and binds the ROI listeners once instead of on every open.
2. **Dashboard Ticket Revenue ignored the saved figure.** The card summed tickets × ticket price, so a recorded `TicketRevenue` (for example, with comps or tiered pricing) never showed. It now uses the saved figure and keeps the calculation only as a fallback.

**Re-test (SAFE-03 style):** open a report for activity A, type covers and notes, cancel, then open activity B. B's form is empty. Save a report on B, reload, and confirm SharePoint matches. Then compare the dashboard Ticket Revenue with Finance's for the same completed set.

---

## 5. MKT-01 · Minimal KPI list (proposal for Kim)

Rule: only metrics with a field that already exists, one definition each, and a freshness label. Anything needing new data is marked **later**.

| # | KPI | Definition | Source field(s) | Who sees it | Status |
|---|---|---|---|---|---|
| K1 | Activities delivered | Activities with `WorkflowStage = Done` (manual, not auto-completed) in the period | `WorkflowStage`, end date | Everyone | Ready. Pick one "completed" rule (§2.4) |
| K2 | Report completion rate | Delivered activities with a saved Post-Campaign Report ÷ delivered activities | Needs a "report submitted" signal | Everyone | **Gap.** Needs a `ReportSubmittedAt` date, or a rule such as "any actual is saved" |
| K3 | On-time launch rate | Activities live on or before the planned start | `WorkflowStage` history | Everyone | **Later.** No stage history is stored |
| K4 | Actual spend vs budget | Σ `ActualSpend` ÷ Σ `BudgetAllocated`, delivered activities | `ActualSpend`, `BudgetAllocated` | Budget roles | Ready. Blocked for new roles by SAFE-04 |
| K5 | Net cost to Marlin | Σ (`ActualSpend` − `SupplierContribution`) | as named | Budget roles | Ready. Same SAFE-04 block |
| K6 | Ticket revenue | Σ `TicketRevenue`, falling back to tickets × price | `TicketRevenue`, `TicketsSold`, `TicketPrice` | Budget roles | Ready (definition aligned on the dashboard this pass; align Finance too) |
| K7 | Ticket sell-through | `TicketsSold` ÷ `Capacity`, ticketed activities | `TicketsSold`, `Capacity`, `TicketedEvent` | Everyone | Ready. Not shown anywhere yet |
| K8 | Loaded redemptions | Σ `Redemptions`, Loaded activities | `Redemptions`, `LoadedRewards` | Everyone | Ready |
| K9 | Covers | Σ `Covers` | `Covers` | Everyone | Ready, but the form labels it "Estimated". Show it as an estimate |
| K10 | Average Google rating, new reviews | Per venue, per month | REV-02 list | Everyone | **Later.** Depends on REV-01/02 |
| K11 | Channel performance (Meta, Google Ads, EDM) | Reach, clicks, cost per result | Ad platforms | Budget roles | **Later.** No integration. Out of scope until K1 to K9 are trusted |

**Deliberately excluded:** ROI as a stored KPI. The form's ROI only counts ticket revenue against spend, so it reads badly for awareness, Loaded and food activities that sell no tickets. Keep it as an in-form hint, not an Insights headline.

---

## 6. Decisions needed from Kim

| ID | Decision | Recommendation |
|---|---|---|
| P3-D1 | Approve the MKT-01 list (§5), K1 to K9 now and K10 to K11 later | Yes |
| P3-D2 | "Completed": exclude auto-completed activities everywhere, or include them everywhere? | Exclude. Auto-completion means nobody reported on it |
| P3-D3 | Add a `ReportSubmittedAt` date column to Activities so K2 and the "Wrap report needed" alert can tell reported from unreported | Yes. One Date column, set by `savePostCampaign()`. Needs a SAFE-04 controlled-record test |
| P3-D4 | REV-02 v1 scope: read-only Google Business Profile via Power Automate into a SharePoint list | Yes, pending REV-01 answers (§3.2) |
| P3-D5 | Does the group already pay for a review-monitoring tool? | Kim to confirm. If yes, it changes REV-02 |

---

## 7. Next items in this workstream

1. Kim answers P3-D1 to P3-D5.
2. Re-test the §4 fixes in the live app and record the evidence in the register.
3. MKT-02 (after SAFE-04): one shared metric helper so dashboard and Finance read the same definitions, plus freshness labels. No new panels: it lands in Insights under UX-01.
4. REV-02 (after REV-01 and SAFE-04): the Guest Reviews list and flow. The Reviews nav stays hidden until it ships.

## 8. Change log

- 2026-11-10: Created. Code inventory of reporting surfaces at `0a68252`. REV-01 source map and MKT-01 KPI list drafted for decision. Post-Campaign Report carry-over and dashboard Ticket Revenue fixed (§4).
