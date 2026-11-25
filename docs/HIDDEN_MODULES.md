# Hidden & Moved Modules Register

**Purpose:** a record of every screen taken out of the Marlin OS navigation, so that when it comes back it is **re-enabled from the existing code, not rebuilt from scratch**.

**Canonical location:** `KimberleyMarlin/marlin-gantt` → `docs/HIDDEN_MODULES.md`. Mirror: Claude Project 01 → `docs/HIDDEN_MODULES.md`.
**Last updated:** 18 Nov 2026 (checked against `main` @ `04c93cf`; nothing hidden in code yet)

---

## Rules for anyone working on the code (including Claude Code)

1. **Hide, never delete.** A hidden module keeps its panel, render functions, list IDs and styles in `index.html`. It's removed only from the nav, behind one central flag (e.g. a single `HIDDEN_PANELS` config). Don't scatter `display:none` or comment out code.
2. **Update this file in the same PR** that hides, moves or restores anything. Fill in the code anchors (function names, line numbers at that commit, commit SHA) from the real code. Don't guess them.
3. **Bringing something back starts here.** Read its entry, re-enable the existing panel, fix the listed known issues, then build on top of it. Only write new code where the entry says something was never built.
4. **Never rename a hidden module's SharePoint lists or columns.** Its code still points at them.
5. **Deleting code needs a logged decision** in `docs/DECISIONS.md`, with Kim's sign-off. When that happens, move the entry to "Removed for good" with the commit SHA of the last version that had the code.

---

## Status key

**Planned:** hidden in a brief, not yet done in code · **Hidden:** removed from nav in code · **Moved:** still visible, but somewhere else · **Restored:** back in the nav · **Removed:** code deleted (decision logged)

---

## Hidden modules

### Dashboard
| | |
|---|---|
| Panel | `overview` |
| Was in nav | Today → Dashboard |
| Status | **Planned** (UX-03 PR-4) |
| Why hidden | Folded into My Work (the home page since #131); it duplicated Calendar and other pages |
| Decision | `docs/DECISIONS.md` (17 Nov 2026: Navigation and shell follow the Marlin Hub design) |
| What exists in code | Dashboard panel and the Dashboard Widget Library (PR #85) |
| Data | Activities (`EVENTS`), Tasks & Job Tickets |
| Known issues | Some widgets show metrics with no stated basis (CAL-03) |
| Old links | Redirect to My Work |
| Bring back when | Not planned. Useful widgets move to My Work or other pages individually, reusing the existing widget code |
| Code anchors | *To be filled in by the PR that hides it* |

### Social
| | |
|---|---|
| Panel | `social` |
| Was in nav | Programs → Social |
| Status | **Visible, no longer planned for hiding** (decided 24 Nov 2026) |
| Why it stays | The Social Calendar was built on 18–19 Nov (#158, #160, #162, #165, #167, #168, #173): suggested posts from Activities, approval, Business Suite hand-off, Reels upload and Make a reel. It now has real data |
| Decision | `docs/DECISIONS.md` (24 Nov 2026: Keep Social visible) |
| Note for UX-03 | Keep Social in the nav under Programs. Ignore the earlier "hide Social" line in the UX-03 brief |

### Contacts & Mailing
| | |
|---|---|
| Panel | `crm` |
| Was in nav | Business → Contacts & Mailing |
| Status | **Planned** (UX-03 PR-2) |
| Why hidden | CRM is parked; contacts are moving to Emma |
| Decision | `docs/DECISIONS.md` (17 Nov 2026: Navigation and shell follow the Marlin Hub design); register D-2 |
| What exists in code | Screens reading and writing 8 CRM SharePoint lists |
| Data | 8 CRM lists (IDs in `LIST_IDS`) |
| Known issues | **`CRM_WRITE_ENABLED=true` since 10 Sept**, so live writes are on. Hiding the nav item doesn't stop writes from other paths: set the flag to `false` (D-2) |
| Bring back when | Only if a role for these lists remains after the Emma migration. More likely: replace with a link to Emma. Decide before reusing the code |
| Code anchors | *To be filled in* |

### Drive Search
| | |
|---|---|
| Panel | `drivesearch` |
| Was in nav | Plan → Drive Search |
| Status | **Planned** (UX-03 PR-2) |
| Why hidden | Parked: it's a second asset system alongside the SharePoint Digital Media library (canonical per the 15 Sept decision) |
| What exists in code | Google Drive search with Google Drive OAuth (PRs #55, #58) |
| Data | Google Drive API |
| Bring back when | Part of the central image library decision. Reuse the existing OAuth and search code if Drive stays in the picture |
| Code anchors | *To be filled in* |

### Photo Tagging
| | |
|---|---|
| Panel | `phototagging` |
| Was in nav | Plan → Photo Tagging |
| Status | **Planned** (UX-03 PR-2) |
| Why hidden | Parked, plus a security issue |
| What exists in code | Photo tagging and Google Vision AI renaming (PRs #57, #67) |
| Data | Google Drive + Google Vision API |
| Known issues | The Vision key was removed from the client code in #147, but it's still in the public git history. It must be revoked or restricted in Google Cloud whether or not the module returns. AI renaming needs a server-side key before it can come back |
| Bring back when | The image-library decision is made **and** there's a server-side way to call Vision |
| Code anchors | *To be filled in* |

### Sponsorships
| | |
|---|---|
| Panel | `sponsorships` |
| Was in nav | Not in nav (orphan panel) |
| Status | **Hidden** (not in the nav at `04c93cf`; confirm the panel code still exists) |
| Why hidden | Hard-coded `STATIC_SPONSORSHIPS` presented as live data; `LIST_IDS.sponsorships:null` |
| What exists in code | Static list display only |
| Bring back when | A Sponsorships/Supplier list exists. The data layer has to be built; the display can be reused |
| Code anchors | *To be filled in* |

---

## Moved modules (still available, new location)

| Module | Panel | Was | Now | Status | Note |
|---|---|---|---|---|---|
| My Work | `mywork` | Today → My Work | Today → My Work (home page) | Planned (UX-03 PR-4) | Name unchanged; absorbs the Dashboard |
| Personal Tasks | `personaltasks` | Today → Personal Tasks | Account menu + "Personal" filter in My Work | Planned (PR-2) | Privacy depends on SharePoint permissions (SAFE-04) |
| Team Work Register | `mytasks` | Deliver | Account menu (admin) | Planned (PR-2) | Labelled "Shared Work Setup" in older docs |
| Admin & Schema | `schema` | Business | Account menu (admin) | Planned (PR-2) | |
| Appearance | `appearance` | Business | Account menu | Planned (PR-2) | |
| Oversight → **Operations Map** | `operations` | Business → Oversight | Business → Operations Map | Planned (PR-2) | Renamed only; content unchanged |
| Pipeline | `campaigns` (pipeline view) | Separate nav item | Toggle inside Activities | Done (#18) | |
| Gantt, Venue Month, Cross-Venue | Calendar sub-views | Separate destinations | View options inside Calendar | Done | |

---

## Restored

*None yet.*

## Removed for good

*None. Nothing may be listed here without a logged decision.*

---

## Change log
- 2026-11-17: Register created alongside brief UX-03. Entries are "Planned" until the hiding PR lands and fills in the code anchors.
- 2026-11-18: Checked against `main` @ `04c93cf`. The Dashboard folds into My Work. Photo Tagging key note updated after #147.
