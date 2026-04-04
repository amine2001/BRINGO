import { cookies } from "next/headers";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import {
  LANGUAGE_COOKIE_NAME,
  resolveAppLanguage,
} from "@/lib/settings/preferences";

type DashboardShellProps = {
  children: React.ReactNode;
};

const HERO_COPY = {
  en: {
    eyebrow: "Last Mile",
    title: "Control Tower",
    description: "API-driven orchestration for orders, notifications, and admin alerting.",
  },
  fr: {
    eyebrow: "Last Mile",
    title: "Control Tower",
    description: "Pilotage des commandes, notifications et alertes admin.",
  },
  ar: {
    eyebrow: "Bringo",
    title: "Control Tower",
    description: "متابعة الطلبات والتنبيهات والتنبيه الاداري في الوقت الحقيقي.",
  },
  pt: {
    eyebrow: "Last Mile",
    title: "Control Tower",
    description: "Orquestracao de pedidos, notificacoes e alertas administrativos.",
  },
} as const;

export async function DashboardShell({ children }: DashboardShellProps) {
  const cookieStore = await cookies();
  const language = resolveAppLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
  const heroCopy = HERO_COPY[language];

  return (
    <div data-dashboard-shell-root="true" className="dashboard-shell min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:px-8">
        <aside className="w-full shrink-0 lg:w-80">
          <div className="dashboard-sidebar-panel overflow-hidden rounded-[28px] p-6">
            <div className="dashboard-hero-card rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--dashboard-eyebrow)]">
                {heroCopy.eyebrow}
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--dashboard-heading)]">
                {heroCopy.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[color:var(--dashboard-body)]">
                {heroCopy.description}
              </p>
            </div>

            <div className="mt-6">
              <SidebarNav language={language} />
            </div>
          </div>
        </aside>

        <main className="flex-1 py-2 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
