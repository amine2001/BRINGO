import { DataTable } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  deleteStoreAction,
  saveStoreAction,
  toggleStoreActiveAction,
} from "@/lib/dashboard/actions";
import { getStoresPageData } from "@/lib/dashboard/queries";
import { requireCompanyContext } from "@/lib/tenant/context";

const storeColumns = [
  { key: "store", label: "Store" },
  { key: "deliveryTypes", label: "Enabled delivery types" },
  { key: "routing", label: "Telegram routing" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

export default async function StoresPage() {
  const context = await requireCompanyContext();
  const data = await getStoresPageData(context.company.id);

  const storeRows = data.stores.map((store) => ({
    store: (
      <div>
        <p className="font-medium text-white">{store.name}</p>
      </div>
    ),
    deliveryTypes: (
      <div className="flex flex-wrap gap-2">
        {store.enabledTypes.length > 0 ? (
          store.enabledTypes.map((type) => (
            <StatusPill
              key={type}
              tone={type === "EXPRESS" ? "info" : type === "MARKET" ? "good" : "warn"}
            >
              {type}
            </StatusPill>
          ))
        ) : (
          <StatusPill tone="neutral">No types enabled</StatusPill>
        )}
      </div>
    ),
    routing: `${store.routes.length} mapped group${store.routes.length === 1 ? "" : "s"}`,
    status: (
      <StatusPill tone={store.isActive ? "good" : "neutral"}>
        {store.isActive ? "Enabled" : "Paused"}
      </StatusPill>
    ),
    actions: (
      <div className="flex flex-wrap gap-2">
        <form action={toggleStoreActiveAction}>
          <input type="hidden" name="storeId" value={store.id} />
          <input
            type="hidden"
            name="nextValue"
            value={store.isActive ? "false" : "true"}
          />
          {store.isActive ? (
            <ConfirmSubmitButton
              title="Pause this store?"
              description="Pausing a store stops its delivery-type routing and notification flow until you enable it again."
              confirmLabel="Pause store"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              confirmClassName="rounded-full border border-amber-300/25 bg-amber-400/18 px-4 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-400/24"
            >
              Pause
            </ConfirmSubmitButton>
          ) : (
            <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10">
              Enable
            </button>
          )}
        </form>
        <form action={deleteStoreAction}>
          <input type="hidden" name="storeId" value={store.id} />
          <ConfirmSubmitButton
            title="Remove this store?"
            description="This will permanently remove the store, its delivery-type mappings, and its Telegram routing links."
            confirmLabel="Remove store"
            className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-400/20"
          >
            Remove
          </ConfirmSubmitButton>
        </form>
      </div>
    ),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stores"
        title="Manage store routing and delivery-type availability"
        description="Control whether EXPRESS, MARKET, and HYPER are active for each store and which Telegram destinations should receive notifications."
      />

      <SectionCard
        title="Store registry"
        description="Operationally relevant fields are surfaced first so future server actions can bind directly to these controls."
      >
        <DataTable columns={storeColumns} rows={storeRows} />
      </SectionCard>

      <SectionCard
        title="Create or update store"
        description="Use this form to configure a store and toggle delivery types without exposing any deprecated slot logic."
      >
        <form action={saveStoreAction} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300 lg:col-span-2">
            <span className="block font-medium text-white">Store name</span>
            <input
              name="name"
              type="text"
              placeholder="Carrefour Ain Sebaa"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <div className="rounded-[24px] border border-white/10 bg-white/4 p-5 lg:col-span-2">
            <p className="text-sm font-medium text-white">Enabled delivery types</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {["EXPRESS", "MARKET", "HYPER"].map((type) => (
                <label
                  key={type}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-200"
                >
                  {type}
                  <input
                    name="deliveryTypes"
                    value={type}
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-500"
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Save store
            </button>
          </div>
        </form>
      </SectionCard>

      {data.stores.some((store) => store.enabledTypes.length === 0) ? (
        <EmptyState
          title="Some stores are missing delivery-type coverage"
          description="Stores without enabled delivery types will be skipped by the notification poller until at least one delivery type is activated."
        />
      ) : null}
    </div>
  );
}
