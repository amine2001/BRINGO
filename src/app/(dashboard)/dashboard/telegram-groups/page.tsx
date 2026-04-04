import { redirect } from "next/navigation";

import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { isViewerRole } from "@/lib/auth/roles";
import { saveTelegramGroupAction } from "@/lib/dashboard/actions";
import { getTelegramGroupsPageData } from "@/lib/dashboard/queries";
import { getCurrentAppLanguage } from "@/lib/settings/server";
import { requireCompanyContext } from "@/lib/tenant/context";
import type { AppLanguage } from "@/lib/settings/preferences";

const COPY: Record<
  AppLanguage,
  {
    columns: [string, string, string, string, string];
    verified: string;
    pendingMapping: string;
    ready: string;
    paused: string;
    unassigned: string;
    headerEyebrow: string;
    headerTitle: string;
    headerDescription: string;
    formTitle: string;
    formDescription: string;
    chatIdLabel: string;
    chatIdPlaceholder: string;
    storeLabel: string;
    saveMapping: string;
    currentMappingsTitle: string;
    currentMappingsDescription: string;
  }
> = {
  en: {
    columns: ["Telegram group", "Store", "Delivery type", "Chat ID", "Health"],
    verified: "Verified",
    pendingMapping: "Pending mapping",
    ready: "Ready",
    paused: "Paused",
    unassigned: "Unassigned",
    headerEyebrow: "Telegram Groups",
    headerTitle: "Map delivery types to the right chat destinations",
    headerDescription:
      "Each store can route EXPRESS, MARKET, and HYPER notifications to different Telegram groups. These records are ready for server actions that create, validate, and rotate mappings.",
    formTitle: "Add or update mapping",
    formDescription:
      "Select the store and Telegram chat. Delivery types already enabled on the store will be mapped automatically.",
    chatIdLabel: "Telegram chat ID",
    chatIdPlaceholder: "-1002176002211",
    storeLabel: "Store",
    saveMapping: "Save mapping",
    currentMappingsTitle: "Current mappings",
    currentMappingsDescription:
      "Operators need a direct view of which delivery type routes to which group before notifications go live.",
  },
  fr: {
    columns: ["Groupe Telegram", "Magasin", "Type de livraison", "Chat ID", "Etat"],
    verified: "Verifie",
    pendingMapping: "Mapping en attente",
    ready: "Pret",
    paused: "En pause",
    unassigned: "Non assigne",
    headerEyebrow: "Groupes Telegram",
    headerTitle: "Mapper les types de livraison vers le bon chat",
    headerDescription:
      "Chaque magasin peut router les notifications EXPRESS, MARKET et HYPER vers des groupes Telegram differents.",
    formTitle: "Ajouter ou modifier un mapping",
    formDescription:
      "Selectionnez le magasin et le chat Telegram. Les types deja actifs sur le magasin seront mappes automatiquement.",
    chatIdLabel: "Chat ID Telegram",
    chatIdPlaceholder: "-1002176002211",
    storeLabel: "Magasin",
    saveMapping: "Enregistrer le mapping",
    currentMappingsTitle: "Mappings actuels",
    currentMappingsDescription:
      "Les operateurs doivent voir clairement quel type de livraison pointe vers quel groupe avant l'activation.",
  },
  ar: {
    columns: ["مجموعة تيليغرام", "المتجر", "نوع التوصيل", "معرف الدردشة", "الحالة"],
    verified: "موثق",
    pendingMapping: "بانتظار الربط",
    ready: "جاهز",
    paused: "متوقف",
    unassigned: "غير مرتبط",
    headerEyebrow: "مجموعات تيليغرام",
    headerTitle: "ربط أنواع التوصيل بوجهة الدردشة الصحيحة",
    headerDescription:
      "يمكن لكل متجر توجيه إشعارات EXPRESS و MARKET و HYPER إلى مجموعات تيليغرام مختلفة.",
    formTitle: "إضافة ربط أو تعديله",
    formDescription:
      "اختر المتجر ومعرف دردشة تيليغرام. سيتم ربط أنواع التوصيل المفعلة على المتجر تلقائياً.",
    chatIdLabel: "معرف دردشة تيليغرام",
    chatIdPlaceholder: "-1002176002211",
    storeLabel: "المتجر",
    saveMapping: "حفظ الربط",
    currentMappingsTitle: "الروابط الحالية",
    currentMappingsDescription:
      "يحتاج المشغلون إلى رؤية مباشرة توضح أي نوع توصيل مرتبط بأي مجموعة قبل تشغيل الإشعارات.",
  },
  pt: {
    columns: ["Grupo Telegram", "Loja", "Tipo de entrega", "Chat ID", "Saude"],
    verified: "Verificado",
    pendingMapping: "Mapeamento pendente",
    ready: "Pronto",
    paused: "Pausado",
    unassigned: "Nao atribuido",
    headerEyebrow: "Grupos Telegram",
    headerTitle: "Mapear tipos de entrega para os chats corretos",
    headerDescription:
      "Cada loja pode enviar notificacoes EXPRESS, MARKET e HYPER para grupos Telegram diferentes.",
    formTitle: "Adicionar ou atualizar mapeamento",
    formDescription:
      "Selecione a loja e o chat do Telegram. Os tipos de entrega ja ativos na loja serao mapeados automaticamente.",
    chatIdLabel: "Chat ID do Telegram",
    chatIdPlaceholder: "-1002176002211",
    storeLabel: "Loja",
    saveMapping: "Salvar mapeamento",
    currentMappingsTitle: "Mapeamentos atuais",
    currentMappingsDescription:
      "Os operadores precisam ver claramente qual tipo de entrega aponta para qual grupo antes de ativar as notificacoes.",
  },
};

export default async function TelegramGroupsPage() {
  const context = await requireCompanyContext();
  if (isViewerRole(context.profile?.role)) {
    redirect("/dashboard");
  }

  const language = await getCurrentAppLanguage();
  const copy = COPY[language];
  const data = await getTelegramGroupsPageData(context.company.id);

  const groupColumns = [
    { key: "group", label: copy.columns[0] },
    { key: "store", label: copy.columns[1] },
    { key: "deliveryType", label: copy.columns[2] },
    { key: "chatId", label: copy.columns[3] },
    { key: "health", label: copy.columns[4] },
  ];

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
              {group.isActive ? copy.verified : copy.paused}
            </StatusPill>
          ),
        }))
      : [
          {
            group: group.name,
            store: copy.unassigned,
            deliveryType: <StatusPill tone="neutral">{copy.pendingMapping}</StatusPill>,
            chatId: <span className="font-mono text-xs">{group.chatId}</span>,
            health: (
              <StatusPill tone={group.isActive ? "warn" : "neutral"}>
                {group.isActive ? copy.ready : copy.paused}
              </StatusPill>
            ),
          },
        ],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.headerEyebrow}
        title={copy.headerTitle}
        description={copy.headerDescription}
      />

      <SectionCard title={copy.formTitle} description={copy.formDescription}>
        <form action={saveTelegramGroupAction} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.chatIdLabel}</span>
            <input
              name="chatId"
              type="text"
              placeholder={copy.chatIdPlaceholder}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.storeLabel}</span>
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
              {copy.saveMapping}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title={copy.currentMappingsTitle} description={copy.currentMappingsDescription}>
        <DataTable columns={groupColumns} rows={groupRows} />
      </SectionCard>
    </div>
  );
}
