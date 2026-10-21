# Meta Campaigns Integration — Plan

**Status:** Draft for review. Nothing is built yet.
**Drafted:** 20 October 2026 · **Updated:** 21 October 2026 with Kimberley's answers (see §0)

Goal: a **Paid Media** section in the Hub that shows active Meta (Facebook / Instagram) campaigns, their performance and reporting, by venue, and links them back to Hub Activities.

---

## 0. Decisions confirmed (21 Oct 2026)

| Question | Answer | Effect on the plan |
|---|---|---|
| Ad accounts | One per venue, all under one Business Manager | Venue comes from the ad account, so no naming convention is needed to know the venue. One System User covers everything. |
| Refresh | 2–3 times a day | Sync runs at about **7am, 12pm and 5pm AWST**. Cron is in UTC: `52 22,3,8 * * *`, which lands just before each hour. There's also a manual "Run now" button. |
| Venue managers | See their own venue only | The sync writes **one file per venue** plus an all-venues file. SharePoint permissions restrict each file, so a VM can't read other venues' numbers even outside the Hub. Hiding things in the UI alone wouldn't be enough. See §4. |
| Scope | Paid only for v1 | Organic Page and IG insights move to "Later". `pages_read_engagement` isn't requested. |
| Results | Clicks, leads, sales | Shown as **three separate columns** (link clicks, leads, purchases) with cost per each, rather than a single "result" figure. ROAS only appears where purchase values come through. |
| Pixels | Needs an audit first | Added as §9. Sales and leads numbers are only as good as the pixel setup. |

---

## 1. Correction to the earlier recommendation

The earlier suggestion was *GitHub Action → JSON file committed to the repo → Hub fetches it*.

**That doesn't work as-is, because `KimberleyMarlin/marlin-gantt` is a public repository.** Anything committed to it (campaign names, spend, results) is readable by anyone on github.com, and through the GitHub Pages URL without signing in. The Hub's own data is safe only because it lives in SharePoint behind Microsoft 365 sign-in.

**Revised approach:** keep the GitHub Action as the free scheduler, but have it write the snapshot **into SharePoint** instead of the repo. The Hub then reads it with the same Microsoft sign-in and Graph calls it already uses for every other list, so the data gets the same access control and role gating as everything else.

---

## 2. Architecture

```
 ┌───────────────┐   every N hours   ┌──────────────────────┐
 │ GitHub Action │ ────────────────▶ │ Meta Marketing API   │
 │ (cron, free)  │ ◀──────────────── │ (System User token,  │
 │               │   campaigns +     │  ads_read)           │
 │               │   insights JSON   └──────────────────────┘
 │               │
 │               │   Graph API (app-only, Sites.Selected)
 │               │ ────────────────▶ SharePoint: Integrations/meta-campaigns.json
 └───────────────┘                               │
                                                 │  existing MSAL sign-in + Graph
                                                 ▼
                                   ┌─────────────────────────────┐
                                   │ Hub (index.html)            │
                                   │ Paid Media panel, Dashboard │
                                   │ widget, Activity detail     │
                                   └─────────────────────────────┘
```

What's stored where:

| Secret / setting | Where it lives | Who can see it |
|---|---|---|
| Meta System User token | GitHub → repo Settings → Secrets | Nobody (write-only, masked in logs) |
| Meta ad account IDs | GitHub Secrets | Nobody |
| Entra app client ID / secret for writing to SharePoint | GitHub Secrets | Nobody |
| The campaign snapshot itself | SharePoint document library | Signed-in Marlin staff, financials role-gated in the Hub |

## 3. Cost

| Piece | Cost | Card required? |
|---|---|---|
| Meta App + Marketing API (reading your own ad accounts) | Free | No |
| GitHub Actions on a public repo | Free (standard runners are unmetered for public repos) | No |
| Entra ID app registration (part of your existing M365 tenant) | Free | No, and **no Azure subscription needed**. App registrations aren't Azure resources. |
| SharePoint storage | Already included in M365 | No |

**Total: $0, and no new vendors.** The one non-money requirement is that a **Microsoft 365 Global Admin** has to approve the app's SharePoint permission once (see §5, step B).

## 4. What the data looks like

### Meta's structure, mapped onto the Hub

| Meta | Hub concept | How we connect them |
|---|---|---|
| Ad account (`act_…`) | Venue (or group) | Lookup table in the Action config: `act_123 → The Left Bank` |
| Campaign | Activity | The Activity's existing **`MetaCampaignID`** field (already read by the Hub, `index.html` campaign mapper). Fallback is a naming convention, e.g. `LEFTBANK – Melbourne Cup – Sales` |
| Ad set / Ad | Not shown in v1 | Can be added later for creative-level reporting |

If all venues share **one** ad account, venue comes from the campaign naming convention instead, so the naming convention becomes important (see the open questions).

### Fields pulled per campaign

