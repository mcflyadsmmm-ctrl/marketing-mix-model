# Mcfly Sheets companion — enterprise orchestrator

Thin Google Sheets add-on that consumes the **same `/v1` MER API** as the Shopify app.

## vs Black Clover-style MER Dashboard

| Basic web app | Mcfly enterprise Sheets |
| --- | --- |
| Single MER table | Executive Summary + MER history + Allocation + Ops log |
| Manual refresh only | Hourly overnight triggers + daily email digest |
| No recon | ±5% spend drift detection + alerts |
| No allocation | Live cut/shift/hold/watch cards from `mer-core` |
| No audit trail | Ops log with phased timestamps |

## Files to copy into Apps Script

| File | Role |
| --- | --- |
| `Code.gs` | Menu + trigger install |
| `Api.gs` | REST client |
| `Orchestrator.gs` | Phased overnight loop |
| `Dashboard.gs` | Multi-tab rendering |
| `Alerts.gs` | Email + Slack |
| `appsscript.json` | Scopes |

## Script properties

| Key | Required | Example |
| --- | --- | --- |
| `MCFLY_API_BASE` | Yes | `https://app.mcflyads.com/v1` |
| `MCFLY_API_TOKEN` | Yes | from `node app/scripts/mint-api-token.mjs` |
| `MCFLY_SHOP_ID` | Recommended | `your-store.myshopify.com` |
| `MCFLY_ALERT_EMAIL` | No | `you@domain.com` |
| `MCFLY_SLACK_WEBHOOK` | No | Slack incoming webhook |
| `MCFLY_RECON_THRESHOLD` | No | `0.05` |

## Install

1. Paste all `.gs` files + `appsscript.json`
2. Set script properties
3. Reload sheet → **Mcfly Analytics → Install overnight triggers**

Full detail: [OVERNIGHT_ORCHESTRATOR.md](../docs/OVERNIGHT_ORCHESTRATOR.md)
