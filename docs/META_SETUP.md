# Meta ads into the Marketing OS

**Owner:** Kim · **Written:** 17 Nov 2026 · **Workstream:** P03

A daily Power Automate flow asks Meta for yesterday's (and the two days before's) campaign numbers and saves them as a CSV in SharePoint. The OS reads that folder and shows the results:

- **Marketing Report → Meta ads:** spend, impressions, link clicks, click-through rate and cost per click, by venue and by campaign.
- **Each activity:** a "Meta ads" block with the totals for the campaigns matched to it.

Spend and cost per click only show for roles with budget access. The Meta token lives only in the flow, never in the OS.

Done already: **step 1** (Business Manager admin) and **step 2** (Meta app).

---

## Step 3: system user and access token

A system user is a "robot" login that belongs to the business, not to a person. Its token doesn't stop working when someone leaves or changes their password.

1. Go to **business.facebook.com/settings**.
2. **Users → System users → Add.** Name: `Marlin OS Reporting`. Role: **Employee** (it only needs to read).
3. With the system user selected, click **Assign assets**:
   - **Ad accounts:** tick every venue ad account, permission **View performance**.
   - **Pages:** tick every venue Facebook Page, permission **View Page performance** (for organic stats later).
   - **Apps:** tick the app you made in step 2. If asked, give it **Develop app** (needed to generate a token).
4. In your app at **developers.facebook.com → your app → Add product**, add **Marketing API** if it isn't there already.
5. Back on the system user, click **Generate new token**:
   - **App:** your app
   - **Token expiration:** **Never**
   - **Permissions:** `ads_read`, `read_insights`, `business_management`, and for later organic stats `pages_read_engagement`, `pages_show_list`, `instagram_basic`, `instagram_manage_insights`
6. **Copy the token now.** Meta shows it once. Paste it straight into the flow (step 6, action 2) or a password manager.
   - Don't email it, paste it into Teams or a chat, or send it to Claude. Anyone with it can read your ad accounts.
   - If it leaks: system user → **Revoke tokens**, then generate a new one.

**Quick test:** in a browser, open
`https://graph.facebook.com/v24.0/me/adaccounts?fields=name,account_id&access_token=PASTE_TOKEN`
You should see your venue ad accounts listed. Close the tab afterwards, since the address bar now holds the token.

---

## Step 4: the account IDs

**Ad accounts:** Business settings → **Accounts → Ad accounts**. Each one shows an ID such as `1234567890`. The flow needs them as `act_1234567890`. Write down one line per venue, for example:

| Venue | Ad account name | ID for the flow |
|---|---|---|
| Whitfords Brewing Co | WBC Ads | act_1234567890 |
| The Left Bank | TLB Ads | act_… |
| … | | |

**Pages** (for organic stats later): Business settings → **Accounts → Pages**, same idea. The Instagram IDs are looked up from each Page automatically.

These IDs aren't secret, so you can send me the list if you want it checked. Send the IDs only, never the token.

If one ad account runs ads for several venues, that's fine: the venue code at the start of each campaign name (step 5) decides the venue. If each venue has its own account, the OS also falls back to the account name.

---

## Step 5: campaign naming rule

From now on, name every Meta campaign:

```
CODE | Activity name | MonYY
```

- **CODE:** `WBC` Whitfords · `TLB` The Left Bank · `RAV` The Ravenswood · `HD` Hotel Darwin · `MB` Mustang Bar · `NBC` Northbridge Brewing Co
- **Activity name:** the activity's title as it appears in the OS. Shorter is fine as long as it's part of the title: "Trivia" matches "Trivia Night".
- **MonYY:** the month it runs, e.g. `Nov26`. This is for people; the OS matches on dates.

Examples: `WBC | Trivia Night | Nov26` · `TLB | Melbourne Cup Lunch | Nov26` · `RAV | Loaded Double Points | Dec26`

The OS links a campaign to an activity when the venue matches, the name matches the title, and the campaign ran between 60 days before the activity and 7 days after it ended. Campaigns that don't follow the rule still count in the venue totals (by account name) and show as "Not matched" in the campaign list.

**Existing campaigns:** renaming a Meta campaign doesn't reset its learning or delivery, so it's safe to rename live ones to the rule.

---

## Step 6: the Power Automate flow

