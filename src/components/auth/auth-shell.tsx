import Link from "next/link";

import { getCurrentAppLanguage } from "@/lib/settings/server";
import type { AppLanguage } from "@/lib/settings/preferences";

type AuthShellProps = {
  children: React.ReactNode;
};

const COPY: Record<
  AppLanguage,
  {
    eyebrow: string;
    title: string;
    description: string;
    bullets: [string, string, string, string];
    panelTitle: string;
    panelDescription: string;
    footerPrompt: string;
    footerLink: string;
  }
> = {
  en: {
    eyebrow: "Last Mile Control Tower",
    title: "Control every order event from one operational command center.",
    description:
      "Replace scraping workflows with Redash ingestion, deterministic routing, notification throttling, and admin-grade alerting.",
    bullets: [
      "Per-store delivery type routing",
      "Repeat-safe Telegram notifications",
      "Delay escalation to admin channels",
      "Full audit logs for orders and alerts",
    ],
    panelTitle: "Production posture",
    panelDescription:
      "Route protection, structured logs, Redash API configuration, and delivery-type controls are treated as first-class operational primitives.",
    footerPrompt: "Need help onboarding a new tenant?",
    footerLink: "Review access controls",
  },
  fr: {
    eyebrow: "Last Mile Control Tower",
    title: "Controlez chaque evenement commande depuis un seul centre operationnel.",
    description:
      "Remplacez le scraping par l'ingestion Redash, un routage deterministe, des notifications maitrisees et des alertes admin fiables.",
    bullets: [
      "Routage des types de livraison par magasin",
      "Notifications Telegram sans doublon",
      "Escalade des retards vers les canaux admin",
      "Logs complets pour commandes et alertes",
    ],
    panelTitle: "Posture de production",
    panelDescription:
      "Protection du routage, logs structures, configuration API Redash et controles de livraison sont traites comme des briques operationnelles critiques.",
    footerPrompt: "Besoin d'aide pour integrer un nouvel espace ?",
    footerLink: "Verifier les acces",
  },
  ar: {
    eyebrow: "برج التحكم للعمليات",
    title: "تحكم في كل حدث يخص الطلبات من مركز تشغيلي واحد.",
    description:
      "استبدل أساليب السحب التقليدية بربط Redash وتوجيه واضح وتنبيهات تيليغرام مضبوطة وتصعيدات إدارية موثوقة.",
    bullets: [
      "توجيه أنواع التوصيل لكل متجر",
      "إشعارات تيليغرام آمنة من التكرار",
      "تصعيد التأخير إلى قنوات الإدارة",
      "سجلات كاملة للطلبات والتنبيهات",
    ],
    panelTitle: "جاهزية الإنتاج",
    panelDescription:
      "حماية التوجيه والسجلات المنظمة وإعداد API الخاص بـ Redash وضوابط التوصيل تعتبر عناصر تشغيل أساسية.",
    footerPrompt: "هل تحتاج للمساعدة في تهيئة مساحة جديدة؟",
    footerLink: "راجع صلاحيات الوصول",
  },
  pt: {
    eyebrow: "Last Mile Control Tower",
    title: "Controle cada evento do pedido a partir de um unico centro operacional.",
    description:
      "Substitua fluxos de scraping por ingestao Redash, roteamento deterministico, notificacoes controladas e alertas administrativos confiaveis.",
    bullets: [
      "Roteamento por tipo de entrega em cada loja",
      "Notificacoes Telegram seguras contra repeticao",
      "Escalacao de atraso para canais administrativos",
      "Logs completos para pedidos e alertas",
    ],
    panelTitle: "Postura de producao",
    panelDescription:
      "Protecao de rotas, logs estruturados, configuracao da API Redash e controles de entrega sao tratados como elementos operacionais centrais.",
    footerPrompt: "Precisa de ajuda para ativar um novo espaco?",
    footerLink: "Rever controles de acesso",
  },
};

export async function AuthShell({ children }: AuthShellProps) {
  const language = await getCurrentAppLanguage();
  const copy = COPY[language];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-400/20 lg:p-12">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.45em] text-cyan-200/75">{copy.eyebrow}</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{copy.title}</h1>
            <p className="mt-6 text-base leading-8 text-slate-300">{copy.description}</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {copy.bullets.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-white/10 bg-white/6 p-5 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-6">
            <p className="text-sm font-medium text-cyan-50">{copy.panelTitle}</p>
            <p className="mt-3 text-sm leading-7 text-cyan-50/80">{copy.panelDescription}</p>
          </div>
        </section>

        <section className="flex items-center justify-center">{children}</section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center px-4">
        <div className="pointer-events-auto rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm text-slate-700 shadow-lg backdrop-blur">
          {copy.footerPrompt}{" "}
          <Link href="/dashboard/access" className="font-semibold text-slate-950">
            {copy.footerLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
