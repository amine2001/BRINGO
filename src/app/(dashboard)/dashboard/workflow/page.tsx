import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { saveWorkflowSettingsAction } from "@/lib/dashboard/actions";
import { getWorkflowPageData } from "@/lib/dashboard/queries";
import { getCurrentAppLanguage } from "@/lib/settings/server";
import { requireCompanyContext } from "@/lib/tenant/context";
import type { AppLanguage } from "@/lib/settings/preferences";

const COPY: Record<
  AppLanguage,
  {
    eyebrow: string;
    title: string;
    description: string;
    workflowMapTitle: string;
    workflowMapDescription: string;
    stepLabel: string;
    steps: Array<{
      title: string;
      description: string;
      triggerLabel: string;
      actionLabel?: string;
      graceLabel?: string;
      repeatLabel: string;
      formulaLabel?: string;
      lateReminderLabel?: string;
    }>;
    timingTitle: string;
    timingDescription: string;
    profileSource: string;
    customWorkflow: string;
    defaultWorkflow: string;
    acceptanceGrace: string;
    acceptanceReminder: string;
    prepMinutes: string;
    deliveryReminder: string;
    editTitle: string;
    editDescription: string;
    acceptanceGraceInput: string;
    acceptanceReminderInput: string;
    prepMinutesInput: string;
    prepReminderInput: string;
    deliveryReminderInput: string;
    formulaTitle: string;
    formulaDescription: (minutesPerProduct: number) => string;
    saveLabel: string;
  }
