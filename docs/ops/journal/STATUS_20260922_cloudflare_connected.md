# Cloudflare Pages connection — 2026-09-22

**Did:** Prove Cloud Agent env can drive production Pages for `mcflyads` so later site cooks can Direct Upload without another token chase.

**Did not:** Print or commit token values. Unpark Live. Partner Submit. Change `LIVE_UNPAID_INGEST_DAYS`. Edit `fly.toml` scopes. Redeploy HTML (v32 `2166ceed` already live).

## Connection

| Check | Result |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` in Cloud Agent env | present |
| `npx wrangler@3 whoami` | Martysmithson04@gmail.com account `688e1bc6edab1941048f34abb72fa19e` |
| `pages project list` | `mcflyads` → mcflyads.com + mcflyads.pages.dev |
| Pages GET + PATCH `production_branch=main` (no-op write) | 200 |
| MCP `Cloudflare-bindings` KV list | `MCFLY_WAITLIST` `5d9e56c8e9644e58afff2395291589d5` |
| MCP Cloudflare-builds | still needs Cursor OAuth — Workers CI, not Pages |

## Live at stamp

- Site: https://mcflyads.com `mcfly-version` **v32** · Pages `2166ceed`
- App: https://mcfly-analytics.fly.dev **v435** · image `deployment-01M35CPHP06D8T0BJEHVZNV4A0` · Live PARKED · `/health` ok

Next site HTML cook: sample-lock → non-git temp of `site/` + `functions/` → `npx wrangler@3 pages deploy site --project-name=mcflyads --commit-dirty=true`. Never `--branch`.
