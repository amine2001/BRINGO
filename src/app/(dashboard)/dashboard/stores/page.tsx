import { DataTable } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { canManageStores } from "@/lib/auth/roles";
import {
  deleteStoreAction,
  saveStoreAction,
  toggleStoreActiveAction,
} from "@/lib/dashboard/actions";
import { getStoresPageData } from "@/lib/dashboard/queries";
import { getCurrentAppLanguage } from "@/lib/settings/server";
import { requireCompanyContext } from "@/lib/tenant/context";
import type { AppLanguage } from "@/lib/settings/preferences";

const COPY: Record<
  AppLanguage,
  {
    columns: [string, string, string, string, string];
    noTypesEnabled: string;
    mappedGroup: (count: number) => string;
    enabled: string;
    paused: string;
    pause: string;
    enable: string;
    remove: string;
    pauseTitle: string;
    pauseDescription: string;
    pauseConfirm: string;
    pauseCancel: string;
    removeTitle: string;
    removeDescription: string;
    removeConfirm: string;
    removeCancel: string;
    headerEyebrow: string;
    headerTitle: string;
    headerDescription: string;
    formTitle: string;
    formDescription: string;
    storeNameLabel: string;
    storeNamePlaceholder: string;
    deliveryTypesLabel: string;
    saveStore: string;
    registryTitle: string;
    registryDescription: string;
    emptyTitle: string;
    emptyDescription: string;
  }
