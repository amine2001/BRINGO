type DataTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

type DataTableRow = Record<string, React.ReactNode>;

type DataTableProps = {
  columns: DataTableColumn[];
  rows: DataTableRow[];
};

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[color:var(--dashboard-border)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[color:var(--dashboard-border)] text-sm">
          <thead className="bg-[color:var(--dashboard-surface-subtle)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={[
                    "px-4 py-3 text-xs font-medium uppercase tracking-[0.25em] text-[color:var(--dashboard-muted-text)]",
                    column.align === "right" ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--dashboard-border)] bg-[color:var(--dashboard-surface-muted)]">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-[color:var(--dashboard-surface-subtle)]">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={[
                      "px-4 py-4 align-top text-[color:var(--dashboard-body)]",
                      column.align === "right" ? "text-right" : "text-left",
                    ].join(" ")}
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
