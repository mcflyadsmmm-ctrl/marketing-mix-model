/**
 * Dated unit costs from a file the merchant uploads.
 * A cost is provisional until an invoice settles it.
 * A later invoice is visible and does not rewrite a closed period.
 * A missing cost stays blank. Restock is not folded into what is left.
 */

import type { VariantLine } from "./reconciliation-gap";

export type CostStatus = "provisional" | "settled";

export type CostRow = {
  variant: string;
  startDate: string;
  unitCost: number;
  status: CostStatus;
  invoiceDate: string | null;
};

export type CostFile = {
  closedThrough: string | null;
  rows: CostRow[];
};

export type UnitCostOnDay = {
  unitCost: number | null;
  status: CostStatus | "missing";
};

export type CostChange = {
  variant: string;
  closedUnitCost: number | null;
  openUnitCost: number | null;
  change: number | null;
  status: CostStatus | "missing";
};

export type VariantRank = {
  variantId: string;
  label: string;
  left: number | null;
  restock: number | null;
  unitCost: number | null;
  changePerUnit: number | null;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseCostFile(text: string): CostFile {
  const rows: CostRow[] = [];
  let closedThrough: string | null = null;
  const lines = text.split(/\r?\n/);
  let header: string[] | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const cells = splitCsv(line);
    if (cells[0]?.toLowerCase() === "closed_through" && cells[1] && DAY.test(cells[1])) {
      closedThrough = cells[1];
      continue;
    }
    if (!header) {
      header = cells.map((cell) => cell.trim().toLowerCase());
      continue;
    }
    const record = recordFrom(header, cells);
    const variant = record.variant?.trim() ?? "";
    const startDate = record.start_date?.trim() ?? "";
    const statusRaw = record.status?.trim().toLowerCase() ?? "";
    const costRaw = record.unit_cost?.trim() ?? "";
    const invoiceRaw = record.invoice_date?.trim() ?? "";
    if (!variant || !DAY.test(startDate)) continue;
    if (statusRaw !== "provisional" && statusRaw !== "settled") continue;
    if (costRaw === "") continue;
    const unitCost = Number(costRaw);
    if (!Number.isFinite(unitCost)) continue;
    const invoiceDate = DAY.test(invoiceRaw) ? invoiceRaw : null;
    if (statusRaw === "settled" && invoiceDate == null) continue;
    rows.push({
      variant,
      startDate,
      unitCost,
      status: statusRaw,
      invoiceDate,
    });
  }
  return { closedThrough, rows };
}

function recordFrom(header: string[], cells: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  header.forEach((key, index) => {
    out[key] = cells[index] ?? "";
  });
  return out;
}

function splitCsv(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function rowsFor(file: CostFile, variant: string): CostRow[] {
  return file.rows.filter((row) => row.variant === variant);
}

/**
 * Unit cost in force on a shop day.
 * Rows invoiced after a close do not apply on or before that close.
 */
export function unitCostForDay(
  file: CostFile,
  variant: string,
  day: string,
): UnitCostOnDay {
  const eligible = rowsFor(file, variant).filter((row) => {
    if (row.startDate > day) return false;
    if (
      file.closedThrough &&
      day <= file.closedThrough &&
      row.invoiceDate != null &&
      row.invoiceDate > file.closedThrough
    ) {
      return false;
    }
    return true;
  });
  if (eligible.length === 0) return { unitCost: null, status: "missing" };
  eligible.sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate < b.startDate ? 1 : -1;
    const aInvoice = a.invoiceDate ?? "";
    const bInvoice = b.invoiceDate ?? "";
    if (aInvoice === bInvoice) return 0;
    return aInvoice < bInvoice ? 1 : -1;
  });
  const picked = eligible[0];
  if (!picked) return { unitCost: null, status: "missing" };
  return { unitCost: picked.unitCost, status: picked.status };
}

export function costChanges(file: CostFile, asOf: string): CostChange[] {
  const variants = [...new Set(file.rows.map((row) => row.variant))].sort();
  return variants.map((variant) => {
    const open = unitCostForDay(file, variant, asOf);
    const closed =
      file.closedThrough != null
        ? unitCostForDay(file, variant, file.closedThrough)
        : open;
    const change =
      closed.unitCost == null || open.unitCost == null
        ? null
        : open.unitCost - closed.unitCost;
    return {
      variant,
      closedUnitCost: file.closedThrough ? closed.unitCost : null,
      openUnitCost: open.unitCost,
      change: change === 0 ? null : change,
      status: open.status,
    };
  });
}

/**
 * Rank by what is left after costs we have. Returns stay in the net.
 * Restock is its own field. A missing cost leaves `left` blank.
 */
export function rankVariants(input: {
  lines: VariantLine[];
  file: CostFile;
  asOf: string;
}): VariantRank[] {
  const ranked = input.lines.map((line) => {
    const cost = unitCostForDay(input.file, line.label, input.asOf);
    const byId = unitCostForDay(input.file, line.variantId, input.asOf);
    const picked = cost.unitCost != null ? cost : byId;
    const closedThrough = input.file.closedThrough;
    const closed = closedThrough
      ? unitCostForDay(input.file, line.label, closedThrough)
      : picked;
    const changePerUnit =
      closed.unitCost == null || picked.unitCost == null
        ? null
        : picked.unitCost - closed.unitCost || null;
    const left =
      line.netAfterReturns == null ||
      line.units == null ||
      picked.unitCost == null
        ? null
        : line.netAfterReturns - picked.unitCost * line.units;
    return {
      variantId: line.variantId,
      label: line.label,
      left,
      restock: line.restock,
      unitCost: picked.unitCost,
      changePerUnit: changePerUnit === 0 ? null : changePerUnit,
    };
  });
  ranked.sort((a, b) => {
    if (a.left == null && b.left == null) return a.label.localeCompare(b.label);
    if (a.left == null) return 1;
    if (b.left == null) return -1;
    return b.left - a.left || a.label.localeCompare(b.label);
  });
  return ranked;
}
