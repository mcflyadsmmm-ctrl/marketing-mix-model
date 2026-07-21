# Mcfly Analytics — Agent directives

**Read first:** [`MASTER_PLAN.md`](./MASTER_PLAN.md) §0–§4.

## Mission

Ship and maintain **cash MER truth** — Shopify sales ÷ ad spend, break-even MER, rules-based allocation.  
**Refuse:** pixels, MTA, SyncWith connector zoo, Triple Whale parity.

## Autonomous overnight loop

When running unattended (Cursor Automation, GitHub Actions, Railway cron):

1. **Preflight** — `npm test`, package builds pass
2. **Sync** — `syncShopSpend` per installed shop (mock until OAuth live)
3. **Recon** — flag spend drift >5% vs prior snapshot
4. **Snapshot** — persist `MerSnapshot` rows
5. **Allocate** — `suggestAllocation()` from `@mcfly/mer-core`
6. **Report** — write `reports/overnight_*.json` + markdown; exit non-zero on kill criteria

### Commands

```bash
npm run overnight          # full orchestrator (needs DATABASE_URL)
npm test                   # mer-core + mer-engine gates
npm run build              # all workspaces
```

### Kill criteria (exit 1)

- Spend recon breach >5%
- Tests fail in preflight
- (warn) below break-even MER, spend with zero allocation actions

## Cursor Automation prompt (paste into dashboard)

```
You are the Mcfly overnight operator. Read docs/MASTER_PLAN.md and docs/OVERNIGHT_ORCHESTRATOR.md.

Loop until no actionable failures:
1. Run npm test && npm run build
2. Run npm run overnight (or fix blockers)
3. If Shopify app build fails, fix minimal diff — no MTA/pixels
4. If kill criteria breach, open a PR with recon report — do not merge without human
5. Update docs/SHIP_CHECKLIST.md checkboxes only when verified

Refuse scope outside cash MER. Commit to cursor/mcfly-master-plan-eb36.
```

## Human gates (do not automate)

- Shopify Partner login / `shopify app config link`
- Meta / Google OAuth app review
- Production secrets rotation
- App Store submission
