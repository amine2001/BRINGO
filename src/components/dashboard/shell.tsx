import { SidebarNav } from "@/components/dashboard/sidebar-nav";

type DashboardShellProps = {
  companyName?: string;
  userEmail?: string;
  bootstrapMode?: boolean;
  canManageCompanies?: boolean;
  children: React.ReactNode;
};

export function DashboardShell({
  companyName = "Unassigned tenant",
  userEmail,
  bootstrapMode = false,
  canManageCompanies = false,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.14),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_40%,_#111827_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-4 sm:px-6 lg:flex-row lg:px-8">
        <aside className="w-full shrink-0 lg:w-80">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
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
              <SidebarNav canManageCompanies={canManageCompanies} />
            </div>
          </div>
        </aside>

        <main className="flex-1 py-2 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
