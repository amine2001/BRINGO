import Link from "next/link";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";

type DashboardShellProps = {
  companyName?: string;
  userEmail?: string;
  bootstrapMode?: boolean;
  children: React.ReactNode;
};

export function DashboardShell({
  companyName = "Unassigned tenant",
  userEmail,
  bootstrapMode = false,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.14),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_40%,_#111827_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-4 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
            <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/18 via-cyan-400/5 to-transparent p-5">
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">
                Last Mile
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Control Tower
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                API-driven orchestration for orders, notifications, and admin
                alerting.
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/4 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                Workspace
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{companyName}</p>
                  <p className="text-xs text-slate-400">
                    {bootstrapMode
                      ? "Bootstrap mode until the first user profile is assigned"
                      : userEmail ?? "Tenant operations team"}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  {bootstrapMode ? "Bootstrap" : "Live"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <SidebarNav />
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-4 z-20 rounded-[28px] border border-white/10 bg-slate-950/55 px-5 py-4 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                  Admin Console
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  Monitor the full order lifecycle and notification health
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  Polling every 30s
                </div>
                <div className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                  3 delivery types active
                </div>
                <Link
                  href="/logout"
                  className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/14"
                >
                  Sign out
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
