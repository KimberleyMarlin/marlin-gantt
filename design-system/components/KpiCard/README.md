# KpiCard

One headline figure from a weekly report: label, value, change against last year, and optional TY/LY bars.

- **Consumer provides:** `label`, `value` (formatted string), optional `delta` ("−12.0%", "+2.5 pts"), `tone`, optional `note` ("vs 72.3% LY") and `compare` rows.
- `tone` follows the business meaning, not the sign: rising wages are `attention`, rising member visits are `positive`. Use `neutral` when there is no target.
- The delta always carries its sign and unit. Colour backs up the wording; it never carries the meaning alone.
- Lay four across on A4, six across in the summary strip. Gap `space-3`.
- There is no red in this system: attention is rust (`attention`).
