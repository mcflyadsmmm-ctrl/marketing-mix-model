# Spend

Spend is the Total ROAS tab: Shopify Total Sales ÷ spend you added. On the public desk the ledger is SAMPLE Snowdevil and does not save. Empty spend is an em dash, never 0×.

## Sub-features

- `spend-open` selects the Spend tab and heading `Spend`.
- `spend-roas` shows `#mcfly-roas` with `aria-label="Sales, spend, and Total ROAS"`.
- `spend-explorer` shows `#mcfly-explorer`.
- `spend-mix` shows `#mcfly-mix` (`aria-label="Entered spend mix"` on the mix section).
- `spend-cpa` shows `#mcfly-cpa` with `aria-label="Customer acquisition cost"`.
- `spend-readonly` states that the demo does not save spend.

## How to get to it (user POV)

- Choose the `Spend` tab (`/demo/spend`).
- Choose a chip: `Total ROAS` (`?panel=roas`), `Explorer` (`?panel=explorer`), `Mix` (`?panel=mix`), `CPA` (`?panel=cpa`), `Add spend` (`?panel=spend-add`).
- Old public URLs redirect onto Spend: `/demo/roas` sets `panel=roas`, `/demo/allocation` sets `panel=mix`, `/demo/cpa` sets `panel=cpa`. Admin `/app/roas`, `/app/allocation`, and `/app/cpa` do the same after auth.
- The nav label is `Spend`, not `Spend Upload`.

## Driving it with verify-mcfly

Preconditions:

- Doctor exited 0.
- Do not type into spend fields and do not submit a form. The public page has no save.

- **Open Spend.** Run `node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs drive spend`. HTTP 200. Heading `Spend`. Active tab `Spend`.
- **Pair.** `#mcfly-roas` has `aria-label="Sales, spend, and Total ROAS"`. The formula text `Shopify Total Sales ÷ spend you added` is on the page. Banner heading text includes `Example spend is on`.
- **Read-only.** Body contains `Read-only SAMPLE ledger.` and `This demo does not save spend.`
- **Stack.** Ids `mcfly-explorer`, `mcfly-mix`, and `mcfly-cpa` are present. CPA region label is `Customer acquisition cost`.
- **Chips.** `Total ROAS`, `Explorer`, `Mix`, `CPA`, `Add spend`.
- **Proof.** `spend.proof.json` is `"ok": true`. The aria file lists those ids. The screenshot shows the Spend heading and the sales/spend/Total ROAS region.

## Gotchas

- `#mcfly-spend-add` and `aria-label="Yesterday’s spend — one bill"` live on Admin `app.spend.tsx` (and the import route), not on `demo.spend.tsx`. The public chip `Add spend` still links to `?panel=spend-add`, and the helper fails the drive if `id="mcfly-spend-add"` appears in the public HTML. Do not invent that form on `/demo/spend`.
- Proving a saved spend row requires an embedded shop you are allowed to write. This harness does not do that write.
- `/app/connections` is a retired-OAuth explanation page (`No ad accounts to connect`), not a redirect and not a Meta login.
- Total ROAS is sales ÷ entered spend. It is not platform ROAS and not path credit.
