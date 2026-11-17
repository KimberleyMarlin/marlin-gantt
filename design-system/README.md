# Marlin Hospitality design system

The brand book for Marlin Hospitality, copied from the design system artifact (built from *MH Branding 2026 v1.7* and the TLB weekly report pack). Read this before building anything group-level in this repo. How the Marketing OS applies it is in [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md).

Marlin Hospitality is the master brand over the group's venues: The Left Bank, Whitfords Brewing Co, Hotel Darwin, Ravenswood Hotel and Mustang Bar. It sits between Marlin Group (the corporate parent) and the venue brands. Venues keep their own identities; Marlin Hospitality adds consistency, confidence, trust and shared standards. Use this system for group-level material: reports, presentations, Loaded Rewards, Functions, Careers, internal tools and anything that speaks for the group rather than one venue.

## Brand character

- **Personality:** grounded, confident, welcoming, dependable, modern, social, refined but approachable.
- **Tone:** intelligent, not elitist. Premium, not exclusive. Community-aware. Operationally confident.
- **Visual character:** restrained, architectural, understated premium, confident typography, subtle motion.
- **The six principles:** Movement (dynamic spaces in motion), Precision (excellence in every detail), Strength (built on people and resilience), Navigation (bringing people together), Momentum (always evolving forward), Endurance (trust earned over time). Use them as headings when explaining what the group stands for.

## Writing

- Write in the first person plural: "we create venues that feel alive", "our venues".
- Plain, confident sentences. No hype, no exclamation marks, no emoji.
- Australian spelling: colour, centred, organise, travellers.
- Headings and labels are written in sentence case and set uppercase by the type style (`h1`, `h2`, `label`). Sub-headings stay in sentence case (`h3`): "Bringing people together".
- In reports, lead with the finding and the number: "Sales down 12%, and below LY for 13 weeks straight." Use "TY" and "LY" for this year and last year, "pts" for percentage-point changes, and brackets for negatives in tables: (1,287).
- Real examples from the brand guide: "At Marlin Hospitality, hospitality is about more than venues." · "Like the marlin itself, our identity is shaped not by noise, but by purpose, movement, and presence."

## Colour

The palette has six families. Each has a mother colour (the `-500` step) with darker and lighter tones from the brand guide's tone chart. **There is no red in this system.** The guide's red family, and the red used for negatives in the TLB report pack, are left out on purpose: attention states use rust (`coral-900`) instead.

