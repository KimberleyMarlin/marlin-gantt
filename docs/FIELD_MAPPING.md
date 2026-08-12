# Marlin Hub field mapping audit

Updated: 2026-08-12, v16 working copy.

This audit covers the Activity submission form in `index.html`, the `Marketing & Activations 2026` list payload, and the fields read back into the Hub. SharePoint internal names remain authoritative.

## Core activity mapping

| Form value | SharePoint internal field | Loaded back into Hub | Conditional rule |
|---|---|---|---|
| Title | `Title` | `title` | Always required |
| Venue | `Venue` | `venue` | Always required |
| Start Date | `Start` | `start` | Always required |
| End Date | `End` | `end` | Optional, must not precede Start |
| Activity Type | `ActivityType` | `activityType` | Always required |
| Event Format | `EventFormat` | `eventFormat` | Event only |
| Marketing Funnel | `BusinessStream` | `businessStream` | Optional |
| Details | `Description` | `description` | Optional, submitter appended |
| Submitted By | `Assignee` | `owner` | Signed-in user |
| Initial workflow | `WorkflowStage` | `stage` | Always `Intake` on create |
| Initial status | `Status` | `status` | Always `Active` on create |

## Conditional mapping

| Trigger | Fields written | Loaded back into Hub | v14 result |
|---|---|---|---|
| Ticketed Event | `TicketedEvent`, `TicketPlatform`, `TicketPrice`, `Capacity`, `TicketURL` | `ticketed`, `ticketPlatform`, `ticketPrice`, `capacity`, `ticketUrl` | Added missing submission inputs and mapping |
| Loaded Rewards | `Brand`, `BusinessStream`, optional `LoadedRewards` / `IsLoaded` flag, `AppRequired`, `NewsletterRequired`, `AppHeading`, `AppShortDescription`, `AppDescription`, `BookingURL`, `LoadedBasePrice` | `loadedRewards` plus corresponding Loaded fields | Membership is recognised from the dedicated flag, Primary Brand, Marketing Funnel or Loaded department, so a supplier brand does not exclude a real Loaded activity |
| POS required | `POSUpdateRequired`, `PosStatus`; update notes are stored in a tagged section of `Description` until a confirmed `POSNotes` column exists | `posRequired`, `posStatus`, `posNotes` | Checkbox reveals Updates Required only when selected; activity-detail saves are scoped to the visible record |
| Marketing support | `Channels`, `GoogleAdsEligible` | `channels`, `googleAdsEligible` | Section hidden until selected, read mapping added |
| Artwork/design required | `AssetsNeeded`, `AssetTVsDetail`, `AssetNewsletterDetail`, `DesignStatus` | `assetsNeeded`, asset details, `designStatus` | Section hidden until selected, missing detail inputs and read mapping added |

## Confirmed defects found in the audit

1. `Channels` and `AssetsNeeded` were submitted but never read back, so they could not drive later workflow. v14 reads them.
2. `TicketPlatform`, `TicketPrice`, `Capacity`, and `TicketURL` were read but could not be entered in Activity submission. v14 adds a ticketed-only section.
3. JavaScript referenced `fAssetTVsDetail` and `fAssetNewsletterDetail`, but those inputs did not exist. v14 adds them and reveals them only for the matching selected asset.
4. The form did not reject an End Date before Start Date. v14 validates both Activity and Key Date ranges.
5. Key Dates silently ignored a selected End Date if the Calendar Reference list did not contain a matching End Date column. v14 stops with a specific schema error instead of converting a multi-day date into a one-day date.
6. Loaded-only filtering incorrectly depended only on Primary Brand = Loaded Rewards. v16 also recognises the Loaded flag, Marketing Funnel and department, preserving supplier brands such as Brown Forman.
7. Activity-detail saves gathered fields from hidden and visible activity views together, and `POSNotes` could be silently skipped because the SharePoint column is unconfirmed. v16 scopes saves to the visible activity and stores POS notes reliably in a tagged Description section.

## Still requiring a live SharePoint schema check

The Hub retries activity creation after removing optional fields that SharePoint rejects. That prevents a whole submission failing, but it does not prove every optional column exists. The next authenticated test should submit one controlled record containing every conditional section, note any fields the success message says were skipped, and compare those names with the list column output.
