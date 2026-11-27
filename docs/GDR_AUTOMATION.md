# GDR automation: Jotform request → activity → Job Folder → Luca's artwork filed

Written 27 Nov 2026, and updated the same day for how GDRs actually arrive. It uses **Jotform's own SharePoint integration** for intake, and **one Power Automate flow using standard connectors only** for filing artwork. It needs no premium Power Automate licence and no Claude usage.

How GDRs work today:
- Venue managers and staff fill in a **Jotform** Graphic Design Request.
- Kim is copied on the notification emails.
- **Luca** (design) is the only person who sends artwork back.

## The flow at a glance

1. **A venue manager submits the GDR Jotform.** Jotform adds a row to the Activities list straight away (stage Submissions) with the **Jotform Submission ID**. It can also save the uploaded files and the submission PDF to `GDR Inbox/<submission ID>`.
2. **Jotform's notification email** goes to Luca and Kim, with the subject `GDR #<submission ID> – <venue> – <title>`.
3. **Kim approves the activity in the OS.** Job tickets are created, and the existing Job Folder flow creates the activity's folder (`JobFolderURL`).
4. **Luca replies with the artwork attached.** He replies either to the Jotform notification email, or to an OS **✉ Request artwork** email whose subject is `[A-1234] GDR #<id> – <title> – <venue>`.
5. **Flow B** sees an email **from Luca with attachments**. It matches the activity by `[A-1234]`, or else by `GDR #<id>`, and saves the files into the activity's Job Folder. It then sets **Linked Artwork Folder** and posts a note on the activity.
6. **The OS updates itself.** The activity and its design tickets show **Artwork received**, and the Go Live **Final artwork** check passes.

## What's already in the OS

| Feature | Where |
|---|---|
| **Activity reference** "A-" + SharePoint item ID (e.g. A-1234) | Activity page header, Submissions cards, Pipeline cards, Queues rows |
| **GDR #<submission ID>**, shown next to the A-number when the activity came from Jotform | Same places. Search finds an activity by `A-1234`, by `GDR #…`, or by the bare submission ID. |
| **✉ Request artwork** | Activity page → Design section, and Queues → Design tab rows. It opens an email to the open design ticket's owner (default Luca). The subject is `[A-1234] GDR #<id> – <title> – <venue>`. The body has the brief, the due date and a link back, and asks Luca to reply with the artwork attached and keep the subject. |
| **Artwork received** | Shown on the activity's Design section and on its design and print tickets once **Artwork File** or **Linked Artwork Folder** is set. The Go Live "Final artwork" check passes at the same time. |
| **Jotform Submission ID column** | **Admin & Schema → Proposed SharePoint columns** lists `JotformSubmissionId` (text). Select **Add missing** to create it. That button creates every missing column it lists, after a confirmation. |

## Names to use

| What | Value |
|---|---|
| SharePoint site | `https://marlingroupaus.sharepoint.com/sites/MarlinHospitalityMarketing` |
| Activities list | `Marketing & Activations 2026` |
| Comments list | `Activity Comments` |
| Documents library | `Documents` (path `/Shared Documents`) |
| Job Folders live in | `/Shared Documents/00. Marketing OS Files/00. Marketing Activities/` |
| GDR Inbox (create once) | `/Shared Documents/00. Marketing OS Files/GDR Inbox/` |
| Luca's address | `LUCA_EMAIL_HERE`. **Fill this in.** The OS uses `luca@marlingroup.com.au`; check this is the address he sends artwork from. |

## Part 1: Jotform → Activities (intake, no Power Automate)

### 1a. Create the column first

In the OS, go to **Admin & Schema → Proposed SharePoint columns** and create **Jotform Submission ID** (`JotformSubmissionId`, single line of text) with **Add missing**.

### 1b. Prepare the form

In the Jotform builder:

1. **Venue dropdown:** make the options **exactly** match the SharePoint Venue choices: `The Left Bank`, `The Ravenswood`, `Whitfords Brewing Co`, `Hotel Darwin`, `Mustang Bar`, `Beerland Brewing`, `All Venues`. Same spelling and capitals. Jotform sends the text as-is, so a value SharePoint doesn't know (e.g. "WBC" or "Whitfords") makes the row fail or leaves Venue blank.
2. **Fixed values:** add these as **Hidden** fields (Form Elements → Hidden Box), so the integration has something to map to the fixed columns:
   - `os_stage` = `Intake`
   - `os_status` = `Active`
   - `os_type` = `Campaign`
   - `os_group` = `Venue, Brand & Collateral`
   - `os_subtype` = `Brand Assets`

   Kim changes the group and subtype in triage if needed. The OS needs a Group to choose job tickets.
