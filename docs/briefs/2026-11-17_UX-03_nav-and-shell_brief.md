# Claude Code brief — UX-03 "Navigation and page shell"

**Repo:** `KimberleyMarlin/marlin-gantt` · **File:** `index.html` (pull fresh `main` first)
**Written against:** `main` @ `04c93cf` (18 Nov 2026). Line numbers aren't quoted; find things by name.
**Layout reference:** `docs/design/marlin-hub-nav-design.html` (open it in a browser and use the **Map** and **Prototype** tabs), plus the screenshots in `docs/design/screenshots/`.
**Visual system:** already adopted (#139, #140). Follow **`docs/DESIGN_SYSTEM.md`** and `design-system/README.md` in the repo. The design file's own colours, fonts and System tab are **out of date: ignore them.**
**Read first:** `docs/DESIGN_SYSTEM.md`, `docs/MY_WORK_PLAN.md`, `docs/CALENDAR_DASHBOARD_AUDIT.md`, `docs/OS_RESET_MASTER.md` (sections 2–3), `docs/HIDDEN_MODULES.md`, `docs/briefs/2026-11-10_UX-02_clarity-pass_brief.md`
**Register links:** UX-01 (nav regroup), CAL-03, SUB-01

> **Hidden-module rule:** nothing in this brief deletes code. Every module that's hidden or moved goes behind one central flag (e.g. `HIDDEN_PANELS`), and the **same PR** updates `docs/HIDDEN_MODULES.md`: set the status, and fill in the code anchors (function names, commit SHA) from the real code.

---

## 1. What this is

The sidebar already has the right five groups (Today, Plan, Deliver, Programs, Business), and the brand is already applied. This brief **finishes the structure**:
- trim the sidebar to what people use every day
- move admin and personal screens to an account menu
- hide parked screens
- give every page the same header
- fold the Dashboard into My Work
- make the mobile menu work

The design file uses **sample data**. Where it shows information the live OS doesn't have, leave it out rather than invent it (see section 7).

---

## 2. Decisions already made (17–18 Nov)

1. **My Work is the home page** (it's been the front door since #131). The Dashboard folds into it, and the sidebar label stays **"My Work"**. The design's "My Day" name is **not** adopted, because My Day was deliberately retired in #131.
2. **Contacts & Mailing is hidden.** Contacts are moving to Emma. Keep the code. Report the current `CRM_WRITE_ENABLED` value (it's `true` at `04c93cf`); Kim decides separately whether to turn it off (D-2).
3. **Social is hidden** until it has real data.
4. **Personal Tasks leaves the main nav.** It's reachable from the account menu and through My Work's Personal filter. Privacy behaviour is unchanged.
5. **Programs stays a sidebar group** (Loaded Rewards, Ticketing, Specials).
6. **Icons:** keep the existing single-colour glyph set from `docs/DESIGN_SYSTEM.md`. No colour emoji.

---

## 3. Target sidebar

Use the **existing** panel IDs (`data-p`). Don't create new panels.

| Group | Label | Panel | Change from `04c93cf` |
|---|---|---|---|
| *(top)* | **＋ Submit something** | `submit` | **Move** the existing `.sb-cta` button from the bottom of the sidebar to the top, under the logo |
| **Today** | My Work | `mywork` | Home page; absorbs the Dashboard (PR-4) |
| | Inbox | `inbox` | — |
| **Plan** | Calendar | `calendar` | — |
| | Activities | `campaigns` | — |
| | Artwork | `artwork` | — |
| | Idea Bank | `ideas` | — |
| **Deliver** | Submissions | `approvals` | — |
| | Projects | `projects` | — |
| | Design Jobs | `design` | — |
| | Workload | `workload` | — |
| **Programs** | Loaded Rewards | `loaded` | — |
| | Ticketing | `ticketing` | — |
| | Specials | `specials` | — |
| **Business** | Venues | `venues` | — |
| | Marketing Report | `mktreport` | — (added in #149, keep) |
| | Finance | `budget` | — |
| | Operations Map | `operations` | Rename from "Oversight". **Content unchanged** |
| **Account menu** (name at the bottom of the sidebar) | Personal Tasks · Team Work Register · Admin & Schema · Appearance · Sign in/out | `personaltasks`, `mytasks`, `schema`, `appearance` | Moved out of the main nav. Existing role rules still apply (Personal Tasks stays Kim-only) |
| **Hidden** (behind the flag, code kept) | Dashboard, Drive Search, Photo Tagging, Social, Contacts & Mailing | `overview`, `drivesearch`, `phototagging`, `social`, `crm` | Remove from nav. `overview` redirects to My Work |

The "Live · SharePoint" status pill stays at the foot of the sidebar (#142).

**Role visibility:** drive it from the existing role config (`ROLE_CONFIG` / `canAccessPanel`). Don't hard-code per-role menus. If a group has no visible rows for a role, hide its heading.

**Old links:** anything pointing at a hidden panel (saved defaults, hash routes, internal `navTo()` calls, a user's saved "default panel" setting) goes to My Work or to the panel that absorbed it. Never a blank page.

---

## 4. Shell

**Top bar:** page title on the left, today's Perth date on the right. If a global search already exists, move it here; if not, don't build one (follow-up).

**Page header:** one shared render helper, used on every visible page, not copied HTML.
- Eyebrow (e.g. PLANNING, DELIVERY, TRIAGE) in the `label` style
- Page title (`.ph-title` style from `docs/DESIGN_SYSTEM.md`)
- One sentence saying what the page is for
- Optional stat tiles (max 4) using the existing `.stat` KpiCard styling. Each says what it counts and comes from real data.
- Filter row: venue chips (existing short codes), with the view toggle on the right

**Mobile (≤ 900px):**
- The existing `☰` button opens the sidebar as a drawer, and the drawer closes after choosing a page.
- Submit stays one tap away (a "＋" in the top bar).
- No horizontal scroll at 390px. Stat tiles stack, and chip rows wrap or scroll inside themselves.

---

## 5. My Work absorbs the Dashboard

- **Read `docs/MY_WORK_PLAN.md` first.** Don't redo anything it already delivered (phases 1–2.5).
- Move only the Dashboard pieces that answer "what needs me" into My Work: the short action list and a 14-day upcoming snapshot, each item linking to its record. Use the date and venue helpers from #155 and the CAL-FIX work; don't write new ones.
- Everything else on the Dashboard is hidden with it. List each widget and where its job now lives in the PR.
- Leave out anything in the design with no data behind it (e.g. "2 decisions are holding up other people").

---

## 6. Work packages (one PR each)

**Step 0: inventory, then stop for Kim's sign-off.** Run it together with UX-02 step 0.
- Current nav → panel → group → which roles see it
- The sidebar each role will get after section 3. Flag any role left with an empty or one-row group.
- Every Dashboard widget, and where its job lands (My Work, Calendar, Insights, or hidden)
- Where "default panel" and saved-layout settings could point at a panel that's about to be hidden
- Whether a global search exists
- Before screenshots at 1440px and 390px

| PR | Scope | Key test |
|---|---|---|
| **PR-2 Sidebar** | Regroup per section 3: Submit to the top, account menu, rename Oversight, hide via one flag, redirect old links, update `docs/HIDDEN_MODULES.md` | Each role sees exactly its rows; flipping a module's flag back restores it working; old links and saved defaults land on a real page |
| **PR-3 Top bar & page header** | Shared header on every visible page | Every page has eyebrow, title and purpose line; no invented numbers |
| **PR-4 Dashboard into My Work** | Section 5 | Sign in → My Work; the moved pieces show real data; Personal Tasks still private; the Dashboard is hidden, not deleted |
| **PR-5 Mobile drawer** | Section 4 mobile rules | At 390px the drawer opens and closes, Submit is reachable, and there's no horizontal scroll |
| **PR-6 Nav badges** | Real counts only (My Work, Inbox, Submissions) | Counts match the page they point to; 0 or unknown hides the badge |

*(There's no PR-1: the brand work it covered was done in #139/#140.)*

After UX-03, continue with UX-02.

**Every PR:** follow `docs/DESIGN_SYSTEM.md`; before/after screenshots at 1440px and 390px, plus a side-by-side with the matching design screen where one exists. Regression check: same records load, financial gating unchanged, Personal Tasks private. Add a `docs/CHANGELOG.md` entry (create the file if it doesn't exist).

---

## 7. Out of scope

- **Operations Map content** ("waiting on a decision", "who is carrying it"): there's no decision or dependency data. Only the label changes.
- **Artwork board-image nomination** and its stats: a data check comes first (does design-approval status exist in the data?).
- **Submissions job-preview redesign.** The existing flow (#79, #144) only gets the shared header.
- **Venues page redesign**, **global search** (if none exists), **adding venues**, and **SharePoint list, column or flow changes** of any kind.
