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
        "As soon as a new order appears in Redash, the first Telegram message is sent immediately.",
      accent: "info" as const,
      details: [
        "Trigger: new order detected",
        "Action: immediate first notification",
      ],
    },
    {
      step: "02",
      title: "Waiting acceptance",
      description:
        "If the order is still not accepted after the grace period, reminders keep going until preparation is accepted.",
      accent: "warn" as const,
      details: [
        `Grace period: ${workflow.acceptanceGraceMinutes} min`,
        `Repeat every: ${workflow.acceptanceReminderIntervalMinutes} min`,
      ],
    },
    {
      step: "03",
      title: "Preparation SLA",
      description:
        "After acceptance, allowed preparation time is based on the number of products in the order.",
      accent: "good" as const,
      details: [
        `Formula: products x ${workflow.preparationMinutesPerProduct} min`,
        `Late reminder every: ${workflow.preparationReminderIntervalMinutes} min`,
      ],
    },
    {
      step: "04",
      title: "Delivery alert",
      description:
        "Once preparation ends, any delivery state marked as alert keeps notifying until the order becomes complete.",
      accent: "danger" as const,
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
        description="Each stage shows exactly when notifications start, what condition keeps them active, and what clears the alert."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/4 p-5"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_52%)]" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold tracking-[0.35em] text-slate-400">
                    STEP {item.step}
                  </span>
                  <StatusPill tone={item.accent}>{item.title}</StatusPill>
                </div>
                <p className="mt-4 text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
                <div className="mt-5 space-y-2">
                  {item.details.map((detail) => (
                    <div
                      key={detail}
                      className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-200"
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
        description="Defaults match your original setup. Once you save changes here, the cron uses these minutes for all future reminders."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">Profile source</p>
            <div className="mt-3">
              <StatusPill tone={data.isCustom ? "good" : "neutral"}>
                {data.isCustom ? "Custom workflow" : "Default workflow"}
              </StatusPill>
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">Acceptance grace</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {workflow.acceptanceGraceMinutes} min
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">Acceptance reminder</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {workflow.acceptanceReminderIntervalMinutes} min
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">Prep minutes per product</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {workflow.preparationMinutesPerProduct} min
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5">
            <p className="text-sm text-slate-400">Delivery alert reminder</p>
            <p className="mt-3 text-lg font-semibold text-white">
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
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">
              Minutes before “not accepted” reminders start
            </span>
            <input
              name="acceptanceGraceMinutes"
              type="number"
              min="1"
              defaultValue={workflow.acceptanceGraceMinutes}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">
              Minutes between “not accepted” reminders
            </span>
            <input
              name="acceptanceReminderIntervalMinutes"
              type="number"
              min="1"
              defaultValue={workflow.acceptanceReminderIntervalMinutes}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">
              Preparation minutes per product
            </span>
            <input
              name="preparationMinutesPerProduct"
              type="number"
              min="1"
              defaultValue={workflow.preparationMinutesPerProduct}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">
              Minutes between preparation delay reminders
            </span>
            <input
              name="preparationReminderIntervalMinutes"
              type="number"
              min="1"
              defaultValue={workflow.preparationReminderIntervalMinutes}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300 lg:col-span-2">
            <span className="block font-medium text-white">
              Minutes between delivery alert reminders
            </span>
            <input
              name="deliveryAlertReminderIntervalMinutes"
              type="number"
              min="1"
              defaultValue={workflow.deliveryAlertReminderIntervalMinutes}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5 lg:col-span-2">
            <p className="text-sm font-medium text-white">Current preparation formula</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Allowed preparation time = product count x {workflow.preparationMinutesPerProduct} minutes.
              Example: 5 products = {workflow.preparationMinutesPerProduct * 5} minutes before the
              preparation delay reminders begin.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Save workflow
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
