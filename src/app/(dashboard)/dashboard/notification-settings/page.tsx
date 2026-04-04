import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { saveNotificationSettingsAction } from "@/lib/dashboard/actions";
import { getNotificationSettingsPageData } from "@/lib/dashboard/queries";
import { requireCompanyContext } from "@/lib/tenant/context";
export default async function NotificationSettingsPage() {
  const context = await requireCompanyContext();
  const data = await getNotificationSettingsPageData(context.company.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notification Settings"
        title="Control how often unresolved orders continue to notify"
        description="Repeat count, interval, and stop conditions are modeled here so future server actions can enforce deterministic notification frequency per store and delivery type."
      />

      <SectionCard
        title="Active notification policies"
        description="Each row represents a realistic control surface for order repeat cadence."
      >
        <div className="space-y-4">
          {data.settings.map((policy) => (
            <div
              key={policy.id}
              className="grid gap-4 rounded-[24px] border border-white/10 bg-white/4 p-5 xl:grid-cols-[1.1fr_0.7fr_0.7fr_0.9fr_0.9fr]"
            >
              <div>
                <p className="text-sm text-slate-400">Store</p>
                <p className="mt-1 font-medium text-white">{policy.storeName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Delivery type</p>
                <div className="mt-2">
                  <StatusPill tone="info">{policy.deliveryType ?? "ALL"}</StatusPill>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400">Repeat count</p>
                <p className="mt-1 font-medium text-white">{policy.repeatCount}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Interval</p>
                <p className="mt-1 font-medium text-white">{policy.intervalSeconds}s</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Stop condition</p>
                <p className="mt-1 font-medium text-white">
                  {policy.stopOnAccepted && policy.stopOnDelivered
                    ? "Stop when accepted or delivered"
                    : policy.stopOnAccepted
                      ? "Stop when accepted"
                      : policy.stopOnDelivered
                        ? "Stop when delivered"
                        : "No automatic stop"}
                </p>
              </div>
            </div>
          ))}
          {data.settings.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/15 bg-white/3 p-5 text-sm text-slate-400">
              No notification policies are configured yet. The poller will use the built-in defaults until you save one.
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Edit notification policy"
        description="This form is intentionally close to the future database model: repeat count, interval in seconds, and stop conditions."
      >
        <form action={saveNotificationSettingsAction} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Store</span>
            <select
              name="storeId"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            >
              <option value="">Global default</option>
              {data.stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Delivery type</span>
            <select
              name="deliveryType"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            >
              <option value="">ALL</option>
              <option value="EXPRESS">EXPRESS</option>
              <option value="MARKET">MARKET</option>
              <option value="HYPER">HYPER</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Notification repeat count</span>
            <input
              name="repeatCount"
              type="number"
              placeholder="6"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">
              Interval between notifications (seconds)
            </span>
            <input
              name="intervalSeconds"
              type="number"
              placeholder="300"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5 lg:col-span-2">
            <p className="text-sm font-medium text-white">Stop conditions</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                "Stop when accepted",
                "Stop when delivered",
                "Stop when accepted or delivered",
              ].map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-200"
                >
                  <input
                    type="radio"
                    name="stopCondition"
                    value={
                      item === "Stop when accepted"
                        ? "accepted"
                        : item === "Stop when delivered"
                          ? "delivered"
                          : "accepted_or_delivered"
                    }
                    defaultChecked={item === "Stop when accepted or delivered"}
                    className="h-4 w-4"
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Save notification settings
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
