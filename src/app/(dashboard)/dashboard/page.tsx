import { formatDistanceToNow } from "date-fns";
import { faTruckFast, faBell, faTriangleExclamation, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { isSuperUserRole } from "@/lib/auth/roles";
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

export default async function DashboardOverviewPage() {
  const context = await requireCompanyContext();
  const data = await getDashboardOverviewData(context.company.id);
  const canSeeOverviewActions = isSuperUserRole(context.profile?.role);

  const metrics = [
    {
      label: "Orders in motion",
      value: String(data.metrics.ordersInMotion),
      hint: "Tracked across active stores and delivery types.",
      icon: faTruckFast,
    },
    {
      label: "Pending reminders",
      value: String(data.metrics.pendingNotifications),
      hint: "Orders still eligible for another reminder.",
      tone: "warn" as const,
      icon: faBell,
    },
    {
      label: "Delay alerts today",
      value: String(data.metrics.delayAlertsToday),
      hint: "Admin escalations sent since the start of today.",
      tone: "good" as const,
      icon: faTriangleExclamation,
    },
    {
      label: "Telegram success",
      value: data.metrics.telegramDeliverySuccess,
      hint: "Estimated from the latest operational log window.",
      icon: faPaperPlane,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Live command center"
        description="Track the flow from Redash ingestion to notification dispatch and admin escalation. This overview is intentionally operational: it surfaces order pressure, alerting posture, and the most recent automation outcomes."
        actions={
          canSeeOverviewActions ? (
            <>
              <button className="dashboard-button-secondary rounded-full px-4 py-2 text-sm font-medium">
                Export operational snapshot
              </button>
              <form action={runManualPollAction}>
                <button className="dashboard-button-primary rounded-full px-4 py-2 text-sm font-medium">
                  Run manual poll
                </button>
              </form>
            </>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <SectionCard
        title="Operational queue"
        description="Orders most likely to require intervention or continued automated notifications."
      >
        <div className="space-y-4">
          {data.recentOrders.map((item) => (
            <div
              key={item.id}
              className="dashboard-soft-card rounded-[24px] p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-[color:var(--dashboard-heading)]">
                      #{item.orderId}
                    </p>
                    <StatusPill tone="info">{item.deliveryType}</StatusPill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--dashboard-body)]">{item.storeName}</p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--dashboard-muted-text)]">
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
            <div className="dashboard-subtle-card rounded-[24px] border-dashed p-6 text-sm text-[color:var(--dashboard-muted-text)]">
              No orders have been processed yet.
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
