# GDR automation: email request → activity → Job Folder → artwork filed

Written 27 Nov 2026. This automates Graphic Design Requests (GDRs) end to end using **Power Automate standard connectors only** (Outlook, SharePoint) and the Marlin OS. It needs no premium licence and no Claude usage.

## The flow at a glance

1. **Someone emails a GDR.** Flow A creates an activity in Submissions and replies "Logged as A-1234".
2. **Kim approves it in the OS.** Job tickets are created, and the existing Job Folder flow creates the activity's folder (`JobFolderURL`).
3. **Kim or the team selects ✉ Request artwork** on the activity, or on its design ticket in Queues. This opens an email to the designer with the brief, and the subject is `[A-1234] GDR – <title> – <venue>`.
4. **The designer replies with the artwork attached, keeping `[A-1234]` in the subject.** Flow B saves the attachments into the activity's Job Folder, sets **Linked Artwork Folder** and posts a note on the activity.
5. **The OS updates itself.** The activity and its design tickets show **Artwork received**, and the **Final artwork** Go Live check passes.

## What's already in the OS

| Feature | Where |
|---|---|
| **Activity reference** "A-" + SharePoint item ID (e.g. A-1234) | Activity page header, Submissions cards, Pipeline cards, Queues rows. Typing `A-1234` in the top search box opens that activity. |
| **✉ Request artwork** | Activity page → Design section, and Queues → Design tab rows. It emails the open design ticket's owner (default: the design lead, Luca). The email includes the brief, the due date, a link back to the activity, and asks them to reply with the artwork and keep the subject. |
| **Artwork received** | Shown on the activity's Design section and on its design and print tickets once **Artwork File** or **Linked Artwork Folder** is set. The Go Live "Final artwork" check passes at the same time. |

## Set up the mailbox first (recommended)

Flows triggered on a personal inbox stop when that person changes their password, leaves, or files the email somewhere else first. **Recommended: a shared mailbox, e.g. `design@marlingroup.com.au`**, with Kim and the flow owner given Full Access. GDRs and artwork replies go there. Shared mailboxes are free and don't need a licence. **IT has to create it** (Exchange admin).

If a shared mailbox isn't possible yet:
- **Use an Outlook folder in Kim's inbox:** make an Outlook rule "Subject includes **GDR** → move to folder **GDR**", and point both flows at that folder.
- **Keep artwork replies on track:** a second rule, "Subject includes **[A-** → move to folder **GDR**", stops the main inbox rules filing them elsewhere.

In the steps below, "the mailbox" means whichever you choose. For a shared mailbox, use the **"When a new email arrives in a shared mailbox (V2)"** trigger instead of **"When a new email arrives (V3)"**. Its settings are the same.

## Names to use

| What | Value |
|---|---|
| SharePoint site | `https://marlingroupaus.sharepoint.com/sites/MarlinHospitalityMarketing` |
| Activities list | `Marketing & Activations 2026` |
| Comments list | `Activity Comments` |
| Documents library | `Documents` (path `/Shared Documents`) |
| Job Folders live in | `/Shared Documents/00. Marketing OS Files/00. Marketing Activities/` |
| Fallback folder (create once) | `/Shared Documents/00. Marketing OS Files/GDR Inbox/` |

**Activities list columns (internal names)**, from `FIELD_MAPPING` and the OS code:

| Column | Internal name | Notes |
|---|---|---|
| Title | `Title` | Required |
| Venue | `Venue` | Choice: The Left Bank, The Ravenswood, Whitfords Brewing Co, Hotel Darwin, Mustang Bar, Beerland Brewing, All Venues |
| Activity Type | `ActivityType` | Choice: Event, Promotion / Offer, Campaign, Maintenance / Update |
| Start / End | `Start`, `End` | Date. Required in the OS. |
| Workflow Stage | `WorkflowStage` | `Intake` shows as **Submissions** in the OS |
| Status | `Status` | `Active` |
| Description | `Description` | Multi-line text |
| Activity Group / Subtype | `ActivityGroup`, `ActivitySubtype` | Group is a Choice; Subtype is text |
| Job Folder | `JobFolderURL` | Written by the existing Job Folder flow |
| Linked Artwork Folder | `LinkedArtworkFolderURL` | Flow B sets this |
| Artwork file | `Artwork_x0020_File` | Display name "Artwork File" |

