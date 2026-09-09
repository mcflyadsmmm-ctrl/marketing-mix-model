import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
const spend = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");
const ltv = readFileSync(join(here, "../routes/app.ltv.tsx"), "utf8");
const goals = readFileSync(join(here, "../routes/app.goals.tsx"), "utf8");
const allocation = readFileSync(join(here, "../routes/app.allocation.tsx"), "utf8");
const advanced = readFileSync(join(here, "../routes/app.advanced.tsx"), "utf8");
const sampleBanner = readFileSync(
  join(here, "../components/SampleDeskBanner.tsx"),
  "utf8",
);
const dataMode = readFileSync(join(here, "../components/DataModeBar.tsx"), "utf8");

describe("Overview Monday desk", () => {
  it("leads with a cash verdict and warns untrusted periods", () => {
    expect(overview).toContain("CashVerdict");
    expect(overview).toContain("PeriodTrustNote");
    expect(overview).toContain("resolvePeriodTrust");
    expect(overview).not.toContain("mcfly-explorer-csv-bar");
    const verdict = readFileSync(
      join(here, "../components/CashVerdict.tsx"),
      "utf8",
    );
    expect(verdict).toMatch(/am I making money on ads/i);
  });

  it("demotes explorer and LTV snap until the multiple is trusted", () => {
    expect(overview).toContain("mcfly-me-spine--later");
    expect(overview).toMatch(/scoreboardReady && metrics\.cashActionReady/);
  });
});

describe("Spend ritual", () => {
  it("keeps paste + template + playbook visible on a blank desk", () => {
    expect(spend).toContain("formatMissingDaysRoasImpact");
    expect(spend).toContain("CASH_PAGE_WHY.spend");
    expect(spend).toContain("spendEmptyTeach");
    expect(spend).toContain("isActivationQuery");
    expect(spend).toMatch(/Paste spend CSV|pastePlaceholder|Paste one row/i);
    expect(spend).toMatch(/platform playbook|mcfly-spend-lean__playbook/i);
    expect(spend).toMatch(/SAMPLE_DESK_IMPORT_BLOCK|Turn Real store on/i);
  });
});

describe("Later pages have a cash why + soft gate", () => {
  it("wires DeskPageWhy and FirstTrustedRoasGate", () => {
    expect(goals).toContain("DeskPageWhy");
    expect(goals).toContain('page="goals"');
    expect(goals).toContain("FirstTrustedRoasGate");
    expect(ltv).toContain('page="ltv"');
    expect(ltv).toContain("ltvEmptyCashCopy");
    expect(allocation).toContain('page="allocation"');
    expect(advanced).toContain('page="advanced"');
    expect(advanced).toContain("FirstTrustedRoasGate");
  });
});

describe("SAMPLE money stamp", () => {
  it("renders a live stamp — not a no-op — and DataModeBar says not live money", () => {
    expect(sampleBanner).toContain("SAMPLE_MONEY_MARK");
    expect(sampleBanner).not.toMatch(/return null/);
    expect(dataMode).toMatch(/not your live Shopify money/i);
  });
});