3. **Dates:** set every date field's format to **YYYY-MM-DD** (date field → Properties → Date Format). SharePoint date columns accept that reliably.
   - **Start date is required by the OS.** If the form has no event or start date, map the "date needed by" field to Start, and Kim corrects it in triage.
   - Alternatively, add a hidden Date field whose default is **Current Date**.
4. **Description:** add a **Form Calculation** widget (or a hidden "Text" field filled by Conditions → Update/Calculate field) named `os_description` that combines the brief into one block:

   ```
   {briefDescription}
   Formats / sizes: {dimensions}
   Channels: {channels}
   Due: {dueDate}

   Submitted by: {requesterName} ({requesterEmail})
   ```

   Use your form's own field names in the braces. **Keep the `Submitted by:` line last.** The OS shows the last "Submitted by:" line as the requester, so Submissions shows the venue manager rather than whoever connected the integration.

### 1c. Connect SharePoint

1. In Jotform, open the form and go to **Settings → Integrations**. Search for **Microsoft SharePoint** and select **Authenticate**.
2. Sign in with a Marlin Microsoft 365 account that can **edit** the Marketing site. Ideally use a shared or service account, not a personal one (see Permissions). Accept the consent screen.
3. Choose the site **MarlinHospitalityMarketing**.
4. **Action: Add row to an existing list**, list **Marketing & Activations 2026**.
5. Map the fields as below. Jotform's menu names may differ slightly from what's described here; the mapping is what matters.

| Jotform field (typical GDR form) | SharePoint column (internal name) | Notes |
|---|---|---|
| Activity / project title | `Title` | Required |
| Venue (dropdown) | `Venue` | Choice. Must match exactly (see 1b). |
| Event / start date | `Start` | Required. YYYY-MM-DD, or "date needed by" if there's no event date. |
| End date | `End` | Optional. Leave unmapped for one-day items. |
| `os_description` (calculated) | `Description` | Brief, formats, channels, due date and **Submitted by** |
| `os_stage` (hidden: Intake) | `WorkflowStage` | Choice. `Intake` shows as **Submissions** in the OS. |
| `os_status` (hidden: Active) | `Status` | Choice |
| `os_type` (hidden: Campaign) | `ActivityType` | Choice: Event, Promotion / Offer, Campaign, Maintenance / Update |
| `os_group` (hidden) | `ActivityGroup` | Choice. Exact text: `Venue, Brand & Collateral` |
| `os_subtype` (hidden) | `ActivitySubtype` | Text |
| **Submission ID** (`{id}`) | `JotformSubmissionId` | Text. This is what links Luca's reply. |
| Channels (checkboxes) | (leave unmapped) | Goes into the description. `Channels` in SharePoint is a multi-choice column, and Jotform sends one string. |
| Dimensions / formats | (leave unmapped) | Goes into the description |
| Requester name / email | (leave unmapped) | Goes into the description's "Submitted by" line |
| Due date | (optional) none | Goes into the description. The design ticket's due date is set on approval. |

6. **Save, then send a test submission.** A new item should appear in the OS under Submissions with its **A-number** and **GDR #…**. If it doesn't, open the integration's **action logs** (Settings → Integrations → SharePoint → the action's menu). They show the exact SharePoint error. It's almost always a choice value that doesn't match, or a date format.

**If a choice value doesn't match:**
- **Venue:** make the dropdown options match SharePoint exactly, or map Venue from a hidden field and set it to `All Venues`, for Kim to fix in triage.
- **Stage, Status, Type and Group:** these come from the hidden fields, so they can't drift.
- **If SharePoint still rejects a choice:** the column has "Allow fill-in choices" turned off. Either fix the value, or turn fill-in on in list settings for that column. Fill-in is not recommended for Venue.

### 1d. (Optional) Save the uploaded files and the submission PDF

