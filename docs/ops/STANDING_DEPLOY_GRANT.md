# Standing founder grants

**Effective until founder revokes** (`revoke deploy` / `stop deploy`).

**Founder order 2026-08-25 (do not re-ask):**  
“Stop asking for permission to update Fly. I always want you to push and have Fly up to date. Standing full permission to deploy the most recent and best always.”

| Grant | Scope |
| --- | --- |
| **Fly deploy** | Always. After ship-gate PASS on app changes, run `fly deploy -a mcfly-analytics --yes` (or equivalent) in the same turn. Do **not** ask. Do **not** wait for a per-turn “deploy app” phrase. Push the branch first, then deploy the image that contains that work. |
| **What to deploy** | The **most recent and best live desk**: finished, tested desk work (allocation, LTV, usability, App Store hardening) merged onto the Fly line — not an older PR that is missing later fixes. |
| **Pages deploy** | When site ticks land |
| **Autonomy** | Keep improving without waiting for per-turn `deploy app` |

**Still HUMAN (never agent-submit):** Partner MFA, Distribution, PCD, App Store Submit, Meta/Google App Review, billing card, DNS.

## Agent rules

1. Never prompt the founder to approve a Fly deploy. This file is the approval.
2. If app code shipped this turn and `bash scripts/agent-ship-gate.sh` (or `SKIP_HEALTH=1` local gate + tests) passes, deploy before the turn ends.
3. After deploy: curl `https://mcfly-analytics.fly.dev/health` and record version (`fly status -a mcfly-analytics`).
4. Do not deploy broken trees. Gate fail → fix, then deploy. Do not skip Fly to “be safe.”
5. Live App URL stays `https://mcfly-analytics.fly.dev`. Never point App URL at the marketing site.
