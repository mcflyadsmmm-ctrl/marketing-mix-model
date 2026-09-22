# Site v42 shipped on Pages and Fly — 2026-09-22

**Did:** Direct Upload production Pages `575d709f`. Fly wrap **v445** `deployment-01M35NF9DV2DJFS0ZQMW8YA3M9`. Drop `/product` Goals sales-plan row and collage `Monthly sales plan`. `/inquire` 301 `/support`. Privacy date September 22.

**Did not:** Revert FAQ H1 to “FAQ” (listing-chrome stays `0 reviews. Median ticket.`). Partner listing Save. Change locked home H1. Execute ShopifyQL-wait. Unpark Live.

## Live proof (curl, 2026-09-22T22:59Z)

| URL | Result |
| --- | --- |
| https://mcflyads.com/ | HTTP 200 · **v42** · locked H1 · no `Monthly sales plan` |
| https://mcflyads.com/product | **v42** · Goals row is native Overview targets + optional Total ROAS vs break-even · no `Sales vs the calendar` |
| https://mcflyads.com/faq | **v42** · H1 `0 reviews. Median ticket.` |
| https://mcflyads.com/inquire | **301** `/support` |
| Fly `/` | **v42** |
| Fly `/health` | 200 |

Harvested: [Adversarial walk of live v38](bc-bd509a01-6ff6-5779-8160-88c4eb1d224d). Research branches stay unmerged.

Commits: `5fb0633` HTML · this stamp on `cursor/site-world-class-5bc6` · PR #191.