- **Identity:** id, name, venue, objective, effective status (Active / Paused / Ended / In review), start and end dates, daily or lifetime budget
- **Performance (per window):** spend, impressions, reach, frequency, clicks, CTR, CPC, CPM
- **Results:** the objective's primary action (purchases, leads, landing page views, link clicks, messages), cost per result, and purchase ROAS where the Meta Pixel or Conversions API is set up
- **Windows:** last 7 days, last 30 days, month to date, and lifetime
- **Daily series:** spend and results per day for the last 60 days, used for trend lines

### Snapshot file shape (draft)

```json
{
  "generatedAt": "2026-10-20T06:00:00+08:00",
  "currency": "AUD",
  "accounts": [{ "id": "act_123", "venue": "The Left Bank", "name": "Left Bank Ads" }],
  "campaigns": [{
    "id": "120200000000000",
    "accountId": "act_123",
    "venue": "The Left Bank",
    "name": "LEFTBANK – Melbourne Cup – Sales",
    "objective": "OUTCOME_SALES",
    "status": "ACTIVE",
    "start": "2026-10-01", "end": "2026-11-04",
    "budget": { "type": "lifetime", "amount": 1500 },
    "metrics": {
      "last7":    { "spend": 312.4, "impressions": 41200, "reach": 18900, "clicks": 820, "ctr": 1.99, "cpm": 7.58, "results": 46, "resultType": "purchase", "costPerResult": 6.79, "roas": 4.1 },
      "last30":   { "...": "same shape" },
      "mtd":      { "...": "same shape" },
      "lifetime": { "...": "same shape" }
    },
    "daily": [{ "date": "2026-10-19", "spend": 44.1, "results": 7 }]
  }]
}
```

Leads and sales are stored separately rather than as one `results` figure: `linkClicks`, `leads` (on-Facebook lead forms plus pixel `Lead` events), `purchases` and `purchaseValue`, each with its own cost-per figure.

**Per-venue files:** `Integrations/Meta/<venue-slug>.json` for each venue, plus `Integrations/Meta/_all.json` for head office. Each venue file is shared with that venue's managers, and `_all.json` with head office only. The Hub loads `_all.json` when the user can open it and falls back to their own venue's file.

Each file is overwritten on every run. Optionally, a dated copy is kept monthly (`meta-campaigns-2026-10.json`) so past months stay reportable after Meta's own windows roll over.

## 5. Setup steps (you click, I guide)

### A. Meta side (around 30–45 min)
1. **Business Settings → Accounts → Ad accounts:** confirm every venue's ad account is owned by, or shared with, Marlin's Business Manager. If an agency owns an account, they need to share it with you as a partner.
2. **developers.facebook.com → Create App →** type *Business*, link it to Marlin's Business Manager, then add the **Marketing API** product.
3. **Business Settings → Users → System users →** create one (e.g. `marlin-hub-reporting`), assign it the ad accounts with **View performance** access and the Pages you report on.
4. **Generate token** for that system user with `ads_read` (plus `business_management` so the sync can read pixel health, see §9). A system user token doesn't expire, so the dashboard won't stop working after 60 days.
5. Paste the token and the ad account IDs into **GitHub → Settings → Secrets and variables → Actions**. Don't put them anywhere else.

Standard Marketing API access is enough for reading your own accounts, so no Meta App Review is needed.

### B. Microsoft side (around 15 min, needs a Global Admin)
1. **Entra admin centre → App registrations → New**, e.g. `Marlin Hub – Meta Sync`. This is separate from the Hub's existing sign-in app, which stays untouched.
2. Add the **Microsoft Graph → Application → `Sites.Selected`** permission, then **Grant admin consent**. `Sites.Selected` gives the app access to nothing until it's explicitly granted one site.
3. Grant it **write** on the marketing SharePoint site only. This is a single Graph call; I'll provide the exact command.
4. Create a client secret and put the client ID, tenant ID and secret into GitHub Secrets.
5. Create a folder in the site's document library, e.g. `Integrations/`.

### C. Build (my side)
1. `.github/workflows/meta-sync.yml`: a cron schedule plus a manual "Run now" button.
2. `scripts/meta-sync.mjs`: plain Node with no dependencies. It pages through campaigns and insights, normalises them into the shape above, and uploads to SharePoint. It never prints data or tokens to the (public) Action logs.
3. Hub changes (see §6).

## 6. Hub UI (proposed)

### New sidebar item: **📈 Paid Media** (next to *Social*)
- **KPI strip:** Spend (selected window), Reach, Results, Cost per result, ROAS, Active campaigns
- **Filters:** Venue (venue-coloured chips, same as the Monthly Deals grid), Status (Active / Paused / Ended), Window (7d / 30d / MTD / Lifetime), Objective
- **Campaigns table:** sortable like the Activities table, with columns Campaign, Venue, Objective, Status, Budget, Spend, Results, Cost / result, CTR, Ends, 🔗 Linked Activity (opens Activity detail)
- **Spend by venue:** bar chart
- **Trend:** daily spend vs results for the last 30 or 60 days
- **Freshness stamp:** "Updated 2h ago from Meta". If the snapshot is over 24h old it shows a warning instead of quietly showing stale numbers.
- **Unlinked campaigns callout:** Meta campaigns with no matching Activity, with a one-click "Link to Activity" that sets `MetaCampaignID`

