import { describe, expect, it } from "vitest";
import {
  buildPipeAutomationLongTemplate,
  buildPipeAutomationWideTemplate,
  PIPE_LONG_HEADERS,
  parseSpendCsv,
} from "./spend-csv";
import {
  PIPE_TEMPLATE_ANCHOR,
  PIPE_TEMPLATE_COPY,
  PIPE_TEMPLATE_HREF,
  PIPE_TEMPLATE_OPTIONS,
  PIPE_TOOL_NAMES,
  pipeTemplateHref,
} from "./spend-pipe-templates";

const THEATER =
  /pixel|web pixel|multi-touch|mta|markov|shapley|true roas|view-through|path credit/i;
/** A pipe tool is merchant-paid and nominative — never a partnership claim. */
const PARTNER_CLAIM = /works with|official (partner|integration)|powered by|endorsed/i;
const OAUTH = /oauth|connect (your )?(meta|google|facebook)|log in with/i;

const ALL_COPY = [
  PIPE_TEMPLATE_COPY.summary,
  PIPE_TEMPLATE_COPY.linkLabel,
  PIPE_TEMPLATE_COPY.hint,
  PIPE_TEMPLATE_COPY.honesty,
  PIPE_TEMPLATE_COPY.exampleLabel,
  PIPE_TEMPLATE_COPY.blankLabel,
  ...PIPE_TEMPLATE_COPY.steps,
  ...PIPE_TEMPLATE_OPTIONS.flatMap((o) => [o.title, o.headers, o.hint]),
];

describe("pipeTemplateHref", () => {
  it("hits the ?pipe= branches the template route serves", () => {
    expect(pipeTemplateHref("long")).toBe(
      "/app/spend/template?pipe=long&example=1",
    );
    expect(pipeTemplateHref("long", "blank")).toBe(
      "/app/spend/template?pipe=long&blank=1",
    );
    expect(pipeTemplateHref("wide", "example")).toBe(
      "/app/spend/template?pipe=wide&example=1",
    );
    expect(pipeTemplateHref("wide", "blank")).toBe(
      "/app/spend/template?pipe=wide&blank=1",
    );
  });

  it("never points at a tab that does not exist", () => {
    const hrefs = PIPE_TEMPLATE_OPTIONS.flatMap((o) => [
      o.exampleHref,
      o.blankHref,
    ]);
    expect(hrefs).toHaveLength(4);
    for (const href of hrefs) {
      expect(href.startsWith("/app/spend/template?pipe=")).toBe(true);
    }
    expect(PIPE_TEMPLATE_HREF).toBe(`#${PIPE_TEMPLATE_ANCHOR}`);
  });
});

describe("PIPE_TEMPLATE_OPTIONS", () => {
  it("offers exactly the long and wide shapes", () => {
    expect(PIPE_TEMPLATE_OPTIONS.map((o) => o.shape)).toEqual(["long", "wide"]);
  });

  it("quotes the long header row the served CSV actually uses", () => {
    const long = PIPE_TEMPLATE_OPTIONS.find((o) => o.shape === "long");
    expect(long?.headers).toBe(PIPE_LONG_HEADERS.join(","));
    expect(
      buildPipeAutomationLongTemplate({ dayCount: 1 }).split("\n")[0],
    ).toBe(long?.headers);
  });

  it("serves CSV both shapes can round-trip back through import", () => {
    for (const body of [
      buildPipeAutomationLongTemplate({ dayCount: 2, example: true }),
      buildPipeAutomationWideTemplate({ dayCount: 2, example: true }),
    ]) {
      const parsed = parseSpendCsv(body);
      expect(parsed.errors).toEqual([]);
      expect(parsed.rows.length).toBeGreaterThan(0);
    }
  });
});

describe("PIPE_TEMPLATE_COPY", () => {
  it("is findable by a merchant scanning for pipe or automate", () => {
    expect(PIPE_TEMPLATE_COPY.summary).toMatch(/pipe/i);
    expect(PIPE_TEMPLATE_COPY.summary).toMatch(/automate/i);
    expect(PIPE_TEMPLATE_COPY.linkLabel).toMatch(/automate/i);
  });

  it("names pipe tools nominatively and keeps them merchant-paid", () => {
    for (const tool of PIPE_TOOL_NAMES) {
      expect(PIPE_TEMPLATE_COPY.hint).toContain(tool);
    }
    expect(PIPE_TEMPLATE_COPY.honesty).toMatch(/you pay those tools/i);
    expect(PIPE_TEMPLATE_COPY.steps.join(" ")).toMatch(
      /never asks for one|owns the ad-platform login/i,
    );
  });

  it("promises no OAuth, no partnership, and no attribution theater", () => {
    for (const line of ALL_COPY) {
      expect(line).not.toMatch(THEATER);
      expect(line).not.toMatch(OAUTH);
    }
    // "Works with" appears only where it is explicitly refused.
    for (const line of ALL_COPY.filter((l) => l !== PIPE_TEMPLATE_COPY.honesty)) {
      expect(line).not.toMatch(PARTNER_CLAIM);
    }
    expect(PIPE_TEMPLATE_COPY.honesty).toMatch(
      /not a “Works with” partnership/i,
    );
  });

  it("keeps spend-only scope — sales stay in Shopify", () => {
    expect(PIPE_TEMPLATE_COPY.steps.join(" ")).toMatch(
      /sales stay in shopify/i,
    );
  });
});
