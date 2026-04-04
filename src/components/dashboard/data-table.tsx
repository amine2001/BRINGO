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
    <div className="overflow-hidden rounded-[24px] border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={[
                    "px-4 py-3 text-xs font-medium uppercase tracking-[0.25em] text-slate-400",
                    column.align === "right" ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/35">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-white/4">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={[
                      "px-4 py-4 align-top text-slate-200",
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
