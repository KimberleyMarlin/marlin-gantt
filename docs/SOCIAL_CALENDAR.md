# Social Calendar

**Status:** Built 18 November 2026. Social Posts list wired in (`LIST_IDS.socialPosts`). Reels and automatic publishing added 19 November 2026; automatic publishing is switched off (`SOCIAL_AUTOPUBLISH_READY = false`) until the Meta setup below is done.

The Social page plans Facebook, Instagram and Google posts from Activities. The flow is:

1. **Suggest.** For each upcoming Activity with no posts yet, *Suggest posts* drafts one post per step of the posting rhythm below. Captions are built from the Activity's own copy fields (title, key message, tagline, description, call to action, ticket or booking link), and the image is the Activity's featured photo.
2. **Edit and approve.** Anyone who can edit Activities can edit drafts. Approvers (the `admin` role, i.e. marketing) approve or send a post back with a note. Nothing can be approved for Instagram without an image. Editing an approved post sends it back for approval.
3. **Publish**, one of two ways, chosen per post in *Edit* ("How it's published"):
   - **By hand in Business Suite** (the default). On an approved post, *Copy caption*, *Download image* or *Save video to phone*, *Open in Business Suite*, schedule it there, then *Mark scheduled*. After it goes out, *Mark posted*.
   - **Automatically.** Once approved, the Social publish job posts it to Facebook and Instagram at the publish time and marks it *Posted* with links to the live posts. If something goes wrong it's marked *Failed* with Meta's reason, and *Try again* or *Post by hand instead*.
4. **Results.** For automatically published posts, reach, views, likes, comments, shares and saves are read back every 6 hours for 30 days and shown on the post.

Venue managers see their own venue's posts, read-only.

The OS itself never holds a Meta token: it is a public static page. Automatic publishing is done by a scheduled GitHub Action that holds the token as a secret (see *Automatic publishing*).

## Reels

The *Reels* tab lists the videos in the Reels folder on the Marlin Hospitality Marketing site (and one level of subfolders, shown as groups), newest first, with length, size and a 9:16 check. The folder is found from its SharePoint sharing link, `REELS_SHARE_LINK` in `index.html` (Share → Copy link on the folder), so it works wherever the folder sits. If the link stops resolving, `REELS_FOLDER_PATH` (`00 OS/Reels`) is tried in each library on the site. If neither works, the tab says so and what to check.

- **Save to phone** gets the original file, not SharePoint's compressed preview. On an iPhone it's two taps: the first downloads the original (with progress), the second opens the share sheet, where *Save Video* puts it in Photos at full quality. iOS only allows the share sheet straight from a tap, hence the two steps. On a computer it simply downloads. Files over about 600 MB are downloaded in the browser instead, and are better done on a computer.
- **Attach to a post** adds the video to an upcoming post (a feed post becomes a reel), or starts a new reel post for a venue and date. From a post's *Edit*, *Choose from Reels* does the same the other way round.
- Instagram and Facebook recompress every upload. Starting from the original gives them the best copy to work from.

## Create the Social Posts list

On the Marlin Hospitality Marketing SharePoint site, create a list called **Social Posts** with these columns. The column names must match exactly (internal names, no spaces).

| Column | Type | Notes |
|---|---|---|
| `Title` | Single line of text | Built automatically: activity title and step |
| `ActivityId` | Single line of text | The Activity's list item ID |
| `Venue` | Single line of text | Copied from the Activity |
| `Platforms` | Single line of text | `Facebook;Instagram;Google`, semicolon-separated |
| `PostType` | Choice: Feed, Story, Reel | |
| `Step` | Single line of text | `announce`, `tickets`, `reminder`, `lastchance`, `onday`, `launch`, `midrun`, `weekly1`–`weekly3`, `final`, `update` |
| `PublishAt` | Date and time (include time) | |
| `SourceDate` | Single line of text | The date the rhythm gave this step when it was drafted (`YYYY-MM-DD`). Used to spot Activity date changes. |
| `ActivityDate` | Single line of text | The Activity's start date when the post was drafted (`YYYY-MM-DD`). Flags captions that still mention an old date. |
| `Caption` | Multiple lines of text (plain text) | |
| `ImageRef` | Single line of text | Same `{driveId,itemId}` format as the Activity's `EventImageRef` |
| `Status` | Choice: Draft, Approved, Scheduled, Posted, Rejected | Default: Draft |
| `CaptionEdited` | Yes/No | Set when someone changes the suggested caption |
| `ApprovedBy` | Single line of text | |
| `ApprovedAt` | Date and time | |
| `Notes` | Multiple lines of text (plain text) | The note when a post is sent back |
| `ExternalPostId` | Single line of text | Written by the publish job: the Facebook and Instagram post IDs (JSON). Lets *Try again* skip a platform that already posted. |
| `VideoRef` | Single line of text | The attached reel, same `{driveId,itemId}` format as `ImageRef` |
| `PublishMode` | Choice: Manual, Auto | Default: Manual |
| `PublishedAt` | Date and time | Written by the publish job |
| `PostUrl` | Single line of text | Links to the live posts (JSON), written by the publish job |
| `Insights` | Multiple lines of text (plain text) | Results (JSON), written by the publish job |

`Status` also needs the choices **Publishing** and **Failed** (used by automatic publishing).

Then copy the list's ID (List settings: the `List=` part of the address, without the braces) into `LIST_IDS.socialPosts` in `index.html`.

