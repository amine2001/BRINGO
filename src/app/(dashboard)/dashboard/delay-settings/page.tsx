import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { saveDelaySettingsAction } from "@/lib/dashboard/actions";
import { getDelaySettingsPageData } from "@/lib/dashboard/queries";
import { requireCompanyContext } from "@/lib/tenant/context";

const thresholdColumns = [
  { key: "threshold", label: "Delay threshold" },
  { key: "adminChat", label: "Admin Telegram chat" },
  { key: "status", label: "Status" },
];

export default async function DelaySettingsPage() {
  const context = await requireCompanyContext();
  const data = await getDelaySettingsPageData(context.company.id);
  const thresholdRows = data.settings
    ? [
        {
          threshold: `${data.settings.delayThresholdMinutes} minutes`,
          adminChat: (
            <span className="font-mono text-xs">
              {data.settings.telegramAdminChatId}
            </span>
          ),
          status: (
            <StatusPill tone={data.settings.isActive ? "good" : "neutral"}>
              {data.settings.isActive ? "Active" : "Paused"}
            </StatusPill>
          ),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Delay Settings"
        title="Escalate delayed orders to admin channels"
        description="Delay thresholds and admin Telegram destinations are separated from store routing so escalation policy stays explicit and auditable."
      />

      <SectionCard
        title="Current escalation policies"
        description="Delay escalation uses one admin destination and one threshold across the operation."
      >
        <DataTable columns={thresholdColumns} rows={thresholdRows} />
      </SectionCard>

      <SectionCard
        title="Configure delay alerting"
        description="Threshold minutes and admin chat identifiers are surfaced together because they work as one operational policy."
      >
        <form action={saveDelaySettingsAction} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Admin Telegram chat ID</span>
            <input
              name="telegramAdminChatId"
              type="text"
              defaultValue={data.settings?.telegramAdminChatId ?? ""}
              placeholder="-1002176999001"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Delay threshold (minutes)</span>
            <input
              name="delayThresholdMinutes"
              type="number"
              defaultValue={data.settings?.delayThresholdMinutes ?? 15}
              placeholder="15"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Alerts enabled</span>
            <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-200">
              <input
                name="enabled"
                type="checkbox"
                defaultChecked={data.settings?.isActive ?? true}
                className="h-4 w-4 rounded border-slate-500"
              />
              Send admin alerts when the threshold is exceeded
            </span>
          </label>
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Save delay settings
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
