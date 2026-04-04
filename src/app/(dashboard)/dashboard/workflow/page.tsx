import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { saveWorkflowSettingsAction } from "@/lib/dashboard/actions";
import { getWorkflowPageData } from "@/lib/dashboard/queries";
import { requireCompanyContext } from "@/lib/tenant/context";

export default async function WorkflowPage() {
  const context = await requireCompanyContext();
  const data = await getWorkflowPageData(context.company.id);
  const workflow = data.settings;

  const steps = [
    {
      step: "01",
      title: "Order received",
      description:
        "When a new order appears the Telegram alert is sent immediately.",
      details: [
        "Trigger: new order detected",
        "Action: send first alert instantly",
      ],
    },
    {
      step: "02",
      title: "Waiting acceptance",
      description:
        "If acceptance is still missing reminders repeat until prep starts.",
      details: [
        `Grace period: ${workflow.acceptanceGraceMinutes} min`,
        `Repeat every: ${workflow.acceptanceReminderIntervalMinutes} min`,
      ],
    },
    {
      step: "03",
      title: "Preparation SLA",
      description:
        "The preparation SLA is based on product count and minutes per product.",
      details: [
        `Formula: products x ${workflow.preparationMinutesPerProduct} min`,
        `Late reminder every: ${workflow.preparationReminderIntervalMinutes} min`,
      ],
    },
    {
      step: "04",
      title: "Delivery alert",
      description:
        "After preparation ends alert repeats until the order is marked complete.",
      details: [
        "Trigger: shopper or picker state = alert",
        `Repeat every: ${workflow.deliveryAlertReminderIntervalMinutes} min`,
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workflow"
        title="Shape and configure the live notification workflow"
        description="This is the real Bringo order workflow: received, not accepted, preparation delay, and delivery alert. The timing values below drive the live poller."
      />

      <SectionCard
        title="Workflow map"
        description="Each stage shows when notifications start, what condition keeps them active, and what clears the alert."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          {steps.map((item) => (
            <div
              key={item.step}
              className="dashboard-soft-card relative h-full overflow-hidden rounded-[26px] p-5"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_52%)]" />
              <div className="relative flex h-full flex-col">
                <div className="flex flex-col items-start gap-3">
                  <span className="text-xs font-semibold tracking-[0.35em] text-[color:var(--dashboard-muted-text)]">
                    STEP {item.step}
                  </span>
                  <StatusPill tone="info">{item.title}</StatusPill>
                </div>
                <p className="mt-3 min-h-[72px] text-sm leading-6 text-[color:var(--dashboard-body)]">
                  {item.description}
                </p>
                <div className="mt-4 grid flex-1 grid-rows-2 gap-2">
                  {item.details.map((detail) => (
                    <div
                      key={detail}
                      className="dashboard-strong-card flex min-h-[64px] items-center rounded-2xl px-4 py-3 text-sm leading-6 text-[color:var(--dashboard-body)]"
                    >
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Current timing profile"
        description="These minutes are read by the live poller and decide when each reminder round starts."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <p className="text-sm text-[color:var(--dashboard-muted-text)]">Profile source</p>
            <div className="mt-3">
              <StatusPill tone={data.isCustom ? "good" : "neutral"}>
                {data.isCustom ? "Custom workflow" : "Default workflow"}
              </StatusPill>
            </div>
          </div>
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <p className="text-sm text-[color:var(--dashboard-muted-text)]">Acceptance grace</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--dashboard-heading)]">
              {workflow.acceptanceGraceMinutes} min
            </p>
          </div>
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <p className="text-sm text-[color:var(--dashboard-muted-text)]">Acceptance reminder</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--dashboard-heading)]">
              {workflow.acceptanceReminderIntervalMinutes} min
            </p>
          </div>
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <p className="text-sm text-[color:var(--dashboard-muted-text)]">
              Prep minutes per product
            </p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--dashboard-heading)]">
              {workflow.preparationMinutesPerProduct} min
            </p>
          </div>
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <p className="text-sm text-[color:var(--dashboard-muted-text)]">
              Delivery alert reminder
            </p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--dashboard-heading)]">
              {workflow.deliveryAlertReminderIntervalMinutes} min
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Edit workflow timings"
        description="Change the minutes here to tune the reminder cadence without changing code."
      >
        <form action={saveWorkflowSettingsAction} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-[color:var(--dashboard-body)]">
            <span className="block font-medium text-[color:var(--dashboard-heading)]">
              Minutes before not accepted reminders start
            </span>
            <input
              name="acceptanceGraceMinutes"
              type="number"
              min="1"
              defaultValue={workflow.acceptanceGraceMinutes}
              className="dashboard-input w-full rounded-2xl px-4 py-3 outline-none transition focus:border-[color:var(--dashboard-nav-active-border)] focus:ring-4 focus:ring-[color:var(--dashboard-nav-active-ring)]"
            />
          </label>

          <label className="space-y-2 text-sm text-[color:var(--dashboard-body)]">
            <span className="block font-medium text-[color:var(--dashboard-heading)]">
              Minutes between not accepted reminders
            </span>
            <input
              name="acceptanceReminderIntervalMinutes"
              type="number"
              min="1"
              defaultValue={workflow.acceptanceReminderIntervalMinutes}
              className="dashboard-input w-full rounded-2xl px-4 py-3 outline-none transition focus:border-[color:var(--dashboard-nav-active-border)] focus:ring-4 focus:ring-[color:var(--dashboard-nav-active-ring)]"
            />
          </label>

          <label className="space-y-2 text-sm text-[color:var(--dashboard-body)]">
            <span className="block font-medium text-[color:var(--dashboard-heading)]">
              Preparation minutes per product
            </span>
            <input
              name="preparationMinutesPerProduct"
              type="number"
              min="1"
              defaultValue={workflow.preparationMinutesPerProduct}
              className="dashboard-input w-full rounded-2xl px-4 py-3 outline-none transition focus:border-[color:var(--dashboard-nav-active-border)] focus:ring-4 focus:ring-[color:var(--dashboard-nav-active-ring)]"
            />
          </label>

          <label className="space-y-2 text-sm text-[color:var(--dashboard-body)]">
            <span className="block font-medium text-[color:var(--dashboard-heading)]">
              Minutes between preparation delay reminders
            </span>
            <input
              name="preparationReminderIntervalMinutes"
              type="number"
              min="1"
              defaultValue={workflow.preparationReminderIntervalMinutes}
              className="dashboard-input w-full rounded-2xl px-4 py-3 outline-none transition focus:border-[color:var(--dashboard-nav-active-border)] focus:ring-4 focus:ring-[color:var(--dashboard-nav-active-ring)]"
            />
          </label>

          <label className="space-y-2 text-sm text-[color:var(--dashboard-body)] lg:col-span-2">
            <span className="block font-medium text-[color:var(--dashboard-heading)]">
              Minutes between delivery alert reminders
            </span>
            <input
              name="deliveryAlertReminderIntervalMinutes"
              type="number"
              min="1"
              defaultValue={workflow.deliveryAlertReminderIntervalMinutes}
              className="dashboard-input w-full rounded-2xl px-4 py-3 outline-none transition focus:border-[color:var(--dashboard-nav-active-border)] focus:ring-4 focus:ring-[color:var(--dashboard-nav-active-ring)]"
            />
          </label>

          <div className="dashboard-soft-card rounded-[24px] p-5 lg:col-span-2">
            <p className="text-sm font-medium text-[color:var(--dashboard-heading)]">
              Current preparation formula
            </p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--dashboard-body)]">
              Allowed preparation time = product count x {workflow.preparationMinutesPerProduct} minutes.
              Example: 5 products = {workflow.preparationMinutesPerProduct * 5} minutes before
              the preparation delay reminders begin.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button
              type="submit"
              className="dashboard-button-primary rounded-full px-5 py-3 text-sm font-semibold"
            >
              Save workflow
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
