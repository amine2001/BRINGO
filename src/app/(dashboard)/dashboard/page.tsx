import { formatDistanceToNow } from "date-fns";
import {
  faBell,
  faPaperPlane,
  faTriangleExclamation,
  faTruckFast,
} from "@fortawesome/free-solid-svg-icons";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { isSuperUserRole } from "@/lib/auth/roles";
import { runManualPollAction } from "@/lib/dashboard/actions";
import { getDashboardOverviewData } from "@/lib/dashboard/queries";
import { getDateFnsLocale } from "@/lib/settings/date-locale";
import { getCurrentAppLanguage } from "@/lib/settings/server";
import { requireCompanyContext } from "@/lib/tenant/context";
import type { AppLanguage } from "@/lib/settings/preferences";

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

const COPY: Record<
  AppLanguage,
  {
    eyebrow: string;
    title: string;
    description: string;
    exportLabel: string;
    manualPollLabel: string;
    metricLabels: [string, string, string, string];
    metricHints: [string, string, string, string];
    queueTitle: string;
    queueDescription: string;
    lastSeenPrefix: string;
    emptyQueue: string;
    statuses: Record<string, string>;
  }
> = {
  en: {
    eyebrow: "Overview",
    title: "Live command center",
    description:
      "Track the flow from Redash ingestion to notification dispatch and admin escalation. This overview is intentionally operational: it surfaces order pressure, alerting posture, and the most recent automation outcomes.",
    exportLabel: "Export operational snapshot",
    manualPollLabel: "Run manual poll",
    metricLabels: [
      "Orders in motion",
      "Pending reminders",
      "Delay alerts today",
      "Telegram success",
    ],
    metricHints: [
      "Tracked across active stores and delivery types.",
      "Orders still eligible for another reminder.",
      "Admin escalations sent since the start of today.",
      "Estimated from the latest operational log window.",
    ],
    queueTitle: "Operational queue",
    queueDescription:
      "Orders most likely to require intervention or continued automated notifications.",
    lastSeenPrefix: "Last seen",
    emptyQueue: "No orders have been processed yet.",
    statuses: {
      new: "New",
      accepted: "Accepted",
      prepared: "Prepared",
      delivered: "Delivered",
    },
  },
  fr: {
    eyebrow: "Vue d'ensemble",
    title: "Centre de commande en direct",
    description:
      "Suivez le flux depuis l'ingestion Redash jusqu'a l'envoi des notifications et des escalades admin. Cette vue met en avant la pression operationnelle, les alertes et les derniers resultats de l'automatisation.",
    exportLabel: "Exporter l'etat operationnel",
    manualPollLabel: "Lancer un poll manuel",
    metricLabels: [
      "Commandes en cours",
      "Rappels en attente",
      "Alertes retard aujourd'hui",
      "Succes Telegram",
    ],
    metricHints: [
      "Suivi sur les magasins actifs et les types de livraison.",
      "Commandes encore eligibles a un autre rappel.",
      "Escalades admin envoyees depuis le debut de la journee.",
      "Estimation basee sur les derniers logs operationnels.",
    ],
    queueTitle: "File operationnelle",
    queueDescription:
      "Commandes les plus susceptibles d'exiger une intervention ou des notifications supplementaires.",
    lastSeenPrefix: "Derniere activite",
    emptyQueue: "Aucune commande n'a encore ete traitee.",
    statuses: {
      new: "Nouvelle",
      accepted: "Acceptee",
      prepared: "Preparee",
      delivered: "Livree",
    },
  },
  ar: {
    eyebrow: "نظرة عامة",
    title: "مركز القيادة المباشر",
    description:
      "تابع المسار من Redash حتى إرسال الإشعارات والتصعيدات الإدارية. هذه الواجهة تعرض ضغط الطلبات وحالة التنبيهات وآخر نتائج الأتمتة.",
    exportLabel: "تصدير الملخص التشغيلي",
    manualPollLabel: "تشغيل سحب يدوي",
    metricLabels: [
      "طلبات قيد المتابعة",
      "تذكيرات معلقة",
      "تنبيهات التأخير اليوم",
      "نجاح تيليغرام",
    ],
    metricHints: [
      "محتسبة عبر المتاجر النشطة وأنواع التوصيل.",
      "طلبات ما زالت مؤهلة لتذكير آخر.",
      "تصعيدات الإدارة المرسلة منذ بداية اليوم.",
      "تقدير مبني على آخر نافذة للسجلات التشغيلية.",
    ],
    queueTitle: "الصف التشغيلي",
    queueDescription:
      "الطلبات الأكثر حاجة للتدخل أو لاستمرار الإشعارات الآلية.",
    lastSeenPrefix: "آخر ظهور",
    emptyQueue: "لم تتم معالجة أي طلبات بعد.",
    statuses: {
      new: "جديد",
      accepted: "مقبول",
      prepared: "جاهز",
      delivered: "مكتمل",
    },
  },
  pt: {
    eyebrow: "Visao Geral",
    title: "Centro de comando ao vivo",
    description:
      "Acompanhe o fluxo desde a ingestao do Redash ate o envio das notificacoes e escalacoes administrativas. Esta visao mostra pressao operacional, postura de alertas e os ultimos resultados da automacao.",
    exportLabel: "Exportar resumo operacional",
    manualPollLabel: "Executar poll manual",
    metricLabels: [
      "Pedidos em movimento",
      "Lembretes pendentes",
      "Alertas de atraso hoje",
      "Sucesso no Telegram",
    ],
    metricHints: [
      "Rastreado nas lojas ativas e nos tipos de entrega.",
      "Pedidos ainda elegiveis para outro lembrete.",
      "Escalacoes administrativas enviadas desde o inicio de hoje.",
      "Estimativa baseada na janela mais recente de logs operacionais.",
    ],
    queueTitle: "Fila operacional",
    queueDescription:
      "Pedidos com maior probabilidade de precisar de intervencao ou novas notificacoes automaticas.",
    lastSeenPrefix: "Ultima atividade",
    emptyQueue: "Nenhum pedido foi processado ainda.",
    statuses: {
      new: "Novo",
      accepted: "Aceito",
      prepared: "Preparado",
      delivered: "Entregue",
    },
  },
};

