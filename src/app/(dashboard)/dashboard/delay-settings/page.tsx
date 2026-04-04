import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { decodeChatRouting } from "@/lib/delay/chat-routing";
import { saveDelaySettingsAction } from "@/lib/dashboard/actions";
import { getDelaySettingsPageData } from "@/lib/dashboard/queries";
import { getCurrentAppLanguage } from "@/lib/settings/server";
import { requireCompanyContext } from "@/lib/tenant/context";
import type { AppLanguage } from "@/lib/settings/preferences";

const COPY: Record<
  AppLanguage,
  {
    columns: [string, string, string, string, string];
    active: string;
    paused: string;
    headerEyebrow: string;
    headerTitle: string;
    headerDescription: string;
    currentTitle: string;
    currentDescription: string;
    configTitle: string;
    configDescription: string;
    opsLabel: string;
    deliveryLabel: string;
    fallbackLabel: string;
    thresholdLabel: string;
    enabledLabel: string;
    enabledHint: string;
    saveLabel: string;
    minutesLabel: string;
  }
> = {
  en: {
    columns: ["Delay threshold", "Acceptance / Prep", "Delivery", "Fallback", "Status"],
    active: "Active",
    paused: "Paused",
    headerEyebrow: "Delay Settings",
    headerTitle: "Escalate delayed orders to admin channels",
    headerDescription:
      "Delay thresholds and admin Telegram destinations are separated from store routing so escalation policy stays explicit and auditable.",
    currentTitle: "Current escalation policies",
    currentDescription: "Delay escalation uses one admin destination and one threshold across the operation.",
    configTitle: "Configure delay alerting",
    configDescription:
      "Route acceptance/prep delays and delivery delays to different Telegram recipients while keeping one threshold.",
    opsLabel: "Acceptance & prep chat ID",
    deliveryLabel: "Delivery chat ID",
    fallbackLabel: "Fallback / admin chat ID",
    thresholdLabel: "Delay threshold (minutes)",
    enabledLabel: "Alerts enabled",
    enabledHint: "Send delay alerts when the threshold is exceeded",
    saveLabel: "Save delay settings",
    minutesLabel: "minutes",
  },
  fr: {
    columns: ["Seuil retard", "Acceptation / Prep", "Livraison", "Secours", "Statut"],
    active: "Actif",
    paused: "En pause",
    headerEyebrow: "Retards",
    headerTitle: "Escalader les commandes en retard vers les bons canaux",
    headerDescription:
      "Les seuils de retard et les destinations Telegram sont geres ici pour garder une politique d'escalade claire.",
    currentTitle: "Politiques d'escalade actuelles",
    currentDescription: "Le retard utilise un seuil et des destinataires dedies pour l'operation.",
    configTitle: "Configurer les alertes retard",
    configDescription:
      "Dirigez les retards d'acceptation/preparation et de livraison vers des destinataires Telegram differents.",
    opsLabel: "Chat ID acceptation et preparation",
    deliveryLabel: "Chat ID livraison",
    fallbackLabel: "Chat ID secours / admin",
    thresholdLabel: "Seuil de retard (minutes)",
    enabledLabel: "Alertes actives",
    enabledHint: "Envoyer des alertes retard quand le seuil est depasse",
    saveLabel: "Enregistrer les retards",
    minutesLabel: "minutes",
  },
  ar: {
    columns: ["حد التأخير", "القبول / التحضير", "التوصيل", "الاحتياطي", "الحالة"],
    active: "مفعل",
    paused: "متوقف",
    headerEyebrow: "إعدادات التأخير",
    headerTitle: "تصعيد الطلبات المتأخرة إلى القنوات المناسبة",
    headerDescription:
      "يتم ضبط حدود التأخير ووجهات تيليغرام هنا لإبقاء سياسة التصعيد واضحة وقابلة للمراجعة.",
    currentTitle: "سياسات التصعيد الحالية",
    currentDescription: "تعتمد تنبيهات التأخير على حد واحد مع جهات استقبال مخصصة لكل مرحلة.",
    configTitle: "ضبط تنبيهات التأخير",
    configDescription:
      "وجّه تأخيرات القبول والتحضير وتأخيرات التوصيل إلى مستلمي تيليغرام مختلفين مع الحفاظ على حد واحد.",
    opsLabel: "معرف دردشة القبول والتحضير",
    deliveryLabel: "معرف دردشة التوصيل",
    fallbackLabel: "معرف الدردشة الاحتياطي / الإداري",
    thresholdLabel: "حد التأخير (بالدقائق)",
    enabledLabel: "تفعيل التنبيهات",
    enabledHint: "إرسال تنبيهات التأخير عند تجاوز الحد",
    saveLabel: "حفظ إعدادات التأخير",
    minutesLabel: "دقيقة",
  },
  pt: {
    columns: ["Limite de atraso", "Aceitacao / Preparo", "Entrega", "Fallback", "Status"],
    active: "Ativo",
    paused: "Pausado",
    headerEyebrow: "Atrasos",
    headerTitle: "Escalar pedidos atrasados para os canais corretos",
    headerDescription:
      "Os limites de atraso e os destinos do Telegram ficam separados do roteamento da loja para manter a politica de escalacao clara.",
    currentTitle: "Politicas atuais de escalacao",
    currentDescription: "Os atrasos usam um limite unico com destinatarios dedicados para cada etapa.",
    configTitle: "Configurar alertas de atraso",
    configDescription:
      "Envie atrasos de aceitacao/preparo e atrasos de entrega para destinatarios Telegram diferentes mantendo um unico limite.",
    opsLabel: "Chat ID de aceitacao e preparo",
    deliveryLabel: "Chat ID de entrega",
    fallbackLabel: "Chat ID fallback / admin",
    thresholdLabel: "Limite de atraso (minutos)",
    enabledLabel: "Alertas ativos",
    enabledHint: "Enviar alertas de atraso quando o limite for excedido",
    saveLabel: "Salvar atrasos",
    minutesLabel: "minutos",
  },
};

