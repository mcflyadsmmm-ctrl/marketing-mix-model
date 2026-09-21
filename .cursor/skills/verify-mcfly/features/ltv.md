# LTV

LTV is the Customers section for what a new buyer is worth on the Snowdevil order book: first 90 days on file, with 30- and 365-day windows in the same section. The top-level tab stays Customers.

## Sub-features

- `ltv-redirect` sends `/demo/ltv` to `/demo/customers?panel=ltv`.
- `ltv-chip` marks the `LTV` chip selected.
- `ltv-windows` shows `#mcfly-ltv`, lane `What a new buyer is worth`, and region `What new customers spend`.

## How to get to it (user POV)

- On Customers, choose the `LTV` chip.
- Open `/demo/ltv` (or `/app/ltv` when embedded). The server redirects to Customers with `panel=ltv`.
- Orders and Overview link `Open LTV` to `?panel=ltv`.

## Driving it with verify-mcfly

Preconditions:

- Doctor exited 0.
- The Growth chip being visible is not an LTV proof. The active chip must be `LTV`.

- **Old URL.** `/demo/ltv` returns 302 to `/demo/customers?panel=ltv`. The helper writes `ltv.redirect.json`.
- **Open the section.** Run `node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs drive ltv`. HTTP 200. Heading `Customers`. Active tab `Customers`. Active chip `LTV`.
- **Section.** `#mcfly-ltv` is present. Lane `aria-label="What a new buyer is worth"`. Region `aria-label="What new customers spend"`. Copy includes `What a new buyer is worth is from SAMPLE Snowdevil orders.`
- **Proof.** `ltv.proof.json` is `"ok": true`. The aria file says `active chip: LTV` and `id: mcfly-ltv`.

## Gotchas

- `/app/ltv` requires Admin auth before the redirect. Do not curl it as the public proof.
- LTV does not require a spend upload. Cash CAC appears only when the sample book has spend. Empty spend is not 0× and is not a failed LTV page.
- Break-even at 40% is not an LTV promise. Do not search for it.
- Depth (`?panel=depth`) is a folded lane, `Who the dollars sit with`. It is not LTV.
