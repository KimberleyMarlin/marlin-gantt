# Customer CRM architecture

## Purpose

The CRM consolidates customer exports from Now Book It, Loaded Rewards, Mailchimp, POS and other venue systems into one master customer record without losing source identity, venue relationships, consent history or import traceability.

`All Customer Data` is the master customer list. The supporting lists are:

- `CRM Customer Venues` — one row per customer/venue relationship.
- `CRM Source Links` — the permanent link between a master customer and a source-system record.
- `CRM Consent Events` — append-only consent evidence by channel, source and venue.
- `CRM Imports` — one audit record per uploaded batch.
- `CRM Change Log` — field and linkage changes caused by imports.
- `CRM Connections` — manual and automated source connection register.
- `CRM Venues` — venue reference records used by relationship and consent lookups.

## Matching rules

The HTML performs a read-only preflight before offering any write:

1. Exact source system plus source record ID links to its existing master customer.
2. A unique normalised email is a confident match.
3. A unique normalised Australian phone number is a confident match.
4. If email and phone point to different customers, the row is held as a conflict.
5. Multiple candidates and name-only similarities are held for review.
6. Rows without a valid email, phone or source ID are invalid.
7. Exact same-file identities consolidate into one new master customer.

The importer fills missing master fields and refreshes `LastSeen`. It does not silently replace populated identity fields. Every source remains linked through `CRM Source Links`.

## Consent rules

Consent is never inferred from the customer appearing in a marketing export. Only an explicit mapped opt-in or opt-out value creates a `CRM Consent Events` row. Re-importing the same current status from the same source does not create another event. A changed status creates a new event and change-log row.

## Import states

Every row finishes as one of:

- `new` — create a new master customer.
- `update` — link to or fill gaps on one existing customer.
- `consolidate` — use the same master customer as an exact earlier row in the file.
- `review` — possible match requiring a person.
- `conflict` — identifiers point to different customers.
- `invalid` — insufficient identity.
- `created`, `updated` or `failed` — final write result.

Held rows can be exported with the decision and reason attached. They are never written automatically.

## Access control

The CRM panel is visible only to the Hub `admin` role, but browser-side role hiding is not a security boundary. The eight SharePoint lists must have restricted SharePoint permissions so only authorised staff can read customer personal information. Do not import live customer data until those list permissions have been checked.

## Connection roadmap

Manual CSV/XLSX imports use the same matching and audit path as future automation. A source can later move to Power Automate, scheduled file pickup or a direct API connection without changing the customer model. Automated connections must still provide a stable source record ID and explicit consent evidence where available.