- **Navy** (`navy-900` #14416D) is the brand colour. Logo, headings, report header bands, table headers and this-year chart bars are navy.
- **The applied palette** is navy-900, `green-700`, `mist-500`, `cream-500`, `gold-300` and `coral-500`. These are the colours the guide applies to the logo and signage. Lead with navy, support with cream and mist, and use green, gold and coral as accents.
- Approved logo-on-ground pairings from the guide: white, cream or gold logo on navy; navy or cream logo on green; navy or green logo on mist or cream; navy logo on gold or coral. Don't put a light logo on a light ground or green on navy.
- Build interfaces from the semantic tokens, not the raw palette: `surface` and `surface-alt` for grounds, `ink` for body copy, `ink-brand` for headings and values, `ink-muted` for captions, `line` for hairlines, `accent` and `on-accent` for solid fills.
- Status: `positive` (deep green) means better than target, `attention` (rust) means worse than target. Choose by business meaning, not by sign: wages going up is attention. Every status also carries a word, a sign or an icon.
- Charts: `series-ty` for this year, `series-ly` for last year, `series-3` for a third category. `series-ly` (coral-500) is only 2.5:1 on white, so always label those bars with their values.
- Callout grounds: `positive-tint` and `attention-tint`, with `ink-brand` headings on them.
- `grey` (#A9A6A7) is the brand guide's page-meta grey. At 2.4:1 on white it's for large or decorative text only.
- Two themes: **Light** (white page, the default) and **Navy** (the reversed pages of the guide: navy ground, white body copy, cream headings, gold accent).

## Typography

- **Work Sans** is the typeface for everything you write: headings in Black (900) and ExtraBold (800), body in Medium (500), labels in ExtraBold uppercase with 0.04em tracking. Load it from Google Fonts (`components/bundle.css` already does).
- Styles: `display` and `h1` for titles, `h2` for column headings, `h3` for sentence-case sub-headings, `lead` for the navy intro line under a title, `body` for copy, `small` for captions and table cells, `label` for page meta strips and kickers, `kpi` for report figures.
- Section numbers ("1.1", "2.1") use **Pressio No.34**, a condensed face, in `numeral`. The font file isn't in this system yet, so numerals fall back to Work Sans.
- **Fabiola** (MARLIN) and **Dunkelsans** (GROUP / HOSPITALITY) are logo-only faces. Never set text in them; use the logo files.
- **Poppins** appears on business-card mockups for name, title and contact details (`stationery`). Use it only on stationery.
- The TLB report pack was set in Carlito. New reports use Work Sans.

## Layout and shape

- Page frame: a meta strip at the top (version, section, page number in `label`), content, then a 4px navy rule and a footer strip (date, MARLIN HOSPITALITY, BRANDING). Keep this rhythm on reports and decks.
- Data is square: tables, header bands and chart bars use `radius-none`; cards, pills and callouts use `radius-sm`.
- The rounded white outline with labels set into the rule (`radius-frame`, see BrandFrame) is the cover and divider device. Use it only on title pages.
- No shadows and no gradients. Separate things with hairlines (`line`), tinted grounds (`surface-alt`) or space.
- Spacing steps run `space-1` to `space-16`. KPI cards and their gaps use `space-3`; report sections are `space-6` apart; page margins are `space-12` on screen and `space-16` in print. The guide doesn't define spacing or radii; these values are proposed from the report pack's proportions.
- Focus: a 2px solid `focus` ring (navy-500 on light, gold-300 on navy), 2px offset.

## Logos

- The logo has two lockups: **Marlin Hospitality** (the consumer-facing brand) and **Marlin Group** (corporate only: investment, partnerships, the parent company). Default to Marlin Hospitality.
- Stacked (arched HOSPITALITY under MARLIN, with the fin cut into the N) is the primary mark. Use the horizontal lockups where height is tight: email signatures, report footers, narrow headers.
- Use the files in the Logos group as they are. Don't redraw, re-space, recolour outside the approved pairings, stretch or add effects.
- On navy, use the white or cream files. The `-box-` horizontal files have white lettering knocked into a navy box, so they only work on light grounds.

## Iconography and imagery

- The brand guide defines no icon set, and none is included. Report pages use plain text, numbers and simple bars; keep it that way rather than adding decorative icons.
- Photography in the guide shows signage and printed stationery in real settings. Prefer real venue photography over stock or illustration.
- Charts use the series tokens and flat bars; no 3D, no gradients.

## Files in this folder

| Path | What it is |
| --- | --- |
| `tokens.json` | The source of truth: palette, semantic roles for the Light and Navy themes, type styles, spacing, radius. |
| `tokens.css` | Generated from `tokens.json`. CSS custom properties (`--navy-900`, `--ink-brand`, `--space-3` …), a `[data-theme="navy"]` block, and `.mh-type-*` text-style classes. Don't edit it by hand. |
| `components/bundle.css` | Styles for the eight components (`.mh-report-header`, `.mh-kpi`, `.mh-pill`, `.mh-table`, `.mh-callout`, `.mh-frame` …). Plain CSS: usable as HTML classes with no React. |
| `components/bundle.js`, `index.d.ts` | The same components as React (`window.Marlin.KpiCard` etc.) and their props. |
| `components/<Name>/README.md` | Usage guidelines per component; `preview.html` shows example props. |
| `assets/logos/` | The 12 logo SVGs, unchanged. See its README for which file goes on which ground. |

To use the system on a page: load `tokens.css`, then `components/bundle.css`, and build from the semantic tokens.