> = {
  en: {
    columns: ["Store", "Enabled delivery types", "Telegram routing", "Status", "Actions"],
    noTypesEnabled: "No types enabled",
    mappedGroup: (count) => `${count} mapped group${count === 1 ? "" : "s"}`,
    enabled: "Enabled",
    paused: "Paused",
    pause: "Pause",
    enable: "Enable",
    remove: "Remove",
    pauseTitle: "Pause this store?",
    pauseDescription:
      "Pausing a store stops its delivery-type routing and notification flow until you enable it again.",
    pauseConfirm: "Pause store",
    pauseCancel: "Cancel",
    removeTitle: "Remove this store?",
    removeDescription:
      "This will permanently remove the store, its delivery-type mappings, and its Telegram routing links.",
    removeConfirm: "Remove store",
    removeCancel: "Cancel",
    headerEyebrow: "Stores",
    headerTitle: "Manage store routing and delivery-type availability",
    headerDescription:
      "Control whether EXPRESS, MARKET, and HYPER are active for each store and which Telegram destinations should receive notifications.",
    formTitle: "Create or update store",
    formDescription:
      "Use this form to configure a store and toggle delivery types without exposing any deprecated slot logic.",
    storeNameLabel: "Store name",
    storeNamePlaceholder: "Carrefour Ain Sebaa",
    deliveryTypesLabel: "Enabled delivery types",
    saveStore: "Save store",
    registryTitle: "Store registry",
    registryDescription:
      "Operationally relevant fields are surfaced first so future server actions can bind directly to these controls.",
    emptyTitle: "Some stores are missing delivery-type coverage",
    emptyDescription:
      "Stores without enabled delivery types will be skipped by the notification poller until at least one delivery type is activated.",
  },
  fr: {
    columns: ["Magasin", "Types actifs", "Routage Telegram", "Statut", "Actions"],
    noTypesEnabled: "Aucun type actif",
    mappedGroup: (count) => `${count} groupe${count === 1 ? "" : "s"} mappe${count === 1 ? "" : "s"}`,
    enabled: "Actif",
    paused: "En pause",
    pause: "Mettre en pause",
    enable: "Activer",
    remove: "Supprimer",
    pauseTitle: "Mettre ce magasin en pause ?",
    pauseDescription:
      "Mettre un magasin en pause coupe le routage et les notifications jusqu'a sa reactivation.",
    pauseConfirm: "Mettre en pause",
    pauseCancel: "Annuler",
    removeTitle: "Supprimer ce magasin ?",
    removeDescription:
      "Le magasin, ses types de livraison et ses liens Telegram seront supprimes definitivement.",
    removeConfirm: "Supprimer le magasin",
    removeCancel: "Annuler",
    headerEyebrow: "Magasins",
    headerTitle: "Gerer le routage magasin et les types de livraison",
    headerDescription:
      "Controlez quels types EXPRESS, MARKET et HYPER sont actifs pour chaque magasin et vers quelles destinations Telegram les notifications doivent partir.",
    formTitle: "Creer ou modifier un magasin",
    formDescription:
      "Utilisez ce formulaire pour configurer un magasin et activer les types de livraison utiles a l'operation.",
    storeNameLabel: "Nom du magasin",
    storeNamePlaceholder: "Carrefour Ain Sebaa",
    deliveryTypesLabel: "Types de livraison actifs",
    saveStore: "Enregistrer le magasin",
    registryTitle: "Registre des magasins",
    registryDescription:
      "Les champs les plus utiles a l'exploitation sont affiches en premier pour faciliter les actions serveur.",
    emptyTitle: "Certains magasins n'ont aucun type de livraison actif",
    emptyDescription:
      "Un magasin sans type actif sera ignore par le poller jusqu'a l'activation d'au moins un type.",
  },
  ar: {
    columns: ["المتجر", "أنواع التوصيل المفعلة", "توجيه تيليغرام", "الحالة", "الإجراءات"],
    noTypesEnabled: "لا يوجد نوع مفعل",
    mappedGroup: (count) => `${count} مجموعة مرتبطة`,
    enabled: "مفعل",
    paused: "متوقف",
    pause: "إيقاف",
    enable: "تفعيل",
    remove: "حذف",
    pauseTitle: "إيقاف هذا المتجر؟",
    pauseDescription:
      "إيقاف المتجر يوقف التوجيه والإشعارات الخاصة به حتى يتم تفعيله مرة أخرى.",
    pauseConfirm: "إيقاف المتجر",
    pauseCancel: "إلغاء",
    removeTitle: "حذف هذا المتجر؟",
    removeDescription:
      "سيتم حذف المتجر وروابط التوصيل وروابط تيليغرام الخاصة به بشكل نهائي.",
    removeConfirm: "حذف المتجر",
    removeCancel: "إلغاء",
    headerEyebrow: "المتاجر",
    headerTitle: "إدارة توجيه المتاجر وأنواع التوصيل",
    headerDescription:
      "تحكم في تفعيل EXPRESS و MARKET و HYPER لكل متجر وحدد وجهات تيليغرام التي تستقبل الإشعارات.",
    formTitle: "إنشاء متجر أو تعديله",
    formDescription:
      "استخدم هذا النموذج لإعداد المتجر وتفعيل أنواع التوصيل المناسبة للعمل.",
    storeNameLabel: "اسم المتجر",
    storeNamePlaceholder: "Carrefour Ain Sebaa",
    deliveryTypesLabel: "أنواع التوصيل المفعلة",
    saveStore: "حفظ المتجر",
    registryTitle: "سجل المتاجر",
    registryDescription:
      "تظهر الحقول التشغيلية المهمة أولاً لتسهيل المتابعة والإجراءات لاحقاً.",
    emptyTitle: "بعض المتاجر بلا أنواع توصيل مفعلة",
    emptyDescription:
      "أي متجر بدون نوع توصيل مفعل سيتم تجاهله من قبل نظام السحب حتى يتم تفعيل نوع واحد على الأقل.",
  },
  pt: {
    columns: ["Loja", "Tipos de entrega ativos", "Roteamento Telegram", "Status", "Acoes"],
    noTypesEnabled: "Nenhum tipo ativo",
    mappedGroup: (count) => `${count} grupo${count === 1 ? "" : "s"} mapeado${count === 1 ? "" : "s"}`,
    enabled: "Ativo",
    paused: "Pausado",
    pause: "Pausar",
    enable: "Ativar",
    remove: "Remover",
    pauseTitle: "Pausar esta loja?",
    pauseDescription:
      "Pausar uma loja interrompe o roteamento e as notificacoes ate que ela seja ativada novamente.",
    pauseConfirm: "Pausar loja",
    pauseCancel: "Cancelar",
    removeTitle: "Remover esta loja?",
    removeDescription:
      "A loja, os tipos de entrega e os vinculos de Telegram serao removidos permanentemente.",
    removeConfirm: "Remover loja",
    removeCancel: "Cancelar",
    headerEyebrow: "Lojas",
    headerTitle: "Gerir roteamento de lojas e tipos de entrega",
    headerDescription:
      "Controle se EXPRESS, MARKET e HYPER estao ativos para cada loja e para quais destinos do Telegram as notificacoes devem ser enviadas.",
    formTitle: "Criar ou atualizar loja",
    formDescription:
      "Use este formulario para configurar uma loja e ativar os tipos de entrega necessarios para a operacao.",
    storeNameLabel: "Nome da loja",
    storeNamePlaceholder: "Carrefour Ain Sebaa",
    deliveryTypesLabel: "Tipos de entrega ativos",
    saveStore: "Salvar loja",
    registryTitle: "Registro de lojas",
    registryDescription:
      "Os campos operacionais mais importantes aparecem primeiro para facilitar o controle.",
    emptyTitle: "Algumas lojas estao sem cobertura de tipo de entrega",
    emptyDescription:
      "Lojas sem tipos de entrega ativos serao ignoradas pelo poller ate que pelo menos um tipo seja ativado.",
  },
};

