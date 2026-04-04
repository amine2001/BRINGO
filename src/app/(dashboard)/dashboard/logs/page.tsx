import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { getLogsPageData } from "@/lib/dashboard/queries";
import { requireCompanyContext } from "@/lib/tenant/context";

const logColumns = [
  { key: "timestamp", label: "Timestamp" },
  { key: "category", label: "Category" },
  { key: "message", label: "Message" },
  { key: "context", label: "Context" },
];

function toneForLevel(level: string) {
  switch (level) {
    case "error":
      return "danger" as const;
    case "warn":
      return "warn" as const;
    default:
      return "good" as const;
  }
}

export default async function LogsPage() {
  const context = await requireCompanyContext();
  const data = await getLogsPageData(context.company.id);

  const logRows = data.logs.map((entry) => ({
    timestamp: (
      <span className="font-mono text-xs">
        {new Date(entry.createdAt).toLocaleString()}
      </span>
    ),
    category: (
      <div className="flex flex-wrap gap-2">
        <StatusPill tone={toneForLevel(entry.level)}>{entry.level}</StatusPill>
        <StatusPill tone="neutral">{entry.categoryLabel}</StatusPill>
      </div>
    ),
    message: entry.message,
    context: <code className="text-xs text-slate-400">{JSON.stringify(entry.context)}</code>,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Logs"
        title="Audit order processing, notifications, and failures"
        description="The logs workspace is optimized for operations teams that need to trace exactly what happened across ingestion, routing, repeat logic, and admin alerts."
      />

      <SectionCard
        title="Log filters"
        description="Filter controls are staged here so they can be wired to server actions or search params later."
      >
        <form className="grid gap-4 lg:grid-cols-4">
          <input
            type="search"
            placeholder="Search by order ID, store, or error text"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 lg:col-span-2"
          />
          <select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15">
            <option>All categories</option>
            <option>ORDER</option>
            <option>NOTIFY</option>
            <option>DELAY</option>
            <option>ERROR</option>
          </select>
          <select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15">
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </form>
      </SectionCard>

      <SectionCard
        title="Recent events"
        description="Structured output keeps the audit trail useful even before backend pagination and filtering are connected."
      >
        <DataTable columns={logColumns} rows={logRows} />
      </SectionCard>
    </div>
  );
}
