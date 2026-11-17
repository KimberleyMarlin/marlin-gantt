# CompareBars

This-year against last-year bars, as used inside the report KPI cards.

- **Consumer provides:** `rows` of `{label, value, display}`; the first row is drawn as this year (`series-ty`), the second as last year (`series-ly`). Set `series: 's3'` for a third.
- Optional `max` to share a scale across several cards.
- Always show the value label: last-year coral sits below 3:1 on white, so the number has to carry it.
