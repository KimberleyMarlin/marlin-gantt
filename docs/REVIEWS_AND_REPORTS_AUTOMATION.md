# Reviews and weekly reports: getting them into the OS automatically

**Owner:** Kim · **Written:** 17 Nov 2026 · **Workstream:** P03 (see `docs/P03_REVIEWS_MARKETING_INTEL.md`)

The Marketing Report (Business → Marketing Report) reads from three SharePoint locations, all in the Marlin Hospitality Marketing site → Documents → `WORKING_Marketing Dashboard`:

| What | Where | How it gets there |
|---|---|---|
| Review history to 11 Aug 2026 | `Reviews Hub/Reviews - Master.xlsx` | Already there. No longer needs updating by hand. |
| Weekly review exports (the Fiverr file) | `Reviews Hub/Imports/` | **Upload reviews file** button in the OS, or Flow 1 below |
| Weekly venue reports (PDF, e.g. "WBC - Week 19 Report") | `Weekly Venue Reports/` | Flow 2 below |

The OS reads every `.xlsx` or `.csv` in `Imports`, merges it with the master and counts each review once, so overlapping exports are fine. Nothing needs copying or pasting into the master any more.

Weekly venue reports include sales and wages. The OS only shows them to roles with budget access, but SharePoint is what actually protects the files. Set the `Weekly Venue Reports` folder's permissions so only management can open it (Folder → ⋯ → Manage access).

---

## Option A, now: upload the weekly export

1. Open **Marketing Report** in the OS.
2. Under Guest reviews, click **Upload reviews file** and choose the weekly export (.xlsx or .csv).
3. The OS saves it to `Imports` with today's date in front of the name, then shows how many new reviews it added.

Needs edit rights in the OS and write access to the Reviews Hub folder.

---

## Flow 1: weekly reviews email → Imports folder (Power Automate)

Use this if the reviews export arrives by email. It uses standard connectors only (Outlook and SharePoint), so no premium licence is needed.

1. Go to make.powerautomate.com → **Create** → **Automated cloud flow**.
2. Name it `Reviews export to OS`. Trigger: **When a new email arrives (V3)** (Office 365 Outlook).
   - Folder: Inbox
   - From: the sender's email address
   - Include Attachments: **Yes**
   - Only with Attachments: **Yes**
   - Subject Filter: a word that's always in the subject, e.g. `reviews`
3. Add **Apply to each** over `Attachments`. Inside it, add a **Condition**: `Attachments Name` ends with `.xlsx` (add an Or for `.csv`).
4. In **If yes**, add **Create file** (SharePoint):
   - Site Address: Marlin Hospitality Marketing
   - Folder Path: `/Shared Documents/WORKING_Marketing Dashboard/Reviews Hub/Imports`
   - File Name: `@{formatDateTime(utcNow(),'yyyy-MM-dd')} @{items('Apply_to_each')?['name']}`
   - File Content: `Attachments Content`
5. Save, then send yourself a test email with the export attached. Open the Marketing Report, click **Refresh**, and the new reviews appear.

If the export is a shared link (e.g. a Fiverr download link) rather than an attachment, the flow can't fetch it. Ask the freelancer to attach the file instead.

---

## Flow 2: weekly venue report email → Weekly Venue Reports folder

Same pattern, for the weekly PDF packs.

1. **Automated cloud flow**, named `Weekly venue reports to OS`. Trigger: **When a new email arrives (V3)**.
   - From: whoever sends the reports
   - Include Attachments: **Yes**, Only with Attachments: **Yes**
   - Subject Filter: `Report` (or whatever is always in the subject)
2. **Apply to each** over `Attachments` → **Condition**: name ends with `.pdf`.
3. **If yes** → **Create file** (SharePoint):
   - Folder Path: `/Shared Documents/WORKING_Marketing Dashboard/Weekly Venue Reports`
   - File Name: `Attachments Name` (keep the original, e.g. `WBC - Week 19 Report.pdf`)
   - File Content: `Attachments Content`
4. Save and test with last week's email (forward it to yourself).

The OS reads the venue from the start of the file name (`WBC`, `TLB`, `RAV`, `HD`, `MB`, `NBC`) and the week from "Week 19". If another code turns up, add it to `REPORT_VENUE_CODES` in `index.html`.

The OS lists and links these PDFs. It doesn't read the numbers inside them: PDFs are built for people, not systems. To get sales, labour or functions figures into the OS as numbers, ask whoever builds the pack to also send the data behind it (a CSV or the source exports). Then the same folder pattern works.

---

## Option B, later: Google reviews straight from Google

This replaces the Fiverr export for Google reviews, which are 99% of the reviews in the master. Tripadvisor would still need the export.

**Step 1: profile access (Kim, about 30 minutes).** For each venue, sign in at business.google.com and check who owns each Business Profile. Ideally, add one group Google account (e.g. marketing@…) as **Owner** of all six profiles: Left Bank, Ravenswood, Whitfords, Hotel Darwin, Mustang Bar, Northbridge Brewing Co.

**Step 2: API access request (IT or Kim, then a wait of about 2–4 weeks).**
1. Sign in to console.cloud.google.com with that group account and create a project called `Marlin Reviews`.
2. Search for "Business Profile API" access and submit Google's access request form, giving the project number. Google approves these by hand.
3. Once approved, enable **My Business Account Management API** and **My Business Business Information API** in the project. Reviews are read through the `accounts/{account}/locations/{location}/reviews` endpoint.
4. Create an **OAuth client** (type: Web application) and keep its client ID and secret somewhere safe. Never put them in the OS code.

**Step 3: daily flow (needs a Power Automate premium licence for one account).**
- Scheduled flow, daily at 6am. For each venue location, an **HTTP** action calls the reviews endpoint with the Google OAuth connection.
- Each review is written as a row to a `Google Reviews.csv` file, or as items in a `Guest Reviews` SharePoint list.
- The simplest option is to write the CSV into the same `Reviews Hub/Imports` folder. The OS already reads it, with no code change.

**Step 4 (optional): replies from the OS.** The same API can post replies. That needs a reply workflow in the OS and a decision on who is allowed to reply for each venue.

Until B is running, A plus Flow 1 keeps the report current.
