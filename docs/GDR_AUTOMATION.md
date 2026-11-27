# GDR automation: Jotform email → activity → Job Folder → Luca's artwork filed

Written 27 Nov 2026. This replaces the earlier version, which used Jotform's SharePoint integration. That integration needs Microsoft admin consent, so it's dropped.

Everything below uses **Power Automate with standard connectors only** (Office 365 Outlook, SharePoint and Content Conversion). There's no premium licence, no IT consent and no Claude usage. You set it up once by clicking through Power Automate; every formula is ready to copy and paste.

## What it does

1. **A venue manager submits the GDR Jotform.** Jotform emails you the response from `noreply@formresponse.com`, with a subject starting `GDR -`.
2. **Flow A, "GDR email → Activity",** reads that email:
   - It picks out the venue, title, requester, details, content and dates, plus the Jotform submission number from the "Edit this submission" link.
   - It creates the activity in the OS under **Submissions**. If that submission was already logged (e.g. someone edited the form), it **updates** the existing activity instead. It never creates a duplicate.
3. **You approve it in the OS as usual.** Job tickets are created, and the Job Folder flow makes the folder.
   - **New:** the design ticket's due date defaults to the form's **Final Version** date.
4. **Luca replies with the artwork attached.** **Flow B, "Luca's artwork → Job Folder",** works out which activity the reply is about. It checks the quoted Jotform email inside his reply first, then `[A-1234]` / `GDR #…`, then the "GDR - venue - title" subject. It saves the files into that activity's Job Folder, marks it **Artwork received** and posts a note on it.

## What's in the OS for this

| Feature | Where |
|---|---|
| **A-1234** reference on every activity, plus **GDR #<submission number>** for Jotform requests | Activity header, Submissions and Pipeline cards, Queues. The top search box finds `A-1234`, `GDR #…` or the bare submission number. |
| **GDR dates** (first draft, final version) | Activity → Design section. The Final Version date becomes the default due date of the design job ticket when you approve. |
| **✉ Request artwork** | Activity → Design section, and Queues → Design rows. It emails Luca with the subject `[A-1234] GDR #… – title – venue`, the brief, the first draft and final dates, and a link back to the activity. |
| **Artwork received** | Shows once Flow B has saved Luca's files (it sets **Linked Artwork Folder**). The Go Live "Final artwork" check passes at the same time. |

## Before you start (10 minutes)

1. **Create three columns in the OS.**
   1. Go to **Admin & Schema**, find **Proposed SharePoint columns**, and select **Add missing**.
   2. Check that the list it shows includes **Jotform Submission ID**, **GDR First Draft Due** and **GDR Final Version Due**, then confirm.
   3. "Add missing" creates every column marked Missing, so read the list first.
2. **Create the GDR Inbox folder.**
   1. In SharePoint, open the Marketing site → **Documents** → **00. Marketing OS Files**.
   2. Select **+ New → Folder** and name it `GDR Inbox`.
   3. Unmatched artwork goes here, so nothing is ever lost.
3. **Check Luca's email address.** Open one of his emails and note the exact sending address. This guide uses `LUCA_EMAIL_HERE` wherever you need it.
4. **Check one GDR email's code** (only if something doesn't fill in later). Most Jotform response emails use the cell IDs listed below. To confirm yours:
   1. Open a GDR email in Outlook on the web.
   2. Select **… (More actions) → View → View message source**.
   3. Search for `id="value_5"`. If it's there, you're set.

| Jotform field | Cell ID in the email |
|---|---|
| Venue (a short code, e.g. WBC) | `value_5` |
| Project Title | `value_6` |
| Person Requesting | `value_55` |
| Requester email | `value_4` |
| Details | `value_8` |
| Content | `value_9` |
| First Draft | `value_14` (dd-MM-yyyy) |
| Final Version | `value_15` (dd-MM-yyyy) |
| Expected Delivery | `value_48` (dd-MM-yyyy) |

## How to do the two things you'll repeat

**Add a "Compose" step and paste a formula:**
1. Select **+** (Insert a new action) under the previous step.
2. Search for **Compose** and choose **Compose (Data Operation)**.
3. **Rename it:** select the step's title, or **… → Rename**, and type the exact name given, **with underscores** (e.g. `Venue_raw`). The formulas find each other by these names, so they must match exactly.
4. Select inside the **Inputs** box, then select the **fx** icon (Insert expression).
5. Paste the formula into the expression box and select **Add** (or **OK**).

**Use a value from an earlier step in a field:** select inside the field, select the **lightning-bolt** icon (Dynamic content), and pick the step by name. Or use **fx** and type e.g. `outputs('Venue')`.

---

## Flow A: "GDR email → Activity"

### Start the flow

