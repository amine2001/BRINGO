import { formatDistanceToNow } from "date-fns";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { runManualPollAction } from "@/lib/dashboard/actions";
import { getDashboardOverviewData } from "@/lib/dashboard/queries";
import { requireCompanyContext } from "@/lib/tenant/context";

function statusTone(status: string) {
  switch (status) {
    case "delivered":
      return "good" as const;
    case "accepted":
      return "info" as const;
    case "prepared":
      return "neutral" as const;
    default:
      return "warn" as const;
  }
}

function categoryTone(category: string) {
  switch (category) {
    case "notification":
      return "info" as const;
    case "delay_alert":
      return "warn" as const;
    case "system":
      return "neutral" as const;
    case "order_processing":
      return "good" as const;
    default:
      return "danger" as const;
  }
}

export default async function DashboardOverviewPage() {
  const context = await requireCompanyContext();
  const data = await getDashboardOverviewData(context.company.id);

  const metrics = [
    {
      label: "Orders in motion",
      value: String(data.metrics.ordersInMotion),
      hint: "Tracked across the active store and delivery-type configuration.",
    },
    {
      label: "Notifications pending stop condition",
      value: String(data.metrics.pendingNotifications),
      hint: "Orders still eligible for reminder dispatch.",
      tone: "warn" as const,
    },
    {
      label: "Delay alerts raised today",
      value: String(data.metrics.delayAlertsToday),
      hint: "Admin escalations dispatched since the start of the day.",
      tone: "good" as const,
    },
    {
      label: "Telegram delivery success",
      value: data.metrics.telegramDeliverySuccess,
      hint: "Estimated from the recent operational log window.",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Live command center"
        description="Track the flow from Redash ingestion to notification dispatch and admin escalation. This overview is intentionally operational: it surfaces order pressure, alerting posture, and the most recent automation outcomes."
        actions={
          <>
            <button className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/12">
              Export operational snapshot
            </button>
            <form action={runManualPollAction}>
              <button className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15">
                Run manual poll
              </button>
            </form>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Operational queue"
          description="Orders most likely to require intervention or continued automated notifications."
        >
          <div className="space-y-4">
            {data.recentOrders.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-white/10 bg-white/4 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-white">
                        #{item.orderId}
                      </p>
                      <StatusPill tone="info">{item.deliveryType}</StatusPill>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{item.storeName}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      Last seen{" "}
                      {formatDistanceToNow(item.lastSeenAt, { addSuffix: true })}
                    </p>
                  </div>
                  <StatusPill tone={statusTone(item.status)}>
                    {item.status}
                  </StatusPill>
                </div>
              </div>
            ))}
            {data.recentOrders.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/15 bg-white/3 p-6 text-sm text-slate-400">
                No orders have been processed yet for this tenant.
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent automation events"
          description="High-signal activity from the last polling windows."
        >
          <div className="space-y-4">
            {data.recentLogs.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[22px] border border-white/10 bg-slate-900/65 p-4 text-sm leading-7 text-slate-300"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill tone={categoryTone(entry.category)}>
                    {entry.category}
                  </StatusPill>
                  <span className="font-mono text-xs text-slate-500">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 text-slate-100">{entry.message}</p>
              </div>
            ))}
            {data.recentLogs.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-white/15 bg-white/3 p-4 text-sm text-slate-400">
                No logs have been recorded yet.
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
