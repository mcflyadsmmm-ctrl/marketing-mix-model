---
name: mcfly-cursor-optimizer
description: >-
  Optimize Mcfly Cursor prompts and Task subagents before spawn.
  Use when dispatching a cloud agent, Task subagent, Reviewer, or craft cook,
  or when a prompt looks like a swarm, a stale handoff, or a Grok 4.6 pin.
---

# Mcfly Cursor prompt + subagent optimizer

One Conductor. One writer per surface. A prompt ships only after the checker exits 0.

Grok 4.7 is the craft and Reviewer model: longer multi-file cooks, terminal recovery after a failed command, and a self-check before the summary. Grok 4.6 pins in older plans are retired for new spawns.

## Decide before you spawn

| Situation | Do this |
| --- | --- |
| One file, parent can edit and run the test | Parent does it. No subagent. |
| Status, scoreboard line, one curl | Parent. |
| Named cook, exclusive files, multi-file | One implementer. |
| Grade craft the parent just wrote | One Reviewer **after** the commit exists. |
| "Look around" / file hunt | `composer-2.5-fast` explore, or parent Grep. |
| Six named threads, overlapping files, stale Fly SHA | Stop. Rewrite to one cook. |

Max in flight: **1 implementer + 1 Reviewer**. A docs scout may run beside them only with a disjoint path list.

## Models (this account — do not invent slugs)

| Job | Slug |
| --- | --- |
| Long craft, honesty, Reviewer | `grok-4.7-xhigh` |
| Short single-surface implementer | `grok-4.7-high` |
| File hunt / test grep | `composer-2.5-fast` |
| Listing paste English | `gpt-5.6-sol-medium` |

Banned in new prompts: `cursor-grok-4.6-xhigh`, `cursor-grok-4.5-high-fast`, `inherit` for craft or Reviewer.

## Prompt shape

Use these headings. The checker rejects a prompt that skips one.

```text
ROLE: <one sentence — Craft | Reviewer | Scout>
BRANCH: <branch name>
BASE: <base branch>
FILES: <exclusive paths, one per line>
DONE: <one command that can fail, in backticks>
LOCKS: painted IA, $39, Live PARKED, no invented metrics
MUST NOT: fly deploy, merge, self-PASS, COGS, pixels, MTA, sixth tab
RETURN: SHA or PASS/FAIL, test count, one line
MODEL: grok-4.7-xhigh
```

`DONE` is a command the parent re-runs. A summary is not proof.

## After the subagent returns

1. Re-run the `DONE` command yourself.
2. If it fails, one fix prompt with the same `FILES`. Then stop and report the log.
3. Reviewer posts PASS/FAIL. Conductor merges and deploys Fly. Workers do neither.
4. Do not poll a background agent. Keep working on a disjoint surface or end the turn.

## Checker

```bash
node .cursor/skills/mcfly-cursor-optimizer/scripts/check-prompt.mjs path/to/prompt.md
```

Exit 0 means the prompt is spawnable. Exit 1 lists the missing headings, a banned model, or a `DONE` line with no command.