export default async function StoresPage() {
  const context = await requireCompanyContext();
  const language = await getCurrentAppLanguage();
  const copy = COPY[language];
  const data = await getStoresPageData(context.company.id);
  const canEditStores = canManageStores(context.profile?.role);

  const storeColumns = [
    { key: "store", label: copy.columns[0] },
    { key: "deliveryTypes", label: copy.columns[1] },
    { key: "routing", label: copy.columns[2] },
    { key: "status", label: copy.columns[3] },
    ...(canEditStores ? [{ key: "actions", label: copy.columns[4] }] : []),
  ];

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
          <StatusPill tone="neutral">{copy.noTypesEnabled}</StatusPill>
        )}
      </div>
    ),
    routing: copy.mappedGroup(store.routes.length),
    status: <StatusPill tone={store.isActive ? "good" : "neutral"}>{store.isActive ? copy.enabled : copy.paused}</StatusPill>,
    ...(canEditStores
      ? {
          actions: (
            <div className="flex flex-wrap gap-2">
              <form action={toggleStoreActiveAction}>
                <input type="hidden" name="storeId" value={store.id} />
                <input type="hidden" name="nextValue" value={store.isActive ? "false" : "true"} />
                {store.isActive ? (
                  <ConfirmSubmitButton
                    title={copy.pauseTitle}
                    description={copy.pauseDescription}
                    confirmLabel={copy.pauseConfirm}
                    cancelLabel={copy.pauseCancel}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                    confirmClassName="rounded-full border border-amber-300/25 bg-amber-400/18 px-4 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-amber-400/24"
                  >
                    {copy.pause}
                  </ConfirmSubmitButton>
                ) : (
                  <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10">
                    {copy.enable}
                  </button>
                )}
              </form>
              <form action={deleteStoreAction}>
                <input type="hidden" name="storeId" value={store.id} />
                <ConfirmSubmitButton
                  title={copy.removeTitle}
                  description={copy.removeDescription}
                  confirmLabel={copy.removeConfirm}
                  cancelLabel={copy.removeCancel}
                  className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-400/20"
                >
                  {copy.remove}
                </ConfirmSubmitButton>
              </form>
            </div>
          ),
        }
      : {}),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.headerEyebrow}
        title={copy.headerTitle}
        description={copy.headerDescription}
      />

      {canEditStores ? (
        <SectionCard title={copy.formTitle} description={copy.formDescription}>
          <form action={saveStoreAction} className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300 lg:col-span-2">
              <span className="block font-medium text-white">{copy.storeNameLabel}</span>
              <input
                name="name"
                type="text"
                placeholder={copy.storeNamePlaceholder}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
              />
            </label>
            <div className="rounded-[24px] border border-white/10 bg-white/4 p-5 lg:col-span-2">
              <p className="text-sm font-medium text-white">{copy.deliveryTypesLabel}</p>
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
                {copy.saveStore}
              </button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard title={copy.registryTitle} description={copy.registryDescription}>
        <DataTable columns={storeColumns} rows={storeRows} />
      </SectionCard>

      {canEditStores && data.stores.some((store) => store.enabledTypes.length === 0) ? (
        <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
      ) : null}
    </div>
  );
}
