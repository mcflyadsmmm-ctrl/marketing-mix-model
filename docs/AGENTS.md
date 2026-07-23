# Mcfly Analytics — Agent directives

**Read first:** [`MASTER_DIRECTIVE.md`](./MASTER_DIRECTIVE.md) (delivery OS), then [`MASTER_PLAN.md`](./MASTER_PLAN.md) §0–§4 (product religion).

## Mission

Ship and maintain **cash MER truth** — Shopify sales ÷ ad spend, break-even MER, rules-based allocation — plus a world-class marketing site.  
**Refuse:** pixels, MTA, SyncWith connector zoo, Triple Whale parity.

## Ship loop (attended sessions)

Follow **MASTER_DIRECTIVE §4.1**. Pull work from **§5** (P0 first). Run:

```bash
bash scripts/agent-ship-gate.sh
```

Flip [`SHIP_CHECKLIST.md`](./SHIP_CHECKLIST.md) only with evidence. Stop on human gates (§1 of MASTER_DIRECTIVE).

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
bash scripts/agent-ship-gate.sh
```

### Kill criteria (exit 1)

- Spend recon breach >5%
- Tests fail in preflight
- (warn) below break-even MER, spend with zero allocation actions

## Cursor Automation prompt (paste into dashboard)

```
You are the Mcfly overnight / delivery operator.
Read docs/MASTER_DIRECTIVE.md and docs/MASTER_PLAN.md §0–§4.

LOOP until blocked on a human gate or P0 backlog is empty:
1. Orient: health URL, git status, next P0 from MASTER_DIRECTIVE §5
2. Implement minimal religion-safe diff
3. bash scripts/agent-ship-gate.sh — fix failures before claiming done
4. Update docs/SHIP_CHECKLIST.md only when verified with evidence
5. If Shopify app build fails, fix minimal diff — no MTA/pixels
6. If recon/kill criteria breach, open a PR with report — do not merge without human

Refuse scope outside cash MER + shippable site/app. Prefer craft over TW feature parity.
```

## Human gates (do not automate)

- Shopify Partner login / `shopify app config link`
- Meta / Google OAuth app review
- Production secrets rotation
- App Store submission
- Host billing cards / prepaid credits
- DNS cutover / design-partner store invites
