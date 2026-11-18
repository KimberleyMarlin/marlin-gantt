# Social Calendar

**Status:** Built 18 November 2026 (option 1: approve in the OS, schedule in Meta Business Suite). Social Posts list created and wired in (`LIST_IDS.socialPosts`, 18 November 2026).

The Social page plans Facebook, Instagram and Google posts from Activities. The flow is:

1. **Suggest.** For each upcoming Activity with no posts yet, *Suggest posts* drafts one post per step of the posting rhythm below. Captions are built from the Activity's own copy fields (title, key message, tagline, description, call to action, ticket or booking link), and the image is the Activity's featured photo.
2. **Edit and approve.** Anyone who can edit Activities can edit drafts. Approvers (the `admin` role, i.e. marketing) approve or send a post back with a note. Nothing can be approved for Instagram without an image. Editing an approved post sends it back for approval.
3. **Schedule.** On an approved post, *Copy caption* and *Download image*, schedule it in Meta Business Suite, then *Mark scheduled*. After it goes out, *Mark posted*.

Venue managers see their own venue's posts, read-only.

Nothing is published from the OS. It is a public static page, so it can't hold a publishing token. Because every post is a row in the list, a later sync job (direct Meta publishing or a scheduler such as Postiz) can pick up Approved rows without changing this screen. Use the empty `ExternalPostId` column for that.

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
| `ExternalPostId` | Single line of text | Empty for now. For a future publishing sync. |

Then copy the list's ID (List settings: the `List=` part of the address, without the braces) into `LIST_IDS.socialPosts` in `index.html`.

## Where posts go

The OS doesn't publish. Business Suite posts to whichever Page and Instagram account is selected in it. To make that hard to get wrong, every post shows a **Posts to** line, and approved posts have **Open in Business Suite**, which opens the composer on that venue's Page (`?asset_id=<Page ID>`).

Both come from `SOCIAL_ACCOUNTS` in `index.html`: one entry per venue, plus `All Venues` for group-wide posts, each with the Page name, Page ID and Instagram handle. These are public details (each Page's About tab), so they live in the code, not in GitHub secrets. The `META_ACCOUNTS` secret used by the Meta reporting sync holds ad account IDs, which are different, and the OS can't read secrets anyway.

Find them in Business Suite → Settings → Accounts → Pages (name and Page ID) and Accounts → Instagram accounts (handle and linked Page). Until a venue is filled in, its posts warn to check the selected account in Business Suite by hand.

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
