import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { saveTelegramGroupAction } from "@/lib/dashboard/actions";
import { getTelegramGroupsPageData } from "@/lib/dashboard/queries";
import { requireCompanyContext } from "@/lib/tenant/context";

const groupColumns = [
  { key: "group", label: "Telegram group" },
  { key: "store", label: "Store" },
  { key: "deliveryType", label: "Delivery type" },
  { key: "chatId", label: "Chat ID" },
  { key: "health", label: "Health" },
];

export default async function TelegramGroupsPage() {
  const context = await requireCompanyContext();
  const data = await getTelegramGroupsPageData(context.company.id);

  const groupRows = data.groups.flatMap((group) =>
    group.mappings.length > 0
      ? group.mappings.map((mapping) => ({
          group: group.name,
          store: mapping.storeName,
          deliveryType: (
            <StatusPill
              tone={
                mapping.deliveryType === "EXPRESS"
                  ? "info"
                  : mapping.deliveryType === "MARKET"
                    ? "good"
                    : "warn"
              }
            >
              {mapping.deliveryType}
            </StatusPill>
          ),
          chatId: <span className="font-mono text-xs">{group.chatId}</span>,
          health: (
            <StatusPill tone={group.isActive ? "good" : "neutral"}>
              {group.isActive ? "Verified" : "Paused"}
            </StatusPill>
          ),
        }))
      : [
          {
            group: group.name,
            store: "Unassigned",
            deliveryType: <StatusPill tone="neutral">Pending mapping</StatusPill>,
            chatId: <span className="font-mono text-xs">{group.chatId}</span>,
            health: (
              <StatusPill tone={group.isActive ? "warn" : "neutral"}>
                {group.isActive ? "Ready" : "Paused"}
              </StatusPill>
            ),
          },
        ],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Telegram Groups"
        title="Map delivery types to the right chat destinations"
        description="Each store can route EXPRESS, MARKET, and HYPER notifications to different Telegram groups. These records are ready for server actions that create, validate, and rotate mappings."
      />

      <SectionCard
        title="Current mappings"
        description="Operators need a direct view of which delivery type routes to which group before notifications go live."
      >
        <DataTable columns={groupColumns} rows={groupRows} />
      </SectionCard>

      <SectionCard
        title="Add or update mapping"
        description="Select the store and Telegram chat. Delivery types already enabled on the store will be mapped automatically."
      >
        <form action={saveTelegramGroupAction} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Telegram chat ID</span>
            <input
              name="chatId"
              type="text"
              placeholder="-1002176002211"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Store</span>
            <select
              name="storeId"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            >
              {data.stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Save mapping
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
