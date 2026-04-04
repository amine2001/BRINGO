import Link from "next/link";

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-400/20 lg:p-12">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.45em] text-cyan-200/75">
              Last Mile Control Tower
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              Control every order event from one operational command center.
            </h1>
            <p className="mt-6 text-base leading-8 text-slate-300">
              Replace scraping workflows with Redash ingestion, deterministic
              routing, notification throttling, and admin-grade alerting.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              "Per-store delivery type routing",
              "Repeat-safe Telegram notifications",
              "Delay escalation to admin channels",
              "Full audit logs for orders and alerts",
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-white/10 bg-white/6 p-5 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-6">
            <p className="text-sm font-medium text-cyan-50">
              Production posture
            </p>
            <p className="mt-3 text-sm leading-7 text-cyan-50/80">
              Route protection, structured logs, Redash API configuration, and
              delivery-type controls are treated as first-class operational
              primitives.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center">{children}</section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center px-4">
        <div className="pointer-events-auto rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm text-slate-700 shadow-lg backdrop-blur">
          Need help onboarding a new tenant?{" "}
          <Link href="/dashboard/users" className="font-semibold text-slate-950">
            Review access controls
          </Link>
        </div>
      </div>
    </div>
  );
}
