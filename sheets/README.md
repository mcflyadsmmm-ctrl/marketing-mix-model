# Mcfly Sheets companion (Phase 5 scaffold)

Thin Google Sheets add-on that **consumes the same MER API** as the Shopify embedded app — not a SyncWith-style connector product.

## Template columns

| Date | Sales | Spend | MER | Break-even MER | Meta spend | Google spend |

## Quick start (no Marketplace publish required)

1. Create a Google Sheet from the Mcfly MER template (or blank sheet).
2. **Extensions → Apps Script** — add `Code.gs` and `appsscript.json` from this folder.
3. **Project Settings → Script properties**:
   - `MCFLY_API_BASE` — e.g. `https://api.mcflyads.com/v1` or local app URL
   - `MCFLY_API_TOKEN` — issued by Mcfly app after Shopify install
   - `MCFLY_SHOP_ID` — optional shop scope header
4. Reload the sheet → **Mcfly Analytics → Refresh MER table**.

## API contract

Uses `@mcfly/api-contract`:

- `GET /mer?from=YYYY-MM-DD&to=YYYY-MM-DD&includeAllocation=true`

See [packages/api-contract/openapi.yaml](../packages/api-contract/openapi.yaml).

## Human gates

- Mcfly API must be deployed (Shopify app sibling under `/app` when scaffolded)
- Merchant OAuth / API token from app settings
- Optional: Google Workspace Marketplace listing (later; not required for design partners)

## Not in scope

- Bidirectional sync with ad platforms from Sheets
- Path attribution or pixel imports
- SyncWith clone behavior
