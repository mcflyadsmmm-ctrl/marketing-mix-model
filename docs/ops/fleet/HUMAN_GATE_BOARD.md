# Human gate board (founder daily)

**Parent:** [`../FLEET_ENTERPRISE.md`](../FLEET_ENTERPRISE.md)  
**Rule:** Agents **idle** when only HUMAN_GATE remains — do not invent features (failure A6 / E1).

| ID | Gate | Status | Unblock signal | Notes |
| --- | --- | --- | --- | --- |
| H1 | Partner MFA / login | open | `partner logged in` | |
| H2 | App Store Distribution / Submit | submitted | `approved` when live | Founder: submitted 2026-07-31 — wait on review |
| H3 | PCD questionnaire | open | `pcd done` | Level 1 only |
| H4 | Install smoke design partner | open | `install works` | [`INSTALL_SMOKE.md`](../../INSTALL_SMOKE.md) |
| H5 | Listing shots / screencast / emergency contact | open | `listing pack uploaded` | |
| H6 | Host billing card (Fly/Neon) when free exhausted | watching | `billing done` | Only after first $ preferred |
| H7 | Gumroad account (MDS Made Easy) | open | `gumroad live` | Education Wave 1 |
| H8 | Stripe Payment Link (Custom DS) | open | `stripe custom live` | Services Wave 1 |
| H9 | Managed Pricing Pro announce | open | `billing announced` | After partners prove WTP |
| H10 | DNS cutover (static host change) | idle | `dns done` | CF Pages SoT — freeze unless needed |
| H11 | Design-partner store access | open | `partner store ready` | |
| H12 | Religion amendment (SyncWith/MTA) | blocked | written MASTER_PLAN edit | Default: refuse |

### Founder cadence

1. Clear oldest **open** gate that unblocks Wave 1 money  
2. Reply in Conductor chat with the unblock signal phrase  
3. Fleet resumes from QUEUE — does not invent parallel scope  
