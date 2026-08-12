# Marlin Hospitality OS — Decision Log

## The live Hub is the authoritative surface

**Confirmed:** 12 August 2026

The deployed `index.html` in `KimberleyMarlin/marlin-gantt` is the authoritative Marketing OS for head office and venue staff. Role-based access is used to simplify and restrict the interface for different users.

The earlier proposal for a separate `marlin-venue-portal.html` is superseded. No such file exists in the live repository, and maintaining a second interface against the same SharePoint lists would recreate field-mapping and version drift.

## Claude fixes reconciled into v12

The 10 August `marlin-os-v2.html` handoff was compared against the deployed v11 Hub rather than used as a replacement. The files had diverged significantly.

- The missing closing tags around the Job form were already fixed in v11. Parser verification found all 24 live panels at the correct level and no panels trapped inside `submitFormJob`.
- Calendar month already excluded archived items in v11.
- Job submissions still discarded Venue because `My Tasks` has no Venue column. v12 preserves it in Notes until the list schema is corrected.
- Financial role-gating was tightened across activity details, Dashboard results and charts, Ticketing, and post-campaign reporting.
- The New Conversation dialog now uses the searchable Microsoft 365 people picker.

## Access resolution

The Hub fails closed to `general` when it cannot match a signed-in user to an access role. v12 resolves known staff using exact authenticated Microsoft 365 identity details before falling back to job-title keywords. The resolved Hub role is displayed beside the signed-in user's name.

Luca Brignoli is mapped to the `design` role. The previous Limited Access screen was caused by a mismatch between his real Microsoft sign-in identity and the guessed email alias in the old role map.

