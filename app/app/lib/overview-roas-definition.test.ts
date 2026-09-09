import { describe, expect, it } from "vitest";
import { PRODUCT_NOUN } from "./product-labels";
import { OVERVIEW_TOTAL_ROAS_DEFINITION } from "./overview-roas-definition";

describe("OVERVIEW_TOTAL_ROAS_DEFINITION (Love-UX6)", () => {
  it("states Total ROAS as Shopify Total Sales ÷ entered spend, averages only", () => {
    expect(OVERVIEW_TOTAL_ROAS_DEFINITION).toBe(
      `${PRODUCT_NOUN.totalRoas} = ${PRODUCT_NOUN.salesBasisShort} ÷ spend you entered — averages, not channel truth`,
    );
    expect(OVERVIEW_TOTAL_ROAS_DEFINITION).toContain(PRODUCT_NOUN.totalRoas);
    expect(OVERVIEW_TOTAL_ROAS_DEFINITION).toContain(PRODUCT_NOUN.salesBasisShort);
    expect(OVERVIEW_TOTAL_ROAS_DEFINITION).toMatch(/spend you entered/i);
    expect(OVERVIEW_TOTAL_ROAS_DEFINITION).toMatch(/averages, not channel truth/i);
    // No invented multiples — formula literacy only.
    expect(OVERVIEW_TOTAL_ROAS_DEFINITION).not.toMatch(/\d+\s*[x×]|[x×]\s*\d+/i);
    expect(OVERVIEW_TOTAL_ROAS_DEFINITION).not.toMatch(/pixel|oauth|mta|true roas/i);
  });
});