In the same integration, add a second action: **Upload files to a folder** (Jotform's file action for SharePoint).
- **Library:** Documents
- **Folder:** `00. Marketing OS Files/GDR Inbox`. If Jotform lets you name a subfolder from a form value, use the **Submission ID** so each GDR gets `GDR Inbox/<id>`.
- **Turn on "Include submission PDF"** if offered.

These are the requester's reference files. Luca's finished artwork goes into the activity's Job Folder (Part 3).

## Part 2: The notification email subject (Kim does this in Jotform)

Go to **Jotform → Settings → Emails**, edit the **Notification** email that goes to Luca and Kim, and set the **Subject** to:

```
GDR #{id} – {venue} – {activityTitle}
```

Use the form's real field names. `{id}` is Jotform's **Submission ID**. Luca usually replies to this email with the artwork, so his reply's subject carries `GDR #<id>`, and Flow B uses that to find the activity. Leave the reply-to as it is.

## Part 3: Flow B "Luca's artwork → Job Folder" (Power Automate, standard connectors)

This flow only reacts to **Luca's** emails with attachments, so nothing else in the inbox is touched.

1. **Create the flow.** In Power Automate: **Create → Automated cloud flow**. Name it `GDR artwork (Luca) → Job Folder`, choose the trigger **When a new email arrives (V3)** (Office 365 Outlook), and select **Create**.
   - If Luca's replies go to a **shared mailbox**, use **When a new email arrives in a shared mailbox (V2)** instead. Its settings are the same.
2. **Trigger settings.** Open **Show all** and set:
   - **Folder:** Inbox (or the folder an Outlook rule moves GDR mail into)
   - **From:** `LUCA_EMAIL_HERE`
   - **Only with Attachments:** Yes
   - **Include Attachments:** Yes
   - **Subject Filter:** leave blank. The next steps check the subject.
3. **Initialise variables.** Add **Initialize variable** three times:
   - `ActivityID` (String, empty)
   - `GdrID` (String, empty)
   - `SaveTo` (String, empty)
4. **Try the A-number first.** Add a **Condition**: `contains(triggerOutputs()?['body/subject'],'[A-')` is equal to `true`.
   - **If yes:** add **Set variable** `ActivityID` = `first(split(last(split(triggerOutputs()?['body/subject'],'[A-')),']'))`.
5. **Otherwise use the GDR number.** Add another **Condition**: `and(empty(variables('ActivityID')),contains(triggerOutputs()?['body/subject'],'GDR #'))` is equal to `true`.
   - **If yes:**
     - Add **Set variable** `GdrID` = `trim(first(split(first(split(last(split(triggerOutputs()?['body/subject'],'GDR #')),' ')),'–')))`.
     - Add **Get items** (SharePoint). **List:** `Marketing & Activations 2026`. **Filter Query:** `JotformSubmissionId eq '@{variables('GdrID')}'`. **Top Count:** `1`.
     - Add a **Condition**: `length(body('Get_items')?['value'])` is greater than `0`.
       - **If yes:** **Set variable** `ActivityID` = `first(body('Get_items')?['value'])?['ID']`.
6. **Nothing matched.** Add a **Condition**: `empty(variables('ActivityID'))` is equal to `true`.
   - **If yes** (no `[A-…]`, and no activity with that GDR number):
     - **Set variable** `SaveTo` = `concat('/Shared Documents/00. Marketing OS Files/GDR Inbox/',if(empty(variables('GdrID')),'Unmatched',variables('GdrID')))`.
     - Add **Apply to each** over Attachments with the **Create file** steps from step 9.
     - Add **Send an email (V2)** to Kim: "Artwork from Luca couldn't be matched to an activity (subject: …). Saved to GDR Inbox."
     - Add **Terminate** (Succeeded).
7. **Get the activity.** Add **Get item** (SharePoint). **List:** `Marketing & Activations 2026`. **Id:** `variables('ActivityID')`.
8. **Work out the folder.** Add **Compose** and rename it `FolderUrl`. This handles `JobFolderURL` as a text column or a Hyperlink column:

   ```
   if(empty(body('Get_item')?['JobFolderURL']),'',if(contains(string(body('Get_item')?['JobFolderURL']),'"Url"'),body('Get_item')?['JobFolderURL']?['Url'],body('Get_item')?['JobFolderURL']))
   ```

   Add **Compose** and rename it `FolderPath`, which turns the link into a library path:

   ```
   decodeUriComponent(last(split(first(split(outputs('FolderUrl'),'?')),'/sites/MarlinHospitalityMarketing')))
   ```

   Add a **Condition**: `outputs('FolderUrl')` **is not equal to** an empty string **and** `outputs('FolderPath')` **starts with** `/Shared Documents`.
   - **If yes:** **Set variable** `SaveTo` = `outputs('FolderPath')`.
   - **If no:** **Set variable** `SaveTo` = `concat('/Shared Documents/00. Marketing OS Files/GDR Inbox/A-',variables('ActivityID'))`. The Job Folder is missing, or it's a sharing link. This is the known Job Folder failure in `docs/CALENDAR_DASHBOARD_AUDIT.md` §2.3.
9. **Save the attachments.** Add **Apply to each** over the trigger's **Attachments**. Inside it:
   - Add a **Condition**: `items('Apply_to_each')?['isInline']` is equal to `false` **and** `items('Apply_to_each')?['size']` is greater than `20000`. This skips signature logos and inline images.
   - **If yes:** add **Create file** (SharePoint).
     - **Folder Path:** `variables('SaveTo')`. Create file creates missing folders, which covers the GDR Inbox fallback.
     - **File Name:** `concat(formatDateTime(utcNow(),'yyyyMMdd-HHmm'),'_',items('Apply_to_each')?['name'])`. The timestamp means revisions never overwrite each other.
     - **File Content:** `base64ToBinary(items('Apply_to_each')?['contentBytes'])`
10. **Mark the activity as having artwork** (only when the Job Folder was found and Linked Artwork Folder is empty). Add **Update item**: **Id** = `variables('ActivityID')`, **LinkedArtworkFolderURL** = `outputs('FolderUrl')`. The OS then shows **Artwork received**, and the Go Live artwork check passes.
    - If `LinkedArtworkFolderURL` is a **Hyperlink** column, Update item won't offer it. Use **Send an HTTP request to SharePoint** (standard) instead:
      - **Method:** `POST`
      - **Uri:** `_api/web/lists/getbytitle('Marketing & Activations 2026')/items(@{variables('ActivityID')})/ValidateUpdateListItem`
      - **Body:** `{"formValues":[{"FieldName":"LinkedArtworkFolderURL","FieldValue":"@{outputs('FolderUrl')}, Artwork"}]}`
11. **Post a note on the activity.** Add **Create item** (SharePoint).
    - **List:** `Activity Comments`
    - **Title:** first 50 characters of `body('Get_item')?['Title']`
    - **Comment:** `Artwork received from Luca (@{length(triggerOutputs()?['body/attachments'])} attachment(s)), saved to @{variables('SaveTo')}.` In the fallback case, add "Job Folder missing, please link it."
    - **CampaignId:** `variables('ActivityID')`
    - **Recipient:** `Kim`. This shows in her OS Inbox and the activity's Discussion.
12. **Save, then test.** Reply, as Luca, to a Jotform notification email (`GDR #…`) with a PDF attached. The PDF should appear in that activity's Job Folder, and the activity should show **Artwork received**.

## What can go wrong

| Situation | What happens | Fix |
|---|---|---|
| A Jotform row fails | Nothing appears in Submissions | Check the integration's action logs. It's usually Venue spelling or the date format (1b). |
| Luca sends a brand-new email (no `GDR #` or `[A-`) | It's saved to `GDR Inbox/Unmatched`, and Kim is emailed | Ask him to reply to the GDR or Request artwork email, or add `[A-1234]` to the subject |
| No Job Folder yet (not approved, or the folder flow failed) | Files go to `GDR Inbox/A-1234`, and a note is posted | Approve the activity, or use **Create folder / Link** on the activity page, then move the files |
| `JobFolderURL` holds a sharing link (`/:f:/s/…`) | The path can't be worked out, so the fallback is used | Re-link the folder from the activity page. The OS stores the folder's direct link. |
| Two activities have the same Jotform ID (e.g. duplicated in the OS) | The first match is used | Duplicates made with "Duplicate as next month" don't copy the Jotform ID |

## Plans, permissions and IT

- **Jotform plan:** the SharePoint integration is in Jotform's Integrations. Check that your Jotform plan includes it and covers your monthly submission count; free plans have low limits. No Jotform Enterprise or Power Automate Jotform connector is needed. Microsoft lists that connector as **Premium**, which is why this guide uses Jotform's own integration.
- **Microsoft sign-in and consent for Jotform:**
  - **The consent screen:** connecting SharePoint in Jotform shows a Microsoft consent screen that lets the "Jotform" app access SharePoint on the signed-in user's behalf.
  - **When IT is needed:** if Marlin's Microsoft 365 tenant blocks users from consenting to third-party apps, the screen says **"Need admin approval"**. An IT admin then has to approve the Jotform app (Entra ID → Enterprise applications → admin consent).
  - **Which account:** connect with an account that will stay, such as a service account or Kim's, not a temporary one.
- **Power Automate (Flow B):**
  - **Licence:** Office 365 Outlook and SharePoint connectors only, which are standard, so a normal Microsoft 365 business licence is enough.
  - **Access:** the flow owner needs **Edit** on the Marketing site (Activities, Activity Comments and Documents), and access to the mailbox Luca replies to.
  - **Ownership:** add a **co-owner** so the flow survives account changes.
- **Optional shared mailbox** (e.g. `design@marlingroup.com.au`): if Luca's replies should go somewhere other than Kim's inbox. IT creates it; it's free and needs no licence.
- **No API keys, app registrations or Azure resources** are needed, beyond the Jotform consent above.

## Check it works

1. **Create the column:** in **Admin & Schema**, create **Jotform Submission ID**.
2. **Intake:** submit the GDR Jotform as a test. An activity appears in Submissions with its **A-number** and **GDR #…**, the right venue, and "Submitted by" showing the person who filled in the form.
3. **Approve it** in the OS. Job tickets are proposed, and the Job Folder appears.
4. **Request artwork:** select **✉ Request artwork**. The email to Luca has `[A-…] GDR #… – …` in its subject.
5. **As Luca, reply to the Jotform notification email** with a PDF. The PDF lands in the Job Folder, a note appears on the activity, and the activity shows **Artwork received**.
6. **As Luca, send a new email** with an attachment and no reference. It lands in `GDR Inbox/Unmatched`, and Kim is emailed.