export default async function DelaySettingsPage() {
  const context = await requireCompanyContext();
  const language = await getCurrentAppLanguage();
  const copy = COPY[language];
  const data = await getDelaySettingsPageData(context.company.id);
  const routing = decodeChatRouting(data.settings?.telegramAdminChatId ?? "");

  const thresholdColumns = [
    { key: "threshold", label: copy.columns[0] },
    { key: "opsChat", label: copy.columns[1] },
    { key: "deliveryChat", label: copy.columns[2] },
    { key: "fallbackChat", label: copy.columns[3] },
    { key: "status", label: copy.columns[4] },
  ];

  const thresholdRows = data.settings
    ? [
        {
          threshold: `${data.settings.delayThresholdMinutes} ${copy.minutesLabel}`,
          opsChat: (
            <span className="font-mono text-xs">
              {routing.acceptance ?? routing.preparation ?? "-"}
            </span>
          ),
          deliveryChat: <span className="font-mono text-xs">{routing.delivery ?? "-"}</span>,
          fallbackChat: <span className="font-mono text-xs">{routing.fallback || "-"}</span>,
          status: (
            <StatusPill tone={data.settings.isActive ? "good" : "neutral"}>
              {data.settings.isActive ? copy.active : copy.paused}
            </StatusPill>
          ),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.headerEyebrow}
        title={copy.headerTitle}
        description={copy.headerDescription}
      />

      <SectionCard title={copy.currentTitle} description={copy.currentDescription}>
        <DataTable columns={thresholdColumns} rows={thresholdRows} />
      </SectionCard>

      <SectionCard title={copy.configTitle} description={copy.configDescription}>
        <form action={saveDelaySettingsAction} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.opsLabel}</span>
            <input
              name="opsChatId"
              type="text"
              defaultValue={routing.acceptance ?? routing.preparation ?? ""}
              placeholder="-1002176xxxxx"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.deliveryLabel}</span>
            <input
              name="deliveryChatId"
              type="text"
              defaultValue={routing.delivery ?? ""}
              placeholder="-1002176xxxxx"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.fallbackLabel}</span>
            <input
              name="telegramAdminChatId"
              type="text"
              defaultValue={routing.fallback}
              placeholder="-1002176999001"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.thresholdLabel}</span>
            <input
              name="delayThresholdMinutes"
              type="number"
              defaultValue={data.settings?.delayThresholdMinutes ?? 15}
              placeholder="15"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">{copy.enabledLabel}</span>
            <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-slate-200">
              <input
                name="enabled"
                type="checkbox"
                defaultChecked={data.settings?.isActive ?? true}
                className="h-4 w-4 rounded border-slate-500"
              />
              {copy.enabledHint}
            </span>
          </label>
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              {copy.saveLabel}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
