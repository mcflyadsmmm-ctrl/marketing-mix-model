# Goals

Goals is the read-only SAMPLE plan tab: this month’s sales, optional Total ROAS, and break-even Total ROAS from the sample margin. There is no panel rail on this page.

## Sub-features

- `goals-open` selects the Goals tab and heading `Goals`.
- `goals-month` shows the `This month sales` figure for the sample book.
- `goals-be` shows `Break-even Total ROAS` from margin, not a fixed 40% line.

## How to get to it (user POV)

- Choose the `Goals` tab (`/demo/goals`).
- On Admin, choose `Goals` (`/app/goals`) to edit a monthly plan. The public page says the plan is read-only.

## Driving it with verify-mcfly

Preconditions:

- Doctor exited 0.

- **Open Goals.** Run `node .cursor/skills/verify-mcfly/scripts/verify-mcfly.mjs drive goals`. HTTP 200. Heading `Goals`. Active tab `Goals`.
- **Copy.** The page contains `Read-only SAMPLE.` and `This month sales`.
- **Break-even.** The label `Break-even Total ROAS` is present. It is the margin-derived figure. Do not require the text `40%`.
- **No rail.** `On this page` is absent. `goals.aria.txt` says `active chip: (none)` and lists no `chip:` lines from a rail.
- **Proof.** `goals.proof.json` is `"ok": true`.

## Gotchas

- Public Goals does not save a plan. Admin Goals posts to the shop. This harness does not submit that form.
- Optional Total ROAS on this page is still sales ÷ entered spend. Empty spend renders `—`, not `0×`.
- Settings owns the same margin idea. Verifying Goals does not verify the Settings form.