## Where posts go

The OS doesn't publish. Business Suite posts to whichever Page and Instagram account is selected in it. To make that hard to get wrong, every post shows a **Posts to** line, and approved posts have **Open in Business Suite**, which opens the composer on that venue's Page (`?asset_id=<Page ID>`).

Both come from `SOCIAL_ACCOUNTS` in `index.html`: one entry per venue, plus `All Venues` for group-wide posts, each with the Page name, Page ID and Instagram handle. These are public details (each Page's About tab), so they live in the code, not in GitHub secrets. The `META_ACCOUNTS` secret used by the Meta reporting sync holds ad account IDs, which are different, and the OS can't read secrets anyway.

Find them in Business Suite → Settings → Accounts → Pages (name and Page ID) and Accounts → Instagram accounts (handle and linked Page). Until a venue is filled in, its posts warn to check the selected account in Business Suite by hand.

## Automatic publishing

`.github/workflows/social-publish.yml` runs `scripts/social-publish.mjs` every 15 minutes (GitHub can start it a few minutes late). Each run:

1. Publishes Approved posts with `PublishMode = Auto` whose time has come (up to 10 a run), to the Page in `SOCIAL_ACCOUNTS` for the post's venue and that Page's linked Instagram account. Photos post as feed photos, videos as reels, and stories as photo or video stories. Meta downloads the media straight from SharePoint through a short-lived link, so nothing is made public. Google Business Profile isn't supported and is noted on the post.
2. Marks a post *Failed* if it has been stuck in *Publishing* for 30 minutes (an interrupted run), rather than risk posting it twice.
3. Refreshes results on posts published in the last 30 days, every 6 hours.

It costs nothing: GitHub Actions is free for this public repository, and Meta's API and SharePoint are already paid for. The Action logs are public, so the script only logs counts, row numbers and Meta's error messages, never captions or tokens. GitHub pauses scheduled workflows in a public repository after 60 days with no commits, which the OS's normal activity prevents.

### Setup (once)

1. **Page IDs.** Fill in `SOCIAL_ACCOUNTS` in `index.html` for every venue and for `All Venues`.
2. **Meta publishing token.** In Business Settings → Users → System users, use the existing System User or add one for publishing. *Assign assets*: every venue Page (full control, or at least content and insights) and each linked Instagram account. *Generate new token* for the Marlin app with `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `read_insights` (and `business_management` if Meta asks). Keep it separate from the read-only reporting token. Save it as the GitHub secret **`META_PUBLISH_TOKEN`**. Because the app only publishes to Marlin's own Pages, Meta App Review shouldn't be needed, but Meta may ask for Business Verification.
3. **SharePoint access.** The job uses the same Entra app as the Meta reporting sync (`MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, with `Sites.Selected` write on the Marketing site). If those secrets aren't in the repository yet, add them.
4. **Columns.** Add the new Social Posts columns and Status choices listed above.
5. **Test.** Actions → Social publish → *Run workflow*. The log should say how many posts it published. Then set one post to *Automatically*, approve it for a few minutes from now on a low-stakes Page, and check it goes out.
6. **Switch it on in the OS.** Set `SOCIAL_AUTOPUBLISH_READY = true` in `index.html`. Until then the OS doesn't offer *Automatically*, so nothing is queued for a job that can't run.

## Default posting rhythm

One post per Activity per day. Steps whose date has already passed are skipped. "Marketing start" falls back to 21 days before the start date when it isn't set.

| Activity type | Posts |
|---|---|
| Event, ticketed | Announcement at marketing start (feed) · tickets on sale at the ticket launch date, if set (feed) · reminder 7 days before (feed) · last chance 1 day before (story) · on the day (story) |
| Event, walk-in or untyped | Announcement at marketing start (feed) · reminder 2 days before (feed) · on the day (story) |
| Event, recurring | Announcement (feed) · on the day of the next occurrence (story) |
| Promotion / Offer | Launch on the start date (feed) · mid-run reminder if it runs 14 days or more (feed) · last chance 2 days before the end (story) |
| Campaign | Launch at marketing start or start (feed) · weekly reminders for up to 3 weeks (story) · final push 2 days before the end (feed) |
| Maintenance / Update | One update on the start date (feed), also to Google |

Default platforms are Facebook and Instagram, plus Google for Maintenance / Update. Default times are 11:30 for feed posts and 16:00 for stories. All of these are in `socialRhythm()` and `SOCIAL_DEFAULT_TIME`.

## Flags on a post

- **Needs an image for Instagram:** no featured photo on the Activity. Approval is blocked until there is one, or Instagram is removed.
- **Activity dates changed:** the Activity's dates moved since the post was drafted, so this step belongs on a different day. *Move to new date* moves it, rewrites the caption if nobody has edited it, and sends an approved post back for approval.
- **Activity now starts on a different date:** the post's own day is unchanged (for example an announcement at marketing start) but its caption mentions the old date. *Refresh caption* rewrites a caption nobody has edited; an edited caption needs checking by hand.
- **Activity cancelled or archived.**
- **Publish time has passed:** a draft or approved post whose time has gone by.

## Still to decide

- Who approves per venue (currently marketing approves all).
- Whether to keep the default rhythm per Activity type.
- Platforms per venue (currently Facebook and Instagram for all).
- Automated publishing (direct Meta or a scheduler), later.
