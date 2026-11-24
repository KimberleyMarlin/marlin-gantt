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

## Navigation and shell follow the Marlin Hub design

**Confirmed:** 17 November 2026

**Decision:** Adopt the Marlin Hub design (31 Aug prototype) as the reference for the OS navigation and page shell. *(Its visual system, meaning colours and fonts, was superseded the same day by the Marlin Hospitality Design System; see the last entry below.)* Implemented under brief UX-03 (`docs/briefs/2026-11-17_UX-03_nav-and-shell_brief.md`).
**Status:** Brief written. Not yet built.

**Problem:** The live nav has 26 items. Several are views of something else, and admin and parked screens sit alongside daily work. Kim wants the OS to feel and navigate like the Marlin Hub design.

**Chosen approach:**
1. **My Work is the home page** (as it has been since #131) and the Dashboard folds into it. The design's "My Day" name isn't used. This replaces UX-02 PR-C (Dashboard trim).
2. **Contacts & Mailing is hidden from the nav.** Contacts are moving to Emma. The code is kept.
3. **Social is hidden** until it has real data.
4. **Personal Tasks moves to the account menu**, and becomes a filter inside My Work. Privacy is unchanged.
5. **Programs stays as a sidebar group** (Loaded Rewards, Ticketing, Specials). This replaces the register's idea of turning programs into Calendar filter chips.
6. Admin screens (Shared Work Setup, Admin & Schema, Appearance) move to the account menu. Oversight is renamed Operations Map; its content is unchanged.

**Reason:** These choices group the nav by what people are doing. They remove placeholder and parked screens from view, and answer "what needs me" on the first screen.

**Consequences:**
- The `OS_RESET_MASTER.md` section 3 target (six areas) is superseded by the design's five groups plus the Submit button and account menu.
- The design uses sample data. Screens that show information with no data behind it (Operations Map decisions, Artwork nomination stats) stay out of scope until a data check is done.

## Tasks and job tickets get an optional Source link

**Confirmed:** 17 November 2026

**Decision:** Add three optional columns (`SourceType`, `SourceUrl`, `SourceLabel`) to both the Tasks & Job Tickets list and the Personal list, so any task can link back to the email, Teams message, meeting or form it came from. Implemented under brief TASK-02 (`docs/briefs/2026-11-17_TASK-02_source-link_brief.md`).
**Status:** Brief written. Column names are proposed and still to be confirmed against the live schema (step 0).

**Problem:** Tasks created from emails lose their context. The only place to record a source was the free-text Notes field.

**Options considered:** (a) keep putting links in Notes; (b) a single Hyperlink column; (c) three plain columns: a type Choice, the URL as multi-line plain text, and a label.

**Chosen approach:** (c). The task stores a pointer only. The original message stays in Outlook, Teams or Jotform as the source of truth.

**Reason:** Outlook links are longer than single-line text's 255-character limit. Hyperlink columns have an awkward Graph write shape. A type field lets the UI show the right chip and filter later.

**Consequences:**
- Links into someone's own mailbox only open for that person, so shared tickets still need context in the description.
- `ItemID`-based links can break if an email is moved (tech debt: a future `SourceMessageId` column).
- This unlocks automated task creation from email later, which needs its own brief.

## The Hub design is for layout only; the design system governs the look

**Confirmed:** 17 November 2026

**Decision:** The Marlin Hub design (31 Aug) is the reference for **layout and navigation only**. Colour, type, shape, logos, icons and writing follow the Marlin Hospitality design system as the repo already applies it: `design-system/` plus `docs/DESIGN_SYSTEM.md`, adopted in #139 and #140 on 10 Nov.
**Status:** In effect.

**Problem:** The Hub design's palette (black sidebar, green accent, red, DM fonts) clashes with the brand. A Claude Project draft (`OS_UI_GUIDELINES.md`) proposed a second set of rules: separate CSS files, text-only sidebar. That would have competed with what the repo already does.

**Chosen approach:** One set of visual rules: the repo's `docs/DESIGN_SYSTEM.md` (inline tokens in `index.html`, the single-colour glyph set, the 10–14px app scale). `OS_UI_GUIDELINES.md` is withdrawn and isn't committed.

**Consequences:** Briefs point to `docs/DESIGN_SYSTEM.md` for anything visual. The design file's System tab is ignored.

## Keep Social visible; switch CRM writes off

**Confirmed:** 24 November 2026 (Kimberley)

**Decision 1, Social:** The Social page stays visible in the nav. The 17 Nov plan to hide it (UX-03 PR-2) is reversed, because the Social Calendar was built on 18–19 Nov and now runs on real data. `docs/HIDDEN_MODULES.md` is updated. UX-03 keeps Social under Programs.

**Decision 2, CRM writes:** `CRM_WRITE_ENABLED` is set to `false` in `index.html`. The OS no longer writes to the 8 old CRM SharePoint lists while contacts move to Emma (one sub-account per venue). Contacts & Mailing stays hidden and reads only.

**Status:** In effect.
