# Design system: Marlin Hospitality in the Marketing OS

The OS is group-level internal tooling, so it uses the **Marlin Hospitality** design system. A copy of the system lives in [`design-system/`](../design-system/README.md): the brand book, `tokens.json`, a generated `tokens.css`, the eight report components and the 12 logo files. The master copy is the Marlin Hospitality design system artifact on claude.ai, built from *MH Branding 2026 v1.7* and the TLB weekly report pack. When the artifact changes, copy the changed files into `design-system/` again and regenerate `tokens.css`. This document covers how the OS applies the system. Where the two disagree, the design system wins. Fix this file and the `:root` token block in `index.html` to match it. (`index.html` keeps its tokens inline, rather than loading `design-system/tokens.css`, so it still works when it is pasted into WordPress on its own.)

Venues keep their own identities. The venue colours (`--lb-*`, `--wbc-*`, `--hd-*`, `--rw-*`, `--mb-*`) are left alone and are only used to mark which venue something belongs to.

## Rules that matter most in the OS

- **There is no red.** Overdue, blocked, failed and over-budget states use rust (`--attention`, coral-900 `#a64a24`) on `--attention-tint`. Don't add red hex values. Hotel Darwin's wine colour is a venue colour, not a status colour.
- **Status means business meaning, not sign.** `--positive` (deep green) means better than target or done. `--attention` (rust) means worse than target or needs action. Every status also carries a word, a sign or an icon, never colour alone.
- **Navy leads.** The brand colour is navy-900 `#14416d`. It's used for the sidebar ground, primary buttons, active filters, titles and KPI values. Support it with mist and cream, and use green, gold and coral as accents.
- **No shadows and no gradients.** Separate things with hairlines (`--line`), tinted grounds (`--surface-alt`) or space. `--sh` is `none`. `--sh-md` and `--sh-lg` are a 1px `--line` outline so menus and modals still read as layers.
- **Square data, small radii.** Tables, header bands and chart bars use `--radius-none`. Cards, pills, chips and callouts use `--radius-sm` (3px). `--radius-frame` (24px) is only for title and cover pages.
- **Focus** is a 2px solid `--focus` ring with a 2px offset: navy-500 on light grounds, gold-300 on the navy sidebar.

## Tokens

All tokens live in the `:root` block at the top of `index.html`.

| Layer | Tokens | Use |
| --- | --- | --- |
| Palette | `--navy-*`, `--green-*`, `--mist-*`, `--cream-*`, `--gold-*`, `--coral-*`, `--white`, `--black`, `--slate`, `--grey` | Raw brand tones. Reach for these only when no semantic token fits (for example the navy sidebar). |
| Semantic | `--surface`, `--surface-alt`, `--surface-warm`, `--ink`, `--ink-brand`, `--ink-muted`, `--line`, `--line-strong`, `--accent`, `--on-accent`, `--positive(-line/-tint)`, `--on-positive`, `--attention(-line/-tint)`, `--on-attention`, `--series-ty`, `--series-ly`, `--series-3`, `--focus` | **Use these in new code.** |
| Type | `--font-sans` (Work Sans), `--font-numeral` (Pressio, which falls back to Work Sans) | |
| Spacing | `--space-1` (4px) … `--space-16` (64px) | |
| Radius | `--radius-none`, `--radius-sm`, `--radius-frame` | |

### Legacy names

The OS's original token names still work and are aliased onto the system, so existing screens follow the brand automatically. Use the semantic names in new code. Replace a legacy name when you are already editing that line.

| Legacy | Now | Notes |
| --- | --- | --- |
| `--bg` | `--surface-alt` (mist-100) | The app page ground is tinted so white cards separate without shadows. |
| `--surface`, `--surface2`, `--surface3` | white, mist-100, mist-500 | |
| `--border`, `--border2` | `--line` (mist-500), mist-900 | `--border2` is for control borders and needs 3:1. |
| `--text` | `--ink` | |
| `--text2`, `--text3` | `--ink-muted` (slate) | The old `--text3` grey was 3.5:1, below AA. Both secondary tiers are now slate (5.4:1). |
| `--accent`, `--accent2`, `--accent-bg` | navy-900, navy-700, mist-100 | The accent was green. Green now means `--positive` only. |
| `--red`, `--red-bg` | `--attention`, `--attention-tint` | |
| `--gold`, `--gold-bg` | gold-900, cream-500 | gold-900 is 4.3:1 on white, so use it for bold or large text only. |
| `--blue`, `--blue-bg` | navy-500, mist-100 | |
| `--purple`, `--purple-bg` | navy-700, mist-500 | The system has no purple. |
| `--orange`, `--orange-bg` | coral-900, cream-500 | |
| `--r`, `--r-sm`, `--r-lg` | `--radius-sm` | |

