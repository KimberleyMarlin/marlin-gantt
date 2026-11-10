# DataTable

The report table: navy header row, hairline row rules, right-aligned tabular figures and a bold total row.

- **Consumer provides:** `columns` (`key`, `label`, `align: 'right'` for numbers) and `rows`; set `total: true` on a subtotal or total row.
- Format numbers before passing them in: thousands separators, negatives in brackets "(1,287)".
- Use for weekly figures, member tiers and promotions. Don't zebra-stripe; the hairlines do the work.