### Elsewhere
- **Dashboard widget library:** "Live Meta Campaigns", a compact card with active count, spend MTD and the top 5 by spend, plus a "Full view →" link, the same pattern as the Loaded Rewards Campaigns widget
- **Activity detail:** a "Meta performance" block when `MetaCampaignID` is set
- **Post-Campaign Report:** pre-fills *Actual Spend* from Meta's lifetime spend for linked campaigns (still editable)
- **Role gating:** spend, CPC, CPM, cost per result and ROAS use the existing financials gate (`report-financial` / `canSeeFinancials`). Non-financial roles still see reach, clicks, CTR and results.

## 7. Phasing

| Phase | What | Depends on |
|---|---|---|
| **1** | Paid Media panel + Dashboard widget built against a **sample snapshot** with the exact schema above | Nothing, so this can start now |
| **2** | Meta App + System User (§5A) | You, about 45 min |
| **3** | Entra app + SharePoint permission (§5B) | M365 Global Admin |
| **4** | GitHub Action sync script; swap sample data for the real SharePoint file | Phases 2 and 3 |
| **5** | Activity linking, Activity detail block, Post-Campaign pre-fill | Phase 4 |
| **1b** | Pixel audit (§9). Can run in parallel with phase 1 | You + me, about 1 hour |
| Later | Organic FB/IG insights, Google Ads (same pattern), creative-level breakdown | — |

## 8. Open questions

Answered on 21 Oct, see §0. Still open:

1. **M365 admin:** who is the Global Admin who can do the one-time consent in §5B?
2. **Activity linking:** happy to link Meta campaigns to Activities by setting `MetaCampaignID`? This would happen from the Unlinked callout, not by retyping IDs.
3. **Ticketing platform:** which one handles ticket sales (needed for the pixel audit)?

## 9. Meta Pixel audit

Why it matters: **link clicks** are counted by Meta regardless. **Leads and sales** only show up if the pixel (or Conversions API) fires on the page where the lead or sale *completes*. For hospitality that page is usually inside a booking or ticketing widget, not the venue website, which is where most setups quietly break.

### Sites to check

| Venue | Website | Bookings | Tickets |
|---|---|---|---|
| The Left Bank | leftbank.com.au | NowBookIt | ? |
| The Ravenswood | ravenswoodhotel.com.au | NowBookIt? | ? |
| Whitfords Brewing Co | whitfordsbrewingco.com.au | NowBookIt | ? |
| Hotel Darwin | thehoteldarwin.com.au | ? | ? |
| Mustang Bar | mustangbar.com.au | ? | ? |
| Beerland Brewing | (no URL in the Hub yet) | ? | ? |

### Checklist per venue

**In Events Manager** (business.facebook.com → Events Manager → Data sources):
1. How many pixels/datasets exist? Ideally there's **one per venue**, owned by the Business Manager, not by an agency or a personal account.
2. Is each pixel **assigned to the matching venue's ad account**? If not, Meta can't attribute that venue's sales.
3. **Last received** date. Anything older than a few days means the pixel is installed nowhere live.
4. **Events received:** expect `PageView`, then `ViewContent` / `InitiateCheckout`, then `Lead` and/or `Purchase`. A pixel that only shows `PageView` can't report sales.
5. `Purchase` events carry **value + currency (AUD)**. Without those, ROAS is blank.
6. **Event Match Quality** score on Purchase and Lead. Low scores mean sales are under-counted.
7. **Domain verification** (Business Settings → Brand safety → Domains) for every venue domain.
8. **Duplicates:** the same event firing twice, e.g. both a hard-coded pixel and a plugin. This shows as inflated counts.

**On the websites** (Chrome + the *Meta Pixel Helper* extension, or Events Manager → Test events):
1. Open the home page and check the right pixel ID fires `PageView`.
2. Start a booking in the NowBookIt widget and complete a test booking. Does a `Lead` or `Purchase` (or a custom event) fire, and from which pixel?
3. Repeat for a ticket purchase on the ticketing platform.
4. Check NowBookIt's venue settings for a **Meta / Facebook Pixel ID** field, and the ticketing platform's event or organiser settings for the same. These are where the completed-booking and completed-sale events normally come from.

### Automating it afterwards
Once the System User token exists (§5A), the sync can also read each pixel's last-fired time and event counts from the Marketing API. The Paid Media panel could then show a small **Pixel health** row per venue, e.g. "🟢 Purchase events received today" or "🔴 No Lead events in 7 days", so breakages are noticed without someone re-auditing by hand.