> = {
  en: {
    eyebrow: "Workflow",
    title: "Shape and configure the live notification workflow",
    description:
      "This is the real Bringo order workflow: received, not accepted, preparation delay, and delivery alert. The timing values below drive the live poller.",
    workflowMapTitle: "Workflow map",
    workflowMapDescription:
      "Each stage shows when notifications start, what condition keeps them active, and what clears the alert.",
    stepLabel: "STEP",
    steps: [
      {
        title: "Order received",
        description: "When a new order appears the Telegram alert is sent immediately.",
        triggerLabel: "Trigger: new order detected",
        actionLabel: "Action: send first alert instantly",
        repeatLabel: "",
      },
      {
        title: "Waiting acceptance",
        description: "If acceptance is still missing reminders repeat until prep starts.",
        triggerLabel: "Grace period",
        repeatLabel: "Repeat every",
      },
      {
        title: "Preparation SLA",
        description: "The preparation SLA is based on product count and minutes per product.",
        formulaLabel: "Formula: products x",
        lateReminderLabel: "Late reminder every",
        triggerLabel: "",
        repeatLabel: "",
      },
      {
        title: "Delivery alert",
        description: "After preparation ends alert repeats until the order is marked complete.",
        triggerLabel: "Trigger: delivery time exceeds preparation end + 20 min",
        repeatLabel: "Repeat every",
      },
    ],
    timingTitle: "Current timing profile",
    timingDescription:
      "These minutes are read by the live poller and decide when each reminder round starts.",
    profileSource: "Profile source",
    customWorkflow: "Custom workflow",
    defaultWorkflow: "Default workflow",
    acceptanceGrace: "Acceptance grace",
    acceptanceReminder: "Acceptance reminder",
    prepMinutes: "Prep minutes per product",
    deliveryReminder: "Delivery alert reminder",
    editTitle: "Edit workflow timings",
    editDescription: "Change the minutes here to tune the reminder cadence without changing code.",
    acceptanceGraceInput: "Minutes before not accepted reminders start",
    acceptanceReminderInput: "Minutes between not accepted reminders",
    prepMinutesInput: "Preparation minutes per product",
    prepReminderInput: "Minutes between preparation delay reminders",
    deliveryReminderInput: "Minutes between delivery alert reminders",
    formulaTitle: "Current preparation formula",
    formulaDescription: (minutesPerProduct) =>
      `Allowed preparation time = product count x ${minutesPerProduct} minutes. Example: 5 products = ${minutesPerProduct * 5} minutes before the preparation delay reminders begin.`,
    saveLabel: "Save workflow",
  },
  fr: {
    eyebrow: "Workflow",
    title: "Configurer le workflow live des notifications",
    description:
      "Voici le workflow Bringo reel : commande recue, non acceptee, retard preparation et alerte livraison. Les timings ci-dessous pilotent le poller live.",
    workflowMapTitle: "Carte du workflow",
    workflowMapDescription:
      "Chaque etape montre quand les notifications commencent, quelle condition les maintient actives et ce qui les arrete.",
    stepLabel: "ETAPE",
    steps: [
      {
        title: "Commande recue",
        description: "Quand une nouvelle commande apparait, l'alerte Telegram part immediatement.",
        triggerLabel: "Declencheur : nouvelle commande detectee",
        actionLabel: "Action : envoyer la premiere alerte",
        repeatLabel: "",
      },
      {
        title: "En attente d'acceptation",
        description: "Si l'acceptation manque encore, les rappels continuent jusqu'au debut de preparation.",
        triggerLabel: "Delai de grace",
        repeatLabel: "Repeter toutes les",
      },
      {
        title: "SLA preparation",
        description: "Le SLA de preparation depend du nombre de produits et du temps par produit.",
        formulaLabel: "Formule : produits x",
        lateReminderLabel: "Rappel retard toutes les",
        triggerLabel: "",
        repeatLabel: "",
      },
      {
        title: "Alerte livraison",
        description: "Apres la fin de preparation, l'alerte se repete jusqu'a la cloture de la commande.",
        triggerLabel: "Declencheur : livraison depasse fin de preparation + 20 min",
        repeatLabel: "Repeter toutes les",
      },
    ],
    timingTitle: "Profil de timing actuel",
    timingDescription:
      "Ces minutes sont lues par le poller live et determinent le demarrage de chaque rappel.",
    profileSource: "Source du profil",
    customWorkflow: "Workflow personnalise",
    defaultWorkflow: "Workflow par defaut",
    acceptanceGrace: "Grace acceptation",
    acceptanceReminder: "Rappel acceptation",
    prepMinutes: "Minutes prep par produit",
    deliveryReminder: "Rappel alerte livraison",
    editTitle: "Modifier les timings du workflow",
    editDescription: "Changez ici les minutes pour ajuster le rythme des rappels sans toucher au code.",
    acceptanceGraceInput: "Minutes avant le debut des rappels non acceptes",
    acceptanceReminderInput: "Minutes entre deux rappels non acceptes",
    prepMinutesInput: "Minutes de preparation par produit",
    prepReminderInput: "Minutes entre les rappels de retard preparation",
    deliveryReminderInput: "Minutes entre les rappels d'alerte livraison",
    formulaTitle: "Formule de preparation actuelle",
    formulaDescription: (minutesPerProduct) =>
      `Temps de preparation autorise = nombre de produits x ${minutesPerProduct} minutes. Exemple : 5 produits = ${minutesPerProduct * 5} minutes avant le debut des rappels de retard.`,
    saveLabel: "Enregistrer le workflow",
  },
  ar: {
    eyebrow: "سير العمل",
    title: "تشكيل وضبط سير الإشعارات المباشر",
    description:
      "هذا هو سير عمل Bringo الفعلي: طلب جديد، عدم القبول، تأخر التحضير، ثم تنبيه التوصيل. القيم أدناه تتحكم في السحب المباشر.",
    workflowMapTitle: "خريطة سير العمل",
    workflowMapDescription:
      "كل مرحلة توضح متى تبدأ الإشعارات وما الشرط الذي يبقيها نشطة وما الذي يوقفها.",
    stepLabel: "الخطوة",
    steps: [
      {
        title: "استلام الطلب",
        description: "عند ظهور طلب جديد يتم إرسال تنبيه تيليغرام مباشرة.",
        triggerLabel: "المشغل: تم اكتشاف طلب جديد",
        actionLabel: "الإجراء: إرسال أول تنبيه فوراً",
        repeatLabel: "",
      },
      {
        title: "بانتظار القبول",
        description: "إذا لم يتم القبول بعد، تستمر التذكيرات حتى يبدأ التحضير.",
        triggerLabel: "مهلة السماح",
        repeatLabel: "إعادة كل",
      },
      {
        title: "مهلة التحضير",
        description: "مدة التحضير تعتمد على عدد المنتجات والدقائق لكل منتج.",
        formulaLabel: "المعادلة: المنتجات x",
        lateReminderLabel: "تذكير التأخير كل",
        triggerLabel: "",
        repeatLabel: "",
      },
      {
        title: "تنبيه التوصيل",
        description: "بعد انتهاء التحضير يتكرر التنبيه حتى إغلاق الطلب.",
        triggerLabel: "المشغل: وقت التوصيل يتجاوز نهاية التحضير + 20 دقيقة",
        repeatLabel: "إعادة كل",
      },
    ],
    timingTitle: "ملف التوقيت الحالي",
    timingDescription:
      "تتم قراءة هذه الدقائق من قبل السحب المباشر لتحديد بداية كل جولة تذكير.",
    profileSource: "مصدر الملف",
    customWorkflow: "سير عمل مخصص",
    defaultWorkflow: "سير العمل الافتراضي",
    acceptanceGrace: "مهلة القبول",
    acceptanceReminder: "تذكير القبول",
    prepMinutes: "دقائق التحضير لكل منتج",
    deliveryReminder: "تذكير تنبيه التوصيل",
    editTitle: "تعديل توقيتات سير العمل",
    editDescription: "غير عدد الدقائق هنا لضبط تكرار التذكيرات بدون تعديل الكود.",
    acceptanceGraceInput: "الدقائق قبل بدء تذكيرات عدم القبول",
    acceptanceReminderInput: "الدقائق بين تذكيرات عدم القبول",
    prepMinutesInput: "دقائق التحضير لكل منتج",
    prepReminderInput: "الدقائق بين تذكيرات تأخر التحضير",
    deliveryReminderInput: "الدقائق بين تذكيرات تنبيه التوصيل",
    formulaTitle: "معادلة التحضير الحالية",
    formulaDescription: (minutesPerProduct) =>
      `وقت التحضير المسموح = عدد المنتجات × ${minutesPerProduct} دقيقة. مثال: 5 منتجات = ${minutesPerProduct * 5} دقيقة قبل بدء تذكيرات التأخير.`,
    saveLabel: "حفظ سير العمل",
  },
  pt: {
    eyebrow: "Workflow",
    title: "Configurar o workflow ao vivo das notificacoes",
    description:
      "Este e o workflow real da Bringo: pedido recebido, nao aceito, atraso de preparacao e alerta de entrega. Os tempos abaixo controlam o poller ao vivo.",
    workflowMapTitle: "Mapa do workflow",
    workflowMapDescription:
      "Cada etapa mostra quando as notificacoes comecam, qual condicao as mantem ativas e o que encerra o alerta.",
    stepLabel: "ETAPA",
    steps: [
      {
        title: "Pedido recebido",
        description: "Quando um novo pedido aparece, o alerta do Telegram e enviado imediatamente.",
        triggerLabel: "Gatilho: novo pedido detectado",
        actionLabel: "Acao: enviar o primeiro alerta imediatamente",
        repeatLabel: "",
      },
      {
        title: "Aguardando aceitacao",
        description: "Se a aceitacao ainda nao aconteceu, os lembretes continuam ate o inicio da preparacao.",
        triggerLabel: "Periodo de tolerancia",
        repeatLabel: "Repetir a cada",
      },
      {
        title: "SLA de preparacao",
        description: "O SLA de preparacao e baseado no numero de produtos e minutos por produto.",
        formulaLabel: "Formula: produtos x",
        lateReminderLabel: "Lembrete de atraso a cada",
        triggerLabel: "",
        repeatLabel: "",
      },
      {
        title: "Alerta de entrega",
        description: "Depois que a preparacao termina, o alerta se repete ate o pedido ser concluido.",
        triggerLabel: "Gatilho: tempo de entrega excede fim da preparacao + 20 min",
        repeatLabel: "Repetir a cada",
      },
    ],
    timingTitle: "Perfil atual de tempos",
    timingDescription:
      "Esses minutos sao lidos pelo poller ao vivo e definem o inicio de cada rodada de lembretes.",
    profileSource: "Origem do perfil",
    customWorkflow: "Workflow personalizado",
    defaultWorkflow: "Workflow padrao",
    acceptanceGrace: "Tolerancia de aceitacao",
    acceptanceReminder: "Lembrete de aceitacao",
    prepMinutes: "Minutos de preparo por produto",
    deliveryReminder: "Lembrete de alerta de entrega",
    editTitle: "Editar tempos do workflow",
    editDescription: "Altere os minutos aqui para ajustar a cadencia dos lembretes sem mudar o codigo.",
    acceptanceGraceInput: "Minutos antes do inicio dos lembretes de nao aceitacao",
    acceptanceReminderInput: "Minutos entre os lembretes de nao aceitacao",
    prepMinutesInput: "Minutos de preparacao por produto",
    prepReminderInput: "Minutos entre os lembretes de atraso de preparacao",
    deliveryReminderInput: "Minutos entre os lembretes de alerta de entrega",
    formulaTitle: "Formula atual de preparacao",
    formulaDescription: (minutesPerProduct) =>
      `Tempo permitido de preparacao = quantidade de produtos x ${minutesPerProduct} minutos. Exemplo: 5 produtos = ${minutesPerProduct * 5} minutos antes de comecarem os lembretes de atraso.`,
    saveLabel: "Salvar workflow",
  },
};

