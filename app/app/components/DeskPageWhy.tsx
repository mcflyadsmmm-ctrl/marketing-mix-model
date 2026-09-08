import { CASH_PAGE_WHY, type CashPageId } from "../lib/cash-desk-copy";

export function DeskPageWhy({ page }: { page: CashPageId }) {
  return <p className="mcfly-desk-why">{CASH_PAGE_WHY[page]}</p>;
}
