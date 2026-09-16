export type DeskIconName =
  | "sales"
  | "roas"
  | "spend"
  | "orders"
  | "customers"
  | "clock"
  | "weekend"
  | "chart"
  | "yoy";

const PATHS: Record<DeskIconName, string> = {
  sales:
    "M4 7h16v12H4z M8 7V5a4 4 0 0 1 8 0v2 M4 11h16",
  roas:
    "M5 16l4-4 3 3 7-7 M14 8h5v5",
  spend:
    "M12 3v18 M8 8h5.5a2.5 2.5 0 0 1 0 5H9a2.5 2.5 0 0 0 0 5h7",
  orders:
    "M7 4h10l1 4H6z M6 8h12v11H6z M9 12h6",
  customers:
    "M12 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 11z M5 19a7 7 0 0 1 14 0",
  clock:
    "M12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8z M12 8v4l3 2",
  weekend:
    "M5 10h14 M7 6h2 M15 6h2 M6 10v9h12v-9",
  chart:
    "M5 19V9 M10 19V5 M15 19v-7 M20 19V11",
  yoy:
    "M4 19V5h4l3 6 3-6h4v14",
};

export function DeskIcon({
  name,
  className,
}: {
  name: DeskIconName;
  className?: string;
}) {
  return (
    <svg
      className={["mcfly-icon", className].filter(Boolean).join(" ")}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
