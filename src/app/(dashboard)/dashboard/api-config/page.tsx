import { formatDistanceToNow } from "date-fns";

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { saveApiConfigAction } from "@/lib/dashboard/actions";
import { getApiConfigPageData } from "@/lib/dashboard/queries";
import { requireCompanyContext } from "@/lib/tenant/context";

export default async function ApiConfigPage() {
  const context = await requireCompanyContext();
  const data = await getApiConfigPageData(context.company.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="API Config"
        title="Configure Redash ingestion without exposing secrets"
        description="This page models the operational inputs for the Redash API URL, API key management, polling cadence, and parser expectations."
      />

      <SectionCard
        title="Connection health"
        description="Operators need a quick snapshot of the current ingestion posture before changing credentials."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">Current state</p>
            <div className="mt-3">
              <StatusPill tone={data.config ? "good" : "warn"}>
                {data.config ? "Configured" : "Missing config"}
              </StatusPill>
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">Last successful sync</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {data.lastSyncedAt
                ? formatDistanceToNow(data.lastSyncedAt, { addSuffix: true })
                : "No sync yet"}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">Response format</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {data.config?.responseFormat?.toUpperCase() ?? "AUTO"}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">Polling interval</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {data.config?.pollIntervalSeconds ?? 60} seconds
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Redash connection settings"
        description="Fields are arranged to match the future secure config flow: URL, API key, response format, and polling cadence."
      >
        <form action={saveApiConfigAction} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300 lg:col-span-2">
            <span className="block font-medium text-white">Redash API URL</span>
            <input
              name="redashApiUrl"
              type="url"
              defaultValue={data.config?.redashApiUrl ?? ""}
              placeholder="https://redash.example.com/api/queries/42/results.json"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">API key</span>
            <input
              name="redashApiKey"
              type="password"
              placeholder={data.config ? "Leave blank to keep current key" : "Paste the Redash API key"}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Response format</span>
            <select
              name="responseFormat"
              defaultValue={data.config?.responseFormat ?? "auto"}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            >
              <option value="auto">AUTO</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Polling interval (seconds)</span>
            <input
              name="pollIntervalSeconds"
              type="number"
              defaultValue={data.config?.pollIntervalSeconds ?? 60}
              placeholder="60"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5 lg:col-span-2">
            <p className="text-sm font-medium text-white">Expected normalized fields</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "order_id",
                "store_name",
                "delivery_type",
                "status",
                "created_at",
                "delay_minutes",
              ].map((field) => (
                <StatusPill key={field} tone="neutral">
                  {field}
                </StatusPill>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Save API configuration
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