Needs a **Power Automate premium** licence on the account that owns the flow, because the HTTP action is premium. The same licence covers the Google reviews flow later.

At **make.powerautomate.com → + Create → Scheduled cloud flow**:

- **Name:** `Meta ads to OS`
- **Starting:** tomorrow · **Repeat every:** 1 Day
- Then, in the trigger: **Time zone** (UTC+08:00) Perth · **At these hours** `6`

Add these actions in order.

**1. Initialize variable**
- Name `AdAccounts` · Type **Array**
- Value: your IDs from step 4, e.g. `["act_1234567890","act_2345678901"]`

**2. Initialize variable**
- Name `Token` · Type **String** · Value: the token from step 3
- Then **⋯ → Settings → Secure inputs: On, Secure outputs: On**. This hides the token in the flow's run history.

**3. Initialize variable**
- Name `Rows` · Type **Array** · Value: `[]`

**4. Apply to each**, over `AdAccounts`. Inside it:

**4a. HTTP** (premium)
- Method: **GET**
- URI (one line):
  ```
  https://graph.facebook.com/v24.0/@{items('Apply_to_each')}/insights?level=campaign&fields=account_id,account_name,campaign_id,campaign_name,spend,impressions,reach,clicks,inline_link_clicks&time_increment=1&date_preset=last_3d&limit=500
  ```
- Headers: `Authorization` = `Bearer @{variables('Token')}`
- **⋯ → Settings → Secure inputs: On**

  If Meta says the version is retired, change `v24.0` to the latest version listed at developers.facebook.com/docs/graph-api/changelog.

**4b. Select**
- From: `@{body('HTTP')?['data']}` (Expression tab: `body('HTTP')?['data']`)
- Map: switch to text mode and paste:
  ```
  {
    "date": "@{item()?['date_start']}",
    "account_id": "@{item()?['account_id']}",
    "account_name": "@{item()?['account_name']}",
    "campaign_id": "@{item()?['campaign_id']}",
    "campaign_name": "@{item()?['campaign_name']}",
    "spend": "@{item()?['spend']}",
    "impressions": "@{item()?['impressions']}",
    "reach": "@{item()?['reach']}",
    "clicks": "@{item()?['clicks']}",
    "link_clicks": "@{item()?['inline_link_clicks']}"
  }
  ```

**4c. Apply to each** (a second, inner loop) over **Output** of Select, containing:
- **Append to array variable:** Name `Rows`, Value `Current item`

**5. Create CSV table** (outside the loops)
- From: `variables('Rows')` · Columns: Automatic

**6. Create file** (SharePoint)
- Site Address: Marlin Hospitality Marketing
- Folder Path: `/Shared Documents/WORKING_Marketing Dashboard/Meta Imports` (create the folder first)
- File Name: `meta-ads-@{formatDateTime(utcNow(),'yyyy-MM-dd')}.csv`
- File Content: **Output** of Create CSV table

**7. Failure email.** Add **Send an email (V2)** to yourself, subject `Meta ads flow failed`. On it: **⋯ → Configure run after → tick "has failed"** (untick "is successful"), and attach it after step 6.

**Why `last_3d`:** Meta keeps adjusting the last couple of days' numbers. Each run re-fetches them, and the OS keeps the newest file's figures for any day it has seen twice.

### Fill in history (once)

After the first successful run:
1. Edit the HTTP URI: change `date_preset=last_3d` to `date_preset=last_90d`.
2. Run the flow once with **Test → Manually**.
3. Change it back to `last_3d` and **Save**.

The OS then shows the last 90 days straight away.

### Check it worked

1. A file `meta-ads-2026-11-…csv` appears in **Meta Imports**.
2. In the OS: **Marketing Report → Refresh**. The **Meta ads** section shows spend and impressions by venue.
3. Open an activity whose campaign follows the naming rule: it shows a **Meta ads** block.

If the Meta section later says "Meta data has stopped updating", open the flow's run history. The usual causes are a revoked token or a retired API version.

---

## Later: organic Facebook and Instagram

The same pattern, as a second flow (or extra actions in this one) writing `meta-organic-YYYY-MM-DD.csv`. It covers followers, reach and engagement per Page and Instagram account. Meta has been retiring some Page metrics, so we'll pick the exact fields when we build it, once the ads flow is running.