export default async function WorkflowPage() {
  const context = await requireCompanyContext();
  const language = await getCurrentAppLanguage();
  const copy = COPY[language];
  const data = await getWorkflowPageData(context.company.id);
  const workflow = data.settings;

  const steps = [
    {
      step: "01",
      title: copy.steps[0].title,
      tone: "info" as const,
      description: copy.steps[0].description,
      details: [copy.steps[0].triggerLabel, copy.steps[0].actionLabel ?? ""],
    },
    {
      step: "02",
      title: copy.steps[1].title,
      tone: "warn" as const,
      description: copy.steps[1].description,
      details: [
        `${copy.steps[1].triggerLabel}: ${workflow.acceptanceGraceMinutes} min`,
        `${copy.steps[1].repeatLabel}: ${workflow.acceptanceReminderIntervalMinutes} min`,
      ],
    },
    {
      step: "03",
      title: copy.steps[2].title,
      tone: "good" as const,
      description: copy.steps[2].description,
      details: [
        `${copy.steps[2].formulaLabel} ${workflow.preparationMinutesPerProduct} min`,
        `${copy.steps[2].lateReminderLabel}: ${workflow.preparationReminderIntervalMinutes} min`,
      ],
    },
    {
      step: "04",
      title: copy.steps[3].title,
      tone: "danger" as const,
      description: copy.steps[3].description,
      details: [
        copy.steps[3].triggerLabel,
        `${copy.steps[3].repeatLabel}: ${workflow.deliveryAlertReminderIntervalMinutes} min`,
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />

      <SectionCard title={copy.workflowMapTitle} description={copy.workflowMapDescription}>
        <div className="grid gap-4 xl:grid-cols-4">
          {steps.map((item, idx) => {
            const gradient =
              [
                "bg-gradient-to-b from-[#0c1f2d] to-[#132b3c]",
                "bg-gradient-to-b from-[#2b2211] to-[#3d2d14]",
                "bg-gradient-to-b from-[#0d2418] to-[#123927]",
                "bg-gradient-to-b from-[#2b1118] to-[#431521]",
              ][idx] ?? "bg-[color:var(--dashboard-surface)]";

            return (
              <div
                key={item.step}
                className={`dashboard-soft-card relative h-full overflow-hidden rounded-[26px] p-5 ${gradient}`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
                <div className="relative flex h-full flex-col">
                  <div className="flex flex-col items-start gap-3">
                    <span className="text-xs font-semibold tracking-[0.35em] text-[color:var(--dashboard-muted-text)]">
                      {copy.stepLabel} {item.step}
                    </span>
                    <StatusPill tone={item.tone}>{item.title}</StatusPill>
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
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title={copy.timingTitle} description={copy.timingDescription}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <p className="text-sm text-[color:var(--dashboard-muted-text)]">{copy.profileSource}</p>
            <div className="mt-3">
              <StatusPill tone={data.isCustom ? "good" : "neutral"}>
                {data.isCustom ? copy.customWorkflow : copy.defaultWorkflow}
              </StatusPill>
            </div>
          </div>
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <p className="text-sm text-[color:var(--dashboard-muted-text)]">{copy.acceptanceGrace}</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--dashboard-heading)]">
              {workflow.acceptanceGraceMinutes} min
            </p>
          </div>
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <p className="text-sm text-[color:var(--dashboard-muted-text)]">{copy.acceptanceReminder}</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--dashboard-heading)]">
              {workflow.acceptanceReminderIntervalMinutes} min
            </p>
          </div>
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <p className="text-sm text-[color:var(--dashboard-muted-text)]">{copy.prepMinutes}</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--dashboard-heading)]">
              {workflow.preparationMinutesPerProduct} min
            </p>
          </div>
          <div className="dashboard-soft-card rounded-[24px] p-5">
            <p className="text-sm text-[color:var(--dashboard-muted-text)]">{copy.deliveryReminder}</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--dashboard-heading)]">
              {workflow.deliveryAlertReminderIntervalMinutes} min
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={copy.editTitle} description={copy.editDescription}>
        <form action={saveWorkflowSettingsAction} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-[color:var(--dashboard-body)]">
            <span className="block font-medium text-[color:var(--dashboard-heading)]">
              {copy.acceptanceGraceInput}
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
              {copy.acceptanceReminderInput}
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
              {copy.prepMinutesInput}
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
              {copy.prepReminderInput}
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
              {copy.deliveryReminderInput}
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
              {copy.formulaTitle}
            </p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--dashboard-body)]">
              {copy.formulaDescription(workflow.preparationMinutesPerProduct)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button
              type="submit"
              className="dashboard-button-primary rounded-full px-5 py-3 text-sm font-semibold"
            >
              {copy.saveLabel}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
