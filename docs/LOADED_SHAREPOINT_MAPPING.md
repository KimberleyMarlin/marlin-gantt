# Loaded Rewards SharePoint mapping

Updated: 2026-08-12, v18 working branch.

The Hub uses three related lists. The activity is the parent. Offer Mechanics holds reusable dropdown values. Offer Variants holds the selections made for one specific activity.

## 1. Marketing & Activations 2026

| Hub label | SharePoint column | Type | Rule |
|---|---|---|---|
| Activation | `Title` | Single line text | Repeatable program or event name, for example `Beer of the Month` |
| Month | derived from `Start` | Date calculation in the Hub | Do not create a separate Month column |
| Activity Detail | `Description` | Multiple lines text | Specific execution, for example `Cheeky Monkey pints` |
| Long Description | `LongDescription` | Multiple lines text | Full customer-facing master copy |
| Product | `Product` | Lookup | Points to the Products list |
| Supplier | `Supplier` | Lookup | Points to the Suppliers list |
| RRP | `RegularPrice` | Currency or number | Normal selling price |
| Member Price | `LoadedBasePrice` | Currency or number | Loaded member price |

The existing list ID is `269191b2-47c7-4c0c-94bb-52c25ecb467f`.

## 2. Offer Mechanics

Existing list ID: `0522b777-f292-4e24-9970-975e5b62a5e8`.

| Column | Type | Required values or purpose |
|---|---|---|
| `Title` | Single line text | Reusable value shown in the dropdown, for example `$10`, `Free pint`, or `$50 per venue` |
| `Category` | Choice or single line text | `Base Member Deal`, `Premium`, `Re-engagement Category`, `Re-engagement Offer`, `Referral`, `Staff Incentive`, `Comp Metrics`, `Marketing Spend` |
| `Active` | Yes/No | Controls whether the value remains available for new selections |

## 3. Offer Variants

Existing list ID: `86aaed91-f1a8-48de-8ff2-e7b9716faf31`.

| Column | Type | Required mapping |
|---|---|---|
| `Title` | Single line text | Generated as `Activation · Component` |
| `Campaign` | Lookup | Must point to `Marketing & Activations 2026` |
| `Audience Tier` | Choice or single line text | `Base Member Deal`, `Premium`, `Re-engagement`, `Referral`, `Staff Incentive`, `Comp Metrics`, `Marketing Spend` |
| `Offer Mechanic` | Lookup | Must point to `Offer Mechanics` |
| `Offer Value` | Single line text | Selected or custom offer value |
| `Offer Description` | Single or multiple lines text | Holds the Re-engagement category for the Re-engagement row |
| `Active` | Yes/No | Clearing a Hub selection sets the prior row inactive instead of deleting history |

Optional existing reporting columns such as redemption target, actual redemption, supplier funding and push copy can remain. They do not block saving the seven core offer components.

## Relationship

One Marketing activity can have up to seven active Offer Variant children. Each child points to one reusable Offer Mechanic. The Hub always links through the activity's permanent SharePoint item ID, not its title, because titles such as `Beer of the Month` legitimately repeat.

## Validation in the Hub

The Loaded Rewards page now includes a SharePoint offer mapping panel. It reads the live column definitions and shows the internal field selected for each requirement. A missing field, non-lookup field, or lookup aimed at the wrong list is shown before the user tries to save offer rows.