1. Go to **make.powerautomate.com** and sign in with your Marlin account.
2. Select **+ Create** (left menu), then **Automated cloud flow**.
3. **Flow name:** `GDR email → Activity`.
4. In **Choose your flow's trigger**, search for `new email arrives` and pick **When a new email arrives (V3)** (Office 365 Outlook). Select **Create**.
5. Select the trigger to open its settings, then **Show all** (or **Advanced parameters**). Set:
   - **Folder:** `Inbox`
   - **From:** `noreply@formresponse.com`
   - **Subject Filter:** `GDR -`
   - **Include Attachments:** `No`
   - **Only with Attachments:** `No`
   - **Importance:** `Any`

### Read the email

6. Add a **Compose** named `Body`. In **Inputs**, paste this formula with **fx**. It's the email's full content:

   ```
   triggerOutputs()?['body/body']
   ```

7. Add a **Compose** named `Submission_ID`.

    ```
    if(contains(outputs('Body'),'jotform.com%2Fedit%2F'), first(split(last(split(outputs('Body'),'jotform.com%2Fedit%2F')),'%3F')), if(contains(outputs('Body'),'jotform.com/edit/'), first(split(first(split(last(split(outputs('Body'),'jotform.com/edit/')),'?')),'"')), ''))
    ```

    *What it does:* Finds the number in the "Edit this submission" link (works whether Outlook has wrapped the link in SafeLinks or not).

8. **Stop if there's no submission number.** Add a **Condition**: select **+ → Condition**.
   - **Left box:** **fx** → `empty(outputs('Submission_ID'))`
   - **Middle:** `is equal to`
   - **Right box:** **fx** → `true`
   - **In "True",** add **Terminate** (Control) with **Status** `Cancelled`.
   - **Leave "False" empty.** Everything below goes **after** the Condition, not inside it.
9. Add a **Compose** named `Venue_code`.

    ```
    if(contains(outputs('Body'),'id="value_5"'), trim(replace(replace(replace(replace(last(split(first(split(last(split(outputs('Body'),'id="value_5"')),'</')),'>')),'&amp;','&'),'&nbsp;',' '),'&#039;',''''),'&#39;','''')), '')
    ```

    *What it does:* The Venue cell (value_5): the short code the form sends, e.g. WBC. Blank if the field is missing.

10. Add a **Compose** named `Project_Title`.

    ```
    if(contains(outputs('Body'),'id="value_6"'), trim(replace(replace(replace(replace(last(split(first(split(last(split(outputs('Body'),'id="value_6"')),'</')),'>')),'&amp;','&'),'&nbsp;',' '),'&#039;',''''),'&#39;','''')), '')
    ```

    *What it does:* The Project Title cell (value_6).

11. Add a **Compose** named `Requester`.

    ```
    if(contains(outputs('Body'),'id="value_55"'), trim(replace(replace(replace(replace(last(split(first(split(last(split(outputs('Body'),'id="value_55"')),'</')),'>')),'&amp;','&'),'&nbsp;',' '),'&#039;',''''),'&#39;','''')), '')
    ```

    *What it does:* The Person Requesting cell (value_55).

12. Add a **Compose** named `Requester_Email`.

    ```
    if(contains(outputs('Body'),'id="value_4"'), trim(replace(replace(replace(replace(last(split(first(split(last(split(outputs('Body'),'id="value_4"')),'</')),'>')),'&amp;','&'),'&nbsp;',' '),'&#039;',''''),'&#39;','''')), '')
    ```

    *What it does:* The Email cell (value_4).

13. Add a **Compose** named `Details_HTML`.

    ```
    if(contains(outputs('Body'),'id="value_8"'), substring(first(split(last(split(outputs('Body'),'id="value_8"')),'</td>')), add(indexOf(first(split(last(split(outputs('Body'),'id="value_8"')),'</td>')),'>'),1)), '')
    ```

    *What it does:* The whole Details cell (value_8), still with its line breaks, ready for the Html to text step.