## Typography

Work Sans is the only typeface, loaded from Google Fonts at the top of `index.html`. DM Sans, DM Serif Display and DM Mono have been removed.

| OS element | Style |
| --- | --- |
| Page title (`.ph-title`), top-bar title (`.tb-title`) | Black (900), uppercase, `--ink-brand`. The `<em>` half of a title is no longer italic grey; it is set the same as the rest of the title. |
| Eyebrow (`.ph-eye`), sidebar section labels | `label` style: ExtraBold (800), uppercase, 0.04em tracking. |
| KPI numbers (`.stat-n`, `.vc-s .n`) | `kpi` style: ExtraBold (800), `--ink-brand`, tabular figures. |
| Body | Medium (500), 14px. |
| Former monospace numbers | Work Sans with `font-variant-numeric: tabular-nums`. |

**App density (a deliberate difference from the system).** The system's text styles are sized for reports and decks: `body` 16px, `small` 13px, `label` 12px. The OS is a dense working tool, so it keeps a 14px body and uses 10–12px for table cells, chips and meta. Don't go below 10px for anything someone needs to read. Today the OS has 12 or more distinct sizes (9–14px in half-pixel steps). Proposed app scale for the clean-up: 10 / 11 / 12 / 14 / 18 / 24 / 28px.

## Writing in the UI

Follow the system's writing rules: first person plural, plain confident sentences, Australian spelling, no exclamation marks. In reports and KPIs, lead with the finding and the number, use TY/LY and "pts", and put negatives in brackets in tables, for example (1,287).

Not yet applied: the OS uses emoji as icons throughout (sidebar, cards, buttons), and the system has no icon set and says no decorative icons. Replacing them is a bigger, screen-by-screen job (see below).

## Charts

Use `--series-ty` (navy) for this year, `--series-ly` (coral-500) for last year and `--series-3` (green-700) for a third category. coral-500 is 2.5:1 on white, so always label last-year bars with their values. Use flat bars only: no 3D, no gradients. Chart.js can't read CSS variables, so pass hex values (`#14416d`, `#ea8e68`, `#678d5d`), or read them with `getComputedStyle(document.documentElement).getPropertyValue('--series-ty')`.

## Migration status

**Done (phase 1, the foundation):**
- Brand palette, semantic, spacing and radius tokens added. Legacy tokens aliased onto them.
- Work Sans everywhere. Titles, eyebrows and KPIs restyled.
- Sidebar on navy-900, with a gold-300 primary button (the Navy theme's accent) and coral, green and gold badges with navy text.
- Shadows removed. Radii reduced to `--radius-sm`. Pills, chips and active filters are navy.
- Global `:focus-visible` ring.
- Hardcoded reds swapped for rust and coral. Hardcoded success greens, old accent green, old gold and old greys swapped for the brand equivalents, hex for hex, so JavaScript colour maps and Chart.js datasets keep working.
- The calendar venue-trade scale rebuilt on the green tones, with readable text colours.
- The sidebar logo is the system's `marlin-hospitality-stacked-white.svg`. If that file isn't deployed next to `index.html`, it falls back to the old PNG, then to text.

**Still to do:**
1. **Remaining hardcoded colours** (about 80 unique hex values in the JavaScript renderers): indigo and violet (`#7c3aed`, `#6366f1`, `#ede9fe`), Tailwind blues and teals (`#2563eb`, `#0d9488`, `#0891b2`), ambers (`#b45309`, `#f59e0b`, `#ca8a04`), and pipeline and stage colour maps. Map each to a system token by meaning.
2. **Inline styles** (about 1,600 `style=` attributes): move the repeated ones into classes that use the tokens.
3. **Type scale:** collapse the half-pixel sizes onto the app scale above.
4. **Hardcoded radii** (`border-radius: 6px / 8px / 10px / 12px / 20px` in inline styles): use `--radius-sm`, or `--radius-none` for data.
5. **Emoji icons:** replace with plain text labels, or a small, consistent line-icon set if the brand adopts one.
6. **Navy theme:** add a `[data-theme="navy"]` block mapping the semantic tokens to the Navy theme values (surface navy-900, ink white, ink-brand cream-500, accent gold-300) if a reversed view is wanted.
7. **The Appearance page** (`THEME_TOKENS`) still offers free colour pickers. Limit the choices to brand tokens.
