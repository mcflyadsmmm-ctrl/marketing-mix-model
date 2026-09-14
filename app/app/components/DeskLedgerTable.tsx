/**
 * Shared ledger table chrome — Days / Orders / Buyers / Cohorts.
 */

export type DeskLedgerColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export function DeskLedgerTable({
  caption,
  columns,
  rows,
  emptyMessage,
}: {
  caption: string;
  columns: DeskLedgerColumn[];
  rows: Array<Record<string, string>>;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="mcfly-desk-ledger__empty" role="status">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="mcfly-desk-ledger">
      <div className="mcfly-desk-ledger__scroll">
        <table className="mcfly-desk-ledger__table">
          <caption className="mcfly-desk-ledger__caption">{caption}</caption>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={
                    col.align === "right"
                      ? "mcfly-desk-ledger__th mcfly-desk-ledger__th--right"
                      : "mcfly-desk-ledger__th"
                  }
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={
                      col.align === "right"
                        ? "mcfly-desk-ledger__td mcfly-desk-ledger__td--right"
                        : "mcfly-desk-ledger__td"
                    }
                  >
                    {row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mcfly-desk-ledger__count">
        {rows.length.toLocaleString()} row{rows.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