14. Add **Html to text** (search for it; it's in **Content Conversion**). Rename it `Details_as_text`.
   - **Content:** **fx** → `concat(' ', outputs('Details_HTML'))`. The space stops it complaining when Details is empty.
15. Add a **Compose** named `Content_HTML`.

    ```
    if(contains(outputs('Body'),'id="value_9"'), substring(first(split(last(split(outputs('Body'),'id="value_9"')),'</td>')), add(indexOf(first(split(last(split(outputs('Body'),'id="value_9"')),'</td>')),'>'),1)), '')
    ```

    *What it does:* The whole Content cell (value_9), ready for the Html to text step.

16. Add **Html to text** again. Rename it `Content_as_text`.
   - **Content:** **fx** → `concat(' ', outputs('Content_HTML'))`
17. Add a **Compose** named `First_Draft_raw`.

    ```
    if(contains(outputs('Body'),'id="value_14"'), trim(replace(replace(replace(replace(last(split(first(split(last(split(outputs('Body'),'id="value_14"')),'</')),'>')),'&amp;','&'),'&nbsp;',' '),'&#039;',''''),'&#39;','''')), '')
    ```

    *What it does:* The First Draft date (value_14), as written, e.g. 01-12-2026.

18. Add a **Compose** named `Final_Version_raw`.

    ```
    if(contains(outputs('Body'),'id="value_15"'), trim(replace(replace(replace(replace(last(split(first(split(last(split(outputs('Body'),'id="value_15"')),'</')),'>')),'&amp;','&'),'&nbsp;',' '),'&#039;',''''),'&#39;','''')), '')
    ```

    *What it does:* The Final Version date (value_15).

19. Add a **Compose** named `Expected_Delivery_raw`.

    ```
    if(contains(outputs('Body'),'id="value_48"'), trim(replace(replace(replace(replace(last(split(first(split(last(split(outputs('Body'),'id="value_48"')),'</')),'>')),'&amp;','&'),'&nbsp;',' '),'&#039;',''''),'&#39;','''')), '')
    ```

    *What it does:* The Expected Delivery date (value_48).

20. Add a **Compose** named `First_Draft_date`.

    ```
    if(equals(length(split(first(split(trim(outputs('First_Draft_raw')),' ')),'-')),3), concat(split(first(split(trim(outputs('First_Draft_raw')),' ')),'-')[2],'-',split(first(split(trim(outputs('First_Draft_raw')),' ')),'-')[1],'-',split(first(split(trim(outputs('First_Draft_raw')),' ')),'-')[0]), null)
    ```

    *What it does:* Turns 01-12-2026 into 2026-12-01 for SharePoint. Blank stays blank.

21. Add a **Compose** named `Final_Version_date`.

    ```
    if(equals(length(split(first(split(trim(outputs('Final_Version_raw')),' ')),'-')),3), concat(split(first(split(trim(outputs('Final_Version_raw')),' ')),'-')[2],'-',split(first(split(trim(outputs('Final_Version_raw')),' ')),'-')[1],'-',split(first(split(trim(outputs('Final_Version_raw')),' ')),'-')[0]), null)
    ```

    *What it does:* Same for Final Version.

22. Add a **Compose** named `Expected_Delivery_date`.

    ```
    if(equals(length(split(first(split(trim(outputs('Expected_Delivery_raw')),' ')),'-')),3), concat(split(first(split(trim(outputs('Expected_Delivery_raw')),' ')),'-')[2],'-',split(first(split(trim(outputs('Expected_Delivery_raw')),' ')),'-')[1],'-',split(first(split(trim(outputs('Expected_Delivery_raw')),' ')),'-')[0]), null)
    ```

    *What it does:* Same for Expected Delivery.

23. Add a **Compose** named `Start_date`.

    ```
    if(empty(outputs('Expected_Delivery_date')), formatDateTime(addDays(utcNow(),14),'yyyy-MM-dd'), outputs('Expected_Delivery_date'))
    ```

    *What it does:* The activity's Start date (the OS needs one). Uses Expected Delivery, or two weeks from today if the form left it blank. Kim corrects it in triage.

24. **The venue code list.** Add a **Compose** named `VenueMap`. Paste this into **Inputs** as plain text (**not** with fx). It's the list of codes the form sends and the exact OS venue each one means:

    ```json
    {
      "TLB": "The Left Bank",
      "NBC": "Northbridge Brewing Co",
      "WBC": "Whitfords Brewing Co",
      "HD": "Hotel Darwin",
      "RH": "The Ravenswood",
      "MUS": "Mustang Bar",
      "BB": "Beerland Brewing",
      "RC": "",
      "BV": "",
      "HME": ""
    }
    ```

    - **Adding a code later:** add one line like `"XYZ": "Exact Venue Name",` and keep the commas between lines. The name on the right must be spelt exactly like a SharePoint Venue choice: The Left Bank, The Ravenswood, Whitfords Brewing Co, Hotel Darwin, Mustang Bar, Beerland Brewing, All Venues.
    - **⚠ RC, BV and HME are placeholders.** Their meanings aren't confirmed yet, so they're left as `""`. Until you fill them in, those GDRs arrive with no venue and a warning (see step 26).
    - **⚠ NBC → Northbridge Brewing Co is not yet a Venue choice in SharePoint.** Before the first NBC GDR, add it: in SharePoint open **Marketing & Activations 2026**, select **⚙ Settings → List settings → Venue**, add `Northbridge Brewing Co` on a new line under the choices, and select **OK**. Otherwise Create item fails for NBC. (Or set NBC to `""` for now.)
25. Add a **Compose** named `Venue`.

    ```
    coalesce(outputs('VenueMap')?[toUpper(trim(outputs('Venue_code')))], '')
    ```

    *What it does:* Looks the code up in VenueMap. Gives the exact SharePoint Venue choice, or blank if the code isn't in the list.

26. Add a **Compose** named `Venue_flag`.

    ```
    if(empty(outputs('Venue')), concat('⚠ Venue code ''', outputs('Venue_code'), ''' not recognised, set the venue.', decodeUriComponent('%0A%0A')), '')
    ```

    *What it does:* If the code wasn't recognised (or was blank), a warning line for the top of the description. Otherwise nothing.


    It ends up at the top of the activity's description, so you see it in Submissions. **Optionally, also email yourself:**
    1. Add a **Condition**: **fx** `empty(outputs('Venue'))` **is equal to** **fx** `true`.
    2. In "True", add **Send an email (V2)** to yourself with the subject `GDR venue code not recognised` and the body **fx** `outputs('Venue_flag')`.

27. Add a **Compose** named `Description`.

    ```
    concat(outputs('Venue_flag'), body('Details_as_text'), decodeUriComponent('%0A%0A'), body('Content_as_text'), decodeUriComponent('%0A%0A'), 'Venue code on form: ', outputs('Venue_code'), decodeUriComponent('%0A'), 'First draft: ', outputs('First_Draft_raw'), ' · Final version: ', outputs('Final_Version_raw'), ' · Expected delivery: ', outputs('Expected_Delivery_raw'), decodeUriComponent('%0A'), 'Jotform submission: ', outputs('Submission_ID'), decodeUriComponent('%0A%0A'), 'Submitted by: ', outputs('Requester'), ' (', outputs('Requester_Email'), ')')
    ```

    *What it does:* Builds the activity description: any venue warning, details, content, the original dates and venue, and a last "Submitted by:" line so the OS shows the requester.


### Create or update the activity

28. **Look for an existing activity with this submission number.** Add **Get items** (SharePoint).
   - **Site Address:** `https://marlingroupaus.sharepoint.com/sites/MarlinHospitalityMarketing`
   - **List Name:** `Marketing & Activations 2026`
   - **Filter Query** (under Advanced parameters): type `JotformSubmissionId eq '`, then **fx** → `outputs('Submission_ID')`, then type `'`. The box should read `JotformSubmissionId eq '[Submission_ID]'`.
   - **Top Count:** `1`
29. Add a **Condition**.
   - **Left box:** **fx** → `length(body('Get_items')?['value'])`
   - **Middle:** `is greater than`
   - **Right box:** `0`
30. **In "True" (already logged), update it.** Add **Update item** (SharePoint).
   - **Site Address / List Name:** same as step 28
   - **Id:** **fx** → `first(body('Get_items')?['value'])?['ID']`
   - **Title:** **fx** → `outputs('Project_Title')`
   - **Description:** **fx** → `outputs('Description')`
   - **GdrFirstDraftDue:** **fx** → `outputs('First_Draft_date')`
   - **GdrFinalDue:** **fx** → `outputs('Final_Version_date')`
   - **Leave everything else blank.** Blank fields are left unchanged, so your triage edits (stage, dates, venue) are kept.
31. **In "False" (new GDR), create it.** Add **Create item** (SharePoint).
   - **Site Address / List Name:** same as step 28
   - **Title:** **fx** → `outputs('Project_Title')`
   - **Venue Value:** **fx** → `outputs('Venue')` (blank when the code wasn't recognised)
   - **Start:** **fx** → `outputs('Start_date')`
   - **End:** **fx** → `outputs('Start_date')`
   - **ActivityType Value:** `Campaign`
   - **WorkflowStage Value:** `Intake` (shows as **Submissions** in the OS)
   - **Status Value:** `Active`
   - **ActivityGroup Value:** `Venue, Brand & Collateral`
   - **ActivitySubtype:** `Brand Assets`
   - **Description:** **fx** → `outputs('Description')`
   - **JotformSubmissionId:** **fx** → `outputs('Submission_ID')`
   - **GdrFirstDraftDue:** **fx** → `outputs('First_Draft_date')`
   - **GdrFinalDue:** **fx** → `outputs('Final_Version_date')`

   If a field isn't listed, select **Show all** / **Advanced parameters** on the action. If Venue, WorkflowStage or Status shows a dropdown, choose **Enter custom value** first.

### Tidy up (optional)

32. **After the Condition** (not inside it), add **Mark as read or unread (V3)** (Office 365 Outlook).
   - **Message Id:** dynamic content → **Message Id** (from the trigger)
   - **Mark as:** `Read`
33. **Optionally,** add **Move email (V2)** with **Message Id** from the trigger and **Folder** `GDR`. Create a GDR folder in Outlook first.
34. Select **Save**.

---

## Flow B: "Luca's artwork → Job Folder"

### Start the flow

1. **+ Create → Automated cloud flow.** Name it `Luca's artwork → Job Folder`, with the trigger **When a new email arrives (V3)**. Select **Create**.
2. **Trigger settings** (**Show all**):
   - **Folder:** `Inbox`
   - **From:** `LUCA_EMAIL_HERE`
   - **Include Attachments:** `Yes`
   - **Only with Attachments:** `Yes`
   - **Subject Filter:** leave empty

### Work out which activity it's about

3. Add a **Compose** named `Reply_body`:

   ```
   triggerOutputs()?['body/body']
   ```

4. Add a **Compose** named `Reply_text`. This is the subject and body together, for searching:

   ```
   concat(triggerOutputs()?['body/subject'], ' ', triggerOutputs()?['body/body'])
   ```

5. Add a **Compose** named `Reply_ID_from_link`.

    ```
    if(contains(outputs('Reply_body'),'jotform.com%2Fedit%2F'), first(split(last(split(outputs('Reply_body'),'jotform.com%2Fedit%2F')),'%3F')), if(contains(outputs('Reply_body'),'jotform.com/edit/'), first(split(first(split(last(split(outputs('Reply_body'),'jotform.com/edit/')),'?')),'"')), ''))
    ```

    *What it does:* Looks for the Jotform "Edit this submission" link in the quoted original email inside Luca's reply.

6. Add a **Compose** named `Reply_ID_from_text`.

    ```
    if(contains(outputs('Reply_text'),'GDR #'), trim(first(split(first(split(last(split(outputs('Reply_text'),'GDR #')),' ')),'–'))), '')
    ```

    *What it does:* Looks for "GDR #<number>" in the subject or body (the OS Request artwork email uses it).

7. Add a **Compose** named `A_number`.

    ```
    if(contains(outputs('Reply_text'),'[A-'), first(split(last(split(outputs('Reply_text'),'[A-')),']')), '')
    ```

    *What it does:* Looks for the OS activity reference [A-1234].

8. Add a **Compose** named `Subject_venue`.

    ```
    if(contains(triggerOutputs()?['body/subject'],'GDR -'), trim(first(split(trim(last(split(triggerOutputs()?['body/subject'],'GDR -'))),' - '))), '')
    ```

    *What it does:* From a subject like "RE: GDR - Whitfords Brewing Co - Oyster Sundays", takes the venue part (RE:/FW: are ignored).

9. Add a **Compose** named `Subject_title`.

    ```
    if(contains(triggerOutputs()?['body/subject'],'GDR -'), trim(substring(trim(last(split(triggerOutputs()?['body/subject'],'GDR -'))), add(indexOf(trim(last(split(triggerOutputs()?['body/subject'],'GDR -'))),' - '),3))), '')
    ```

    *What it does:* Takes the title part (everything after the venue).

10. Add **Initialize variable** (Variables).
    - **Name:** `ActivityID`
    - **Type:** `String`
    - **Value:** **fx** → `outputs('A_number')`
11. Add **Initialize variable**.
    - **Name:** `GdrID`
    - **Type:** `String`
    - **Value:** **fx** → `if(empty(outputs('Reply_ID_from_link')), outputs('Reply_ID_from_text'), outputs('Reply_ID_from_link'))`
12. **Try the submission number.**
    1. Add a **Condition**: **fx** `and(empty(variables('ActivityID')), not(empty(variables('GdrID'))))` **is equal to** **fx** `true`.
    2. **In "True",** add **Get items**. Name it `Find_by_GDR`. Use the same site and list as Flow A, with **Filter Query** `JotformSubmissionId eq '` + **fx** `variables('GdrID')` + `'`, and **Top Count** `1`.
    3. Still in "True", add a **Condition**: **fx** `length(body('Find_by_GDR')?['value'])` **is greater than** `0`.
    4. In **its** "True", add **Set variable** `ActivityID` = **fx** `string(first(body('Find_by_GDR')?['value'])?['ID'])`.
13. **Fall back to the subject.**
    1. Add a **Condition**: **fx** `and(empty(variables('ActivityID')), not(empty(outputs('Subject_title'))))` **is equal to** **fx** `true`.
    2. **In "True",** add **Get items**. Name it `Find_by_title`.
       - **Filter Query:** `Title eq '` + **fx** `replace(outputs('Subject_title'),'''','''''')` + `'`. The replace keeps titles with apostrophes working.
       - **Order By:** `ID desc`
       - **Top Count:** `1`
    3. Still in "True", add a **Condition**: **fx** `length(body('Find_by_title')?['value'])` **is greater than** `0`.
    4. In **its** "True", add **Set variable** `ActivityID` = **fx** `string(first(body('Find_by_title')?['value'])?['ID'])`.

    If two activities could share a title, also check the venue. The subject's venue is usually the form's short code (e.g. WBC), so look it up first: add `and Venue eq '` + **fx** `coalesce(outputs('VenueMap')?[toUpper(outputs('Subject_venue'))], outputs('Subject_venue'))` + `'` to the filter. To do that, copy the `VenueMap` Compose from Flow A into this flow first: on the step select **… → Copy to my clipboard**, then **+ → My clipboard**.

### Nothing matched: save to GDR Inbox and tell Kim

14. Add a **Condition**: **fx** `empty(variables('ActivityID'))` **is equal to** **fx** `true`.
15. **In "True":**
    1. Add **Filter array**, renamed `Real_attachments_unmatched`, with **From** = **fx** `triggerOutputs()?['body/attachments']` and the same advanced-mode condition as step 20: `@and(equals(item()?['isInline'], false), greater(item()?['size'], 20000))`.
    2. Add **Apply to each** over **fx** `body('Real_attachments_unmatched')`, and rename it `Save_unmatched`.
    3. Inside it, add **Create file** (SharePoint).
       - **Site Address:** as before
       - **Folder Path:** **fx** → `concat('/Shared Documents/00. Marketing OS Files/GDR Inbox/', if(empty(variables('GdrID')), 'Unmatched', variables('GdrID')))`
       - **File Name:** **fx** → `concat(formatDateTime(convertTimeZone(triggerOutputs()?['body/receivedDateTime'],'UTC','W. Australia Standard Time'),'yyyy-MM-dd HHmm'), ' – ', items('Save_unmatched')?['name'])`
       - **File Content:** **fx** → `base64ToBinary(items('Save_unmatched')?['contentBytes'])`
    4. After the loop (still in "True"), add **Send an email (V2)** to yourself.
       - **Subject:** `Unmatched GDR artwork from Luca`
       - **Body:** "Couldn't match this to an activity. Subject: " + the trigger's **Subject**. "Saved to GDR Inbox."
    5. Add **Terminate**, **Succeeded**.

### Matched: save into the activity's Job Folder

16. **After that Condition,** add **Get item** (SharePoint). Use the same site and list, with **Id** = **fx** `variables('ActivityID')`.
17. Add a **Compose** named `Folder_URL`. This reads the Job Folder link, whichever way the column is set up:

    ```
    if(empty(body('Get_item')?['JobFolderURL']), '', if(contains(string(body('Get_item')?['JobFolderURL']),'"Url"'), body('Get_item')?['JobFolderURL']?['Url'], body('Get_item')?['JobFolderURL']))
    ```

18. Add a **Compose** named `Folder_path`.

    ```
    decodeUriComponent(last(split(first(split(outputs('Folder_URL'),'?')),'/sites/MarlinHospitalityMarketing')))
    ```

    *What it does:* Turns the Job Folder link into the path SharePoint's "Create file" needs.

19. Add a **Compose** named `Save_to`. It uses the Job Folder if there is one, otherwise `GDR Inbox/A-<number>` (the known Job Folder failure, see `docs/CALENDAR_DASHBOARD_AUDIT.md` §2.3):

    ```
    if(startsWith(outputs('Folder_path'),'/Shared Documents'), outputs('Folder_path'), concat('/Shared Documents/00. Marketing OS Files/GDR Inbox/A-', variables('ActivityID')))
    ```

20. **Keep only real attachments.** Luca's signature logo comes through as an inline image, so it's skipped here, along with anything under about 20KB. Add **Filter array** (Data Operation) and rename it `Real_attachments`.
    - **From:** **fx** → `triggerOutputs()?['body/attachments']`
    - Select **Edit in advanced mode** and paste:

    ```
    @and(equals(item()?['isInline'], false), greater(item()?['size'], 20000))
    ```

21. **Save every file, never overwriting.**
    1. Add **Apply to each**, set **Select an output** to **fx** `body('Real_attachments')`, and rename it `Save_attachments`.
    2. Inside it, add **Create file**:
       - **Folder Path:** **fx** → `outputs('Save_to')`
       - **File Name:** **fx** → the formula below
       - **File Content:** **fx** → `base64ToBinary(items('Save_attachments')?['contentBytes'])`

    ```
    concat(formatDateTime(convertTimeZone(triggerOutputs()?['body/receivedDateTime'],'UTC','W. Australia Standard Time'),'yyyy-MM-dd HHmm'), ' – ', items('Save_attachments')?['name'])
    ```

    *What it does:* Puts the email's received date and time (Perth time) in front of the file name, e.g. "2026-11-27 1432 – Oyster_A4.pdf", so every draft is kept and nothing is overwritten.


    Luca sometimes sends drafts before the final, so every version is kept side by side, e.g. `2026-11-27 1432 – Oyster_A4.pdf`. SharePoint's **Create file** fails if a file with the same name already exists, so the date-and-time prefix also stops the flow erroring on a second version.

22. **Mark the activity as having artwork.** After the loop, add a **Condition**: **fx** `and(not(empty(outputs('Folder_URL'))), empty(body('Get_item')?['LinkedArtworkFolderURL']))` **is equal to** **fx** `true`.
    - **In "True",** add **Update item**:
      - **Id:** **fx** `variables('ActivityID')`
      - **Title:** **fx** `body('Get_item')?['Title']`
      - **LinkedArtworkFolderURL:** **fx** `outputs('Folder_URL')`
    - **If Update item doesn't offer LinkedArtworkFolderURL** (it's a Hyperlink column), use **Send an HTTP request to SharePoint** instead:
      - **Method:** `POST`
      - **Uri:** `_api/web/lists/getbytitle('Marketing & Activations 2026')/items(` + **fx** `variables('ActivityID')` + `)/ValidateUpdateListItem`
      - **Body:** `{"formValues":[{"FieldName":"LinkedArtworkFolderURL","FieldValue":"` + **fx** `outputs('Folder_URL')` + `, Artwork"}]}`
23. **Post a note on the activity.** Add **Create item** (SharePoint), with **List Name** `Activity Comments`:
    - **Title:** **fx** `substring(concat(body('Get_item')?['Title'], '                                                  '), 0, 50)`
    - **Comment:** **fx** `concat('Artwork received from Luca, saved to ', outputs('Save_to'), if(startsWith(outputs('Folder_path'),'/Shared Documents'), '', '. The Job Folder is missing, so please link it on the activity.'))`
    - **CampaignId:** **fx** `variables('ActivityID')`
    - **Recipient:** `Kim`
24. Select **Save**.

---

## Test it

1. **Flow A, new GDR:** submit a test GDR in Jotform. Within a few minutes it appears in the OS under **Submissions** with its **A-number** and **GDR #…**. The venue and title should be right, the GDR dates should show in the Design section, and the requester should show as "Submitted by".
2. **Flow A, no duplicates:** edit that submission in Jotform so it sends a new email, or re-run the flow from **My flows → Flow A → the run → Resubmit**. The same activity is updated, and no second one appears.
3. **Approve it** in the OS. The design ticket's due date is the form's Final Version date.
4. **Request artwork:** select **✉ Request artwork**. The email to Luca has `[A-…] GDR #…` in the subject and both dates in the body.
5. **Flow B, matched:** have Luca reply to the original Jotform email with a PDF attached. The PDF lands in that activity's Job Folder, a note appears in its Discussion, and the activity shows **Artwork received**.
6. **Venue codes:** submit test GDRs with venue **TLB**, then **HD**. They arrive as The Left Bank and Hotel Darwin. Submit one with a placeholder code (e.g. **RC**). It arrives with no venue, and its description starts "⚠ Venue code 'RC' not recognised, set the venue." (plus the email, if you added it).
7. **Signature and drafts:** have Luca reply with a draft PDF, then the final PDF with the **same file name**. Both are in the Job Folder, as `2026-… – name.pdf` with different times, and his signature logo isn't saved.
8. **Flow B, unmatched:** have Luca send a brand-new email with an attachment and no GDR subject. The file lands in `GDR Inbox/Unmatched`, and you get the "Unmatched GDR artwork" email.

**To see what a step produced,** open **My flows → the flow → a run** and select any Compose step. Its **Outputs** show exactly what the formula found.

### The sample these formulas were tested on

Every formula above was run against this Jotform-style email before being written here. Your email's code should look similar under **View message source**:

```html
<tr id="row_5" class="questionRow"><td class="questionColumn"><label>Venue</label></td><td class="valueColumn" id="value_5"><div style="color:#333">Whitford&#039;s Brewing Co</div></td></tr>
<tr id="row_6" class="questionRow"><td class="questionColumn"><label>Project Title</label></td><td id="value_6" class="valueColumn">Oyster Sundays &amp; Bubbles</td></tr>
<tr id="row_55" class="questionRow"><td class="questionColumn"><label>Person Requesting</label></td><td id="value_55" class="valueColumn"><span>Sam&nbsp;Taylor</span></td></tr>
<tr id="row_4" class="questionRow"><td class="questionColumn"><label>Email</label></td><td id="value_4" class="valueColumn"><a href="mailto:sam.taylor@marlingroup.com.au">sam.taylor@marlingroup.com.au</a></td></tr>
<tr id="row_8" class="questionRow"><td class="questionColumn"><label>Details</label></td><td id="value_8" class="valueColumn"><div>$2 oysters every Sunday in December.<br>Need A4 poster, 3 TV screens &amp; Instagram tiles.<br/>Use the new WBC logo.</div></td></tr>
<tr id="row_14" class="questionRow"><td class="questionColumn"><label>First Draft</label></td><td id="value_14" class="valueColumn">01-12-2026</td></tr>
<a href="https://aus01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fwww.jotform.com%2Fedit%2F6012345678901234567%3FsubmissionId%3D6012345678901234567&amp;data=05%7C02%7C...">Edit this submission</a>
```

Results from that sample:

| Step | Result |
|---|---|
| `Submission_ID` | `6012345678901234567` |
| `Venue_code` | `WBC` |
| `Project_Title` | `Oyster Sundays & Bubbles` |
| `Requester` | `Sam Taylor` |
| `Requester_Email` | `sam.taylor@marlingroup.com.au` |
| `First_Draft_raw` | `01-12-2026` |
| `Final_Version_raw` | `04-12-2026` |
| `Expected_Delivery_raw` | `07-12-2026` |
| `First_Draft_date` | `2026-12-01` |
| `Final_Version_date` | `2026-12-04` |
| `Expected_Delivery_date` | `2026-12-07` |
| `Start_date` | `2026-12-07` |
| `Venue` | `Whitfords Brewing Co` |
| `Venue_flag` | *(empty)* |
| `Description` | `$2 oysters every Sunday in December.⏎Need A4 poster, 3 TV screens & Instagram tiles.⏎Use the new WBC logo.⏎⏎Headline: Shuck Yeah Sundays⏎Book at wbc.com.au⏎⏎Venue code on form: WBC⏎First draft: 01-12-2026 · Final version: 04-12-2026 · Expected delivery: 07-12-2026⏎Jotform submission: 6012345678901234567⏎⏎Submitted by: Sam Taylor (sam.taylor@marlingroup.com.au)` |
| `Reply_ID_from_link`  (Flow B: Luca replies "RE: GDR - WBC - Oyster Sundays & Bubbles", received 2:32pm Perth) | `6012345678901234567` |
| `Reply_ID_from_text`  (Flow B: Luca replies "RE: GDR - WBC - Oyster Sundays & Bubbles", received 2:32pm Perth) | *(empty)* |
| `A_number`  (Flow B: Luca replies "RE: GDR - WBC - Oyster Sundays & Bubbles", received 2:32pm Perth) | *(empty)* |
| `Subject_venue`  (Flow B: Luca replies "RE: GDR - WBC - Oyster Sundays & Bubbles", received 2:32pm Perth) | `WBC` |
| `Subject_title`  (Flow B: Luca replies "RE: GDR - WBC - Oyster Sundays & Bubbles", received 2:32pm Perth) | `Oyster Sundays & Bubbles` |
| `File_name`  (Flow B: Luca replies "RE: GDR - WBC - Oyster Sundays & Bubbles", received 2:32pm Perth) | `2026-11-27 1432 – Oyster_A4.pdf` |
| `Folder_path`  (Flow B: Luca replies "RE: GDR - WBC - Oyster Sundays & Bubbles", received 2:32pm Perth) | `/Shared Documents/00. Marketing OS Files/00. Marketing Activities/WBC_DEC26_OYSTER_SUNDAYS` |

With a placeholder or unknown code (e.g. `RC`), `Venue` is *(empty)*, and `Venue_flag` is `⚠ Venue code 'RC' not recognised, set the venue.`. A missing date gives *(blank)*, so SharePoint leaves the column empty.

## If something goes wrong

| What you see | Likely cause | What to do |
|---|---|---|
| Flow A never runs | The From or Subject Filter doesn't match | Check the GDR email's sender is exactly `noreply@formresponse.com` and the subject starts `GDR -`. Clear the Subject Filter to test. |
| Flow A stops at step 8 (Cancelled) | No "Edit this submission" link was found | Make sure the Jotform notification includes the edit link: Jotform → Settings → Emails → Notification → **Edit Email**, and add the **Edit Link** tag if it's missing |
| A Compose comes out blank | That field was empty, or the cell ID differs | Check **View message source** for `id="value_…"`, and change the number in that formula |
| Activity arrives with no venue, and the description starts "⚠ Venue code '…' not recognised" | That code isn't in `VenueMap`, or it's one of the placeholders (RC, BV, HME) | Add or fill in the code in step 24 (one line), then set the venue on the activity by hand this time |
| Create item fails with "Venue is required" when the code isn't recognised | The Venue column is set as required in SharePoint | In step 25, change the final `''` to `'All Venues'`. The warning line still appears, so you know to fix it. |
| Create item fails on Venue for NBC | Northbridge Brewing Co isn't a Venue choice yet | Add it to the Venue column's choices (step 24), or set NBC to `""` |
| Create item fails on Start, End or the GDR dates | A date isn't dd-MM-yyyy | Look at the `_raw` step's output. If Jotform sends e.g. `2026-12-01`, swap the order in the date formula: use `[0]`, `[1]`, `[2]` instead of `[2]`, `[1]`, `[0]`. |
| Create item fails on Venue, WorkflowStage or Status | A value isn't one of the column's choices | Use **Enter custom value** and the exact spelling shown in this guide |
| Two activities for one GDR | Flow A ran before the Jotform Submission ID column existed | Create the column (Before you start, step 1), delete the duplicate, and re-run |
| Luca's files land in GDR Inbox/A-1234 | The activity has no Job Folder yet, or it's a sharing link | Approve the activity, or use **Create folder / Link** on the activity page, then move the files across |
| Luca's files land in GDR Inbox/Unmatched | His email had no quoted Jotform email, no `[A-…]` and no `GDR -` subject | Ask him to reply to the GDR or Request artwork email. Move the files by hand this time. |
| Luca's signature logo got saved | It wasn't sent as an inline image and is over 20KB | Raise `20000` in step 20 to e.g. `60000` |
| A draft seems to have replaced the final | It can't: each file is saved with its received date and time in front | Look for both `2026-… – name` files in the folder. The latest time is the newest. |
| Create file fails with "already exists" | Two emails with the same file name arrived in the same minute | Rare. Re-run that flow run from its run history, a minute later. |

## Permissions and licences

- **Power Automate:** both flows use Office 365 Outlook, SharePoint, Content Conversion and Variables. These are all **standard** connectors, so a normal Microsoft 365 business licence is enough. No admin consent is needed.
- **Your account:** needs **Edit** on the Marketing site (the Activities list, Activity Comments and Documents). It reads your own inbox, which is where the Jotform emails and Luca's replies arrive.
- **Keep it running:** in each flow, select **Edit** next to **Owners** and add a second person. If your account changes, the flows keep working.
- **Jotform:** nothing to set up. These flows read the response emails you already receive. Keep the **Edit Link** in the notification email (see "If something goes wrong"). The subject should start with `GDR -` and read `GDR - {Venue} - {Project Title}`, because Flow B's subject fallback depends on that order.