export default async function DashboardOverviewPage() {
  const context = await requireCompanyContext();
  const language = await getCurrentAppLanguage();
  const copy = COPY[language];
  const dateLocale = getDateFnsLocale(language);
  const data = await getDashboardOverviewData(context.company.id);
  const canSeeOverviewActions = isSuperUserRole(context.profile?.role);

  const metrics = [
    {
      label: copy.metricLabels[0],
      value: String(data.metrics.ordersInMotion),
      hint: copy.metricHints[0],
      icon: faTruckFast,
    },
    {
      label: copy.metricLabels[1],
      value: String(data.metrics.pendingNotifications),
      hint: copy.metricHints[1],
      tone: "warn" as const,
      icon: faBell,
    },
    {
      label: copy.metricLabels[2],
      value: String(data.metrics.delayAlertsToday),
      hint: copy.metricHints[2],
      tone: "good" as const,
      icon: faTriangleExclamation,
    },
    {
      label: copy.metricLabels[3],
      value: data.metrics.telegramDeliverySuccess,
      hint: copy.metricHints[3],
      icon: faPaperPlane,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          canSeeOverviewActions ? (
            <>
              <button className="dashboard-button-secondary rounded-full px-4 py-2 text-sm font-medium">
                {copy.exportLabel}
              </button>
              <form action={runManualPollAction}>
                <button className="dashboard-button-primary rounded-full px-4 py-2 text-sm font-medium">
                  {copy.manualPollLabel}
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

      <SectionCard title={copy.queueTitle} description={copy.queueDescription}>
        <div className="space-y-4">
          {data.recentOrders.map((item) => (
            <div key={item.id} className="dashboard-soft-card rounded-[24px] p-5">
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
                    {copy.lastSeenPrefix}{" "}
                    {formatDistanceToNow(item.lastSeenAt, {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </p>
                </div>
                <StatusPill tone={statusTone(item.status)}>
                  {copy.statuses[item.status] ?? item.status}
                </StatusPill>
              </div>
            </div>
          ))}
          {data.recentOrders.length === 0 ? (
            <div className="dashboard-subtle-card rounded-[24px] border-dashed p-6 text-sm text-[color:var(--dashboard-muted-text)]">
              {copy.emptyQueue}
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
