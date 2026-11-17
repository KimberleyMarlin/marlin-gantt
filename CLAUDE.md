# Marlin Marketing OS

## Design system

This app is group-level Marlin Hospitality tooling. Follow the Marlin Hospitality design system:

- Read `design-system/README.md` (the brand book) before any visual or copy change.
- Use the semantic tokens (`--surface`, `--ink`, `--ink-brand`, `--ink-muted`, `--line`, `--accent`, `--positive`, `--attention`, `--series-*`). Values are in `design-system/tokens.json`; `index.html`'s `:root` block mirrors them.
- No red anywhere: attention/bad states use rust (`--attention`, #a64a24). No shadows, no gradients. Work Sans only.
- Use the logo files in `design-system/assets/logos/` unchanged.
- `docs/DESIGN_SYSTEM.md` records how the OS applies the system, the legacy-token mapping and the migration still to do.