**Activity Comments columns:** `Title`, `Comment`, `CampaignId` (the activity's ID as text), `Recipient` (a name). This is what shows in the activity's Discussion and the Inbox.

## Flow A: "GDR email → Activity"

1. **Create the flow.** In Power Automate: **Create → Automated cloud flow**. Name it `GDR email → Activity`, choose the trigger **When a new email arrives (V3)** (Office 365 Outlook), and select **Create**.
2. **Trigger settings.** Open **Show all** and set:
   - **Folder:** the mailbox or GDR folder
   - **Subject Filter:** `GDR`
   - **Include Attachments:** No
   - **Only with Attachments:** No
3. **Skip replies that are already logged.** Add **Condition**. Left side: expression `contains(triggerOutputs()?['body/subject'],'[A-')`, set to **is equal to** `true`.
   - **If yes:** add **Terminate**, status **Succeeded**. It's an artwork reply or an already-logged GDR, which Flow B handles.
   - **If no:** add the remaining steps in this branch.
4. **Work out the venue.** Add **Compose** and rename it `Venue`. The expression checks the subject and body for a venue name or code, in order:

   ```
   if(or(contains(toLower(concat(triggerOutputs()?['body/subject'],' ',triggerOutputs()?['body/bodyPreview'])),'left bank'),contains(concat(' ',triggerOutputs()?['body/subject'],' '),' TLB '),contains(concat(' ',triggerOutputs()?['body/subject'],' '),' LB ')),'The Left Bank',
   if(or(contains(toLower(concat(triggerOutputs()?['body/subject'],' ',triggerOutputs()?['body/bodyPreview'])),'ravenswood'),contains(concat(' ',triggerOutputs()?['body/subject'],' '),' RAV ')),'The Ravenswood',
   if(or(contains(toLower(concat(triggerOutputs()?['body/subject'],' ',triggerOutputs()?['body/bodyPreview'])),'whitford'),contains(concat(' ',triggerOutputs()?['body/subject'],' '),' WBC ')),'Whitfords Brewing Co',
   if(or(contains(toLower(concat(triggerOutputs()?['body/subject'],' ',triggerOutputs()?['body/bodyPreview'])),'hotel darwin'),contains(concat(' ',triggerOutputs()?['body/subject'],' '),' HD ')),'Hotel Darwin',
   if(or(contains(toLower(concat(triggerOutputs()?['body/subject'],' ',triggerOutputs()?['body/bodyPreview'])),'mustang'),contains(concat(' ',triggerOutputs()?['body/subject'],' '),' MB ')),'Mustang Bar',
   if(or(contains(toLower(concat(triggerOutputs()?['body/subject'],' ',triggerOutputs()?['body/bodyPreview'])),'beerland'),contains(concat(' ',triggerOutputs()?['body/subject'],' '),' BB '),contains(concat(' ',triggerOutputs()?['body/subject'],' '),' BL ')),'Beerland Brewing',
   'All Venues'))))))
   ```

   Codes used in Marlin files: TLB/LB = The Left Bank, RAV = The Ravenswood, WBC = Whitfords Brewing Co, HD = Hotel Darwin, MB = Mustang Bar, BB/BL = Beerland Brewing. Codes only match as whole words in the subject, so "HD" inside another word won't match. If nothing matches, the venue is **All Venues** and Kim corrects it in triage.
5. **Clean the title.** Add **Compose** and rename it `Title`:

   ```
   trim(replace(replace(replace(triggerOutputs()?['body/subject'],'FW: ',''),'RE: ',''),'GDR',''))
   ```

6. **Create the activity.** Add **Create item** (SharePoint).
   - **Site Address:** the site above
   - **List Name:** `Marketing & Activations 2026`
   - **Title:** output of `Title`, prefixed `GDR – `
   - **Venue Value:** output of `Venue`
   - **ActivityType Value:** `Campaign`
   - **Start:** `addDays(utcNow(),14,'yyyy-MM-dd')`. The real date is set in triage; a GDR email rarely gives one reliably.
   - **End:** same as Start
   - **WorkflowStage Value:** `Intake`
   - **Status Value:** `Active`
   - **ActivityGroup Value:** `Venue, Brand & Collateral`. The OS's Submit form requires a Group, so give it one Kim can change.
   - **ActivitySubtype:** `Brand Assets`
   - **Description:**

     ```
     GDR emailed by <From> on <Received Time>.
     Dates and venue are placeholders, so check them in triage.

     <Body>

     Submitted by: <From>
     Source email: <Web link>
     ```

     Use the trigger's **From**, **Received Time**, **Body** and **Web link** (or **Message Id**) dynamic values. The OS shows the last "Submitted by:" line as the requester, so Submissions shows the person who emailed rather than the flow owner. For HTML bodies, wrap Body in `html_to_text`. That's a standard Content Conversion action, or use **Body Preview**.
7. **Reply to the sender.** Add **Reply to email (V3)**.
   - **Message Id:** the trigger's Message Id
   - **Body:** `Thanks — this design request is logged as A-@{outputs('Create_item')?['body/ID']}. Please keep [A-@{outputs('Create_item')?['body/ID']}] in the subject of any email about it, including the artwork reply.`
   - **Reply All:** No
8. **(Optional) Tag the subject for threading.** Use **Send an email (V2)** to Kim with the subject `[A-<ID>] GDR – <Title>`. Replying to that keeps the reference.
9. **Save.** Test it by emailing the mailbox `GDR – Oyster Sundays WBC`. A new activity should appear in the OS Submissions, and you should get the "logged as A-…" reply.

**What Kim does next in the OS:** open Submissions, correct the dates, venue and group, then **Approve**. Job tickets are proposed, and the existing flow creates the Job Folder. Then **✉ Request artwork** to email the designer.

## Flow B: "Artwork reply → Job Folder"

1. **Create the flow.** **Automated cloud flow** → **When a new email arrives (V3)**. Name it `Artwork reply → Job Folder`.
2. **Trigger settings.**
   - **Folder:** the mailbox or GDR folder
   - **Subject Filter:** `[A-`
   - **Only with Attachments:** Yes
   - **Include Attachments:** Yes
3. **Get the reference.** Add **Compose** and rename it `ActivityID`:

   ```
   first(split(last(split(triggerOutputs()?['body/subject'],'[A-')),']'))
   ```

   It returns e.g. `1234`. Add a **Condition**: `isInt(outputs('ActivityID'))` is equal to `true`. Put everything below under **If yes**; under **If no**, use **Terminate**.
4. **Get the activity.** Add **Get item** (SharePoint).
   - **Site:** as above
   - **List:** `Marketing & Activations 2026`
   - **Id:** `outputs('ActivityID')`
5. **Work out the folder.** Add **Compose** and rename it `FolderUrl`:

   ```
   if(empty(body('Get_item')?['JobFolderURL']),'',if(contains(string(body('Get_item')?['JobFolderURL']),'"Url"'),body('Get_item')?['JobFolderURL']?['Url'],body('Get_item')?['JobFolderURL']))
   ```

   This handles `JobFolderURL` whether it's a text column or a Hyperlink column. Then add **Compose** and rename it `FolderPath`, which turns the link into a library path:

   ```
   decodeUriComponent(last(split(first(split(outputs('FolderUrl'),'?')),'/sites/MarlinHospitalityMarketing')))
   ```

   It returns e.g. `/Shared Documents/00. Marketing OS Files/00. Marketing Activities/WBC_DEC26_OYSTER_SUNDAYS`.
6. **Decide where to save.** Add a **Condition**: `outputs('FolderUrl')` **is not equal to** an empty string, **and** `outputs('FolderPath')` **starts with** `/Shared Documents`.
   - **If yes:** add **Compose** and rename it `SaveTo` = `outputs('FolderPath')`.
   - **If no:** the Job Folder is missing, or the link is a sharing link the path can't be worked out from. This is the known failure mode in `docs/CALENDAR_DASHBOARD_AUDIT.md` §2.3. Add **Compose** and rename it `SaveTo` = `concat('/Shared Documents/00. Marketing OS Files/GDR Inbox/A-',outputs('ActivityID'))`.

   (Simpler alternative: initialise a string variable `SaveTo` before the condition and **Set variable** in each branch.)
7. **Save each attachment.** Add **Apply to each** over the trigger's **Attachments**. Inside it:
   - **Condition:** `items('Apply_to_each')?['isInline']` is equal to `false` **and** `items('Apply_to_each')?['size']` is greater than `20000`. This skips email signature logos and inline images.
   - **If yes:** add **Create file** (SharePoint).
     - **Site:** as above
     - **Folder Path:** `SaveTo`. Create file creates missing folders in the path, which covers the GDR Inbox fallback.
     - **File Name:** `items('Apply_to_each')?['name']`
     - **File Content:** `base64ToBinary(items('Apply_to_each')?['contentBytes'])`

   If the same file name might come back twice (revisions), use File Name `concat(formatDateTime(utcNow(),'yyyyMMdd-HHmm'),'_',items('Apply_to_each')?['name'])` so nothing is overwritten.
8. **Mark the activity as having artwork.**
   - **If Linked Artwork Folder is empty and the Job Folder was found:** add **Update item** (SharePoint) with Id = `outputs('ActivityID')`, and set **LinkedArtworkFolderURL** = `outputs('FolderUrl')`. The OS then shows **Artwork received**, and the Go Live artwork check passes.
     - If `LinkedArtworkFolderURL` is a **Hyperlink** column, Update item won't offer it. Use **Send an HTTP request to SharePoint** (standard) instead:
     - **Method:** `POST`
     - **Uri:** `_api/web/lists/getbytitle('Marketing & Activations 2026')/items(@{outputs('ActivityID')})/ValidateUpdateListItem`
     - **Body:** `{"formValues":[{"FieldName":"LinkedArtworkFolderURL","FieldValue":"@{outputs('FolderUrl')}, Artwork"}]}`
   - **In the fallback case:** leave it unset. Kim checks the GDR Inbox folder and links it from the activity page, under Linked Artwork Folder → Link.
9. **Post a note on the activity.** Add **Create item** (SharePoint).
   - **List:** `Activity Comments`
   - **Title:** `body('Get_item')?['Title']`, first 50 characters
   - **Comment:** `Artwork received from @{triggerOutputs()?['body/from']} (@{length(triggerOutputs()?['body/attachments'])} attachment(s)), saved to @{outputs('SaveTo')}.`
     - In the fallback case, use instead: `Artwork received, but the Job Folder was missing, so it was saved to GDR Inbox/A-@{outputs('ActivityID')}. Please link the folder.`
   - **CampaignId:** `outputs('ActivityID')`
   - **Recipient:** `Kim` (tags her in the OS Inbox)
10. **(Optional) Confirm to the designer.** Use **Reply to email (V3)** with "Thanks, artwork filed against A-1234."
11. **Save.** Test it by replying to a **✉ Request artwork** email with a PDF attached. The PDF should appear in the activity's Job Folder, and the activity should show **Artwork received**.

## What can go wrong

| Situation | What happens | Fix |
|---|---|---|
| The designer deletes `[A-1234]` from the subject | Flow B doesn't fire | Forward the email to the mailbox with `[A-1234]` added, or upload the files by hand |
| No Job Folder yet (not approved, or the folder flow failed) | Files go to `GDR Inbox/A-1234` and a note is posted | Approve the activity, or use **Create folder / Link** on the activity page, then move the files |
| `JobFolderURL` holds a sharing link (`/:f:/s/…`) | The path can't be worked out, so the fallback is used | Re-link the folder from the activity page. The OS stores the folder's direct link. |
| Signature images saved | They shouldn't be (inline and under 20KB are skipped) | Raise the size threshold |
| The same reply arrives twice | Timestamped file names avoid overwriting | — |

## IT and permissions

- **Shared mailbox** (recommended): IT creates `design@` (or similar) and gives Kim and the flow owner **Full Access**. No licence is needed.
- **Flow owner account:** needs **Edit** on the Marketing site (the Activities list, Activity Comments and the Documents library). A Microsoft 365 business licence with standard Power Automate is enough. No premium connectors are used.
- **Ownership:** have the flows owned by, or **co-owned with**, a second person or a service account, so they don't stop if one person's account changes.
- **The existing Job Folder flow** is unchanged. Flow B only reads `JobFolderURL`.
- **No app registrations, API keys or Azure resources** are needed.

## Check it works

1. Email `GDR – Test poster WBC` to the mailbox. You get a reply "logged as A-…", and the activity appears in Submissions with venue Whitfords Brewing Co.
2. Approve it in the OS. Job tickets are proposed, and the Job Folder appears within a few minutes.
3. On the activity, select **✉ Request artwork**. An email opens to Luca with `[A-…] GDR – …` in the subject.
4. Reply to it with a PDF attached. The PDF appears in the Job Folder, a note appears in the activity's Discussion, and the activity shows **Artwork received**.
5. Repeat with an activity that has no Job Folder. The file lands in `GDR Inbox/A-…`, and the note asks you to link the folder.
