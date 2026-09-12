/**
 * Pipe-template discoverability for Spend.
 *
 * The merchant (or the SyncWith / Coupler / Supermetrics / Coefficient
 * subscription they already pay for) owns every ad-platform login. Mcfly only
 * publishes the CSV shape those tools should write, then imports it — no
 * Meta/Google OAuth, no "Works with" claim, no pixels.
 *
 * There is no Automate tab. These two downloads are the whole surface, so the
 * anchor and hrefs here are what listing copy and the reviewer script cite.
 */

import { PIPE_LONG_HEADERS } from "./spend-csv";

export type PipeTemplateShape = "long" | "wide";
export type PipeTemplateVariant = "blank" | "example";

/** In-page anchor for every "automate the fill" link on Spend. */
export const PIPE_TEMPLATE_ANCHOR = "mcfly-spend-pipe";
export const PIPE_TEMPLATE_HREF = `#${PIPE_TEMPLATE_ANCHOR}`;

/** Matches the `?pipe=long|wide` branches in app.spend.template.tsx. */
export function pipeTemplateHref(
  shape: PipeTemplateShape,
  variant: PipeTemplateVariant = "example",
): string {
  const params = new URLSearchParams({ pipe: shape });
  params.set(variant === "blank" ? "blank" : "example", "1");
  return `/app/spend/template?${params.toString()}`;
}

export type PipeTemplateOption = {
  shape: PipeTemplateShape;
  title: string;
  /** Header row a pipe tool must write, verbatim. */
  headers: string;
  hint: string;
  exampleHref: string;
  blankHref: string;
};

export const PIPE_TEMPLATE_OPTIONS: readonly PipeTemplateOption[] = [
  {
    shape: "long",
    title: "Long template",
    headers: PIPE_LONG_HEADERS.join(","),
    hint: "One row per day × channel — the shape most pipe tools write by default.",
    exampleHref: pipeTemplateHref("long", "example"),
    blankHref: pipeTemplateHref("long", "blank"),
  },
  {
    shape: "wide",
    title: "Wide template",
    headers: "Day + one column per channel",
    hint: "One row per day. Same headers as the blank template above, so import is identical.",
    exampleHref: pipeTemplateHref("wide", "example"),
    blankHref: pipeTemplateHref("wide", "blank"),
  },
];

/**
 * Nominative tool names only — Mcfly is not partnered with, endorsed by, or
 * integrated with any of them, and the merchant pays them directly.
 */
export const PIPE_TOOL_NAMES = [
  "SyncWith",
  "Coupler",
  "Supermetrics",
  "Coefficient",
] as const;

export const PIPE_TEMPLATE_COPY = {
  /** Carries both words a merchant might scan for: pipe and automate. */
  summary: "Pipe templates — automate the fill (optional)",
  linkLabel: "Automate the fill with a pipe tool",
  hint: `Keep a Google Sheet (via ${PIPE_TOOL_NAMES.join(", ")}) that lands spend on these headers — paste CSV when you want Total ROAS. No ad login here, no daily typing ritual.`,
  steps: [
    `Subscribe to a spreadsheet pipe tool you already trust — ${PIPE_TOOL_NAMES.join(", ")}. It owns the ad-platform login; Mcfly never asks for one.`,
    "Download a template below and use its header row as the target sheet shape.",
    "Point the pipe at those exact headers — ad spend by day. Sales stay in Shopify.",
    "Export the sheet as CSV and paste or import it below. Same day + channel replaces, never doubles.",
  ],
  honesty:
    "Not a “Works with” partnership and not an integration — you pay those tools directly, and Mcfly only reads the CSV. Pasting spend by hand is always enough.",
  exampleLabel: "Download with example rows",
  blankLabel: "Download blank",
} as const;
