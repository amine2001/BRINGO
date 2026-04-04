import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-pattern absolute inset-0 opacity-40" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-14 px-6 py-20 lg:flex-row lg:items-end lg:px-10">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur">
              Last Mile Control Tower
            </div>
            <div className="space-y-6">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                Replace scraping with an API-first control plane for dispatch,
                alerting, and exception handling.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Monitor Redash orders in near real time, route Telegram alerts
                by store and delivery type, control reminder cadence, and keep
                admins ahead of delays from one secure dashboard.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-[0_16px_40px_rgba(215,106,45,0.22)] hover:-translate-y-0.5"
              >
                Open Control Tower
              </Link>
              <a
                href="#capabilities"
                className="inline-flex items-center justify-center rounded-full border border-border bg-card/80 px-6 py-3 text-sm font-semibold text-foreground hover:bg-card"
              >
                Explore Capabilities
              </a>
            </div>
          </div>
          <div className="surface relative w-full max-w-xl rounded-[2rem] border border-border p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-sm text-muted-foreground">Polling cadence</p>
                <p className="font-mono text-2xl font-semibold">30s</p>
              </div>
              <div className="rounded-full bg-success/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-success">
                Healthy
              </div>
            </div>
            <div className="mt-6 space-y-4 text-sm">
              {[
                {
                  label: "Redash",
                  value: "JSON / CSV normalized to order events",
                },
                {
                  label: "Routing",
                  value: "Express, Market, Hyper mapped per store",
                },
                {
                  label: "Reminders",
                  value: "Repeat count, interval, accepted/delivered stop rules",
                },
                {
                  label: "Escalation",
                  value: "Admin delay alerts with threshold controls",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border bg-background/65 px-4 py-3"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-base text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="capabilities"
        className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-16 lg:grid-cols-3 lg:px-10"
      >
        {[
          {
            title: "Operational Signal",
            description:
              "Detect new orders, status drift, and exceptions with a normalized order-processing pipeline backed by PostgreSQL.",
          },
          {
            title: "Targeted Messaging",
            description:
              "Send the right Telegram message to the right group based on store-level delivery type mapping, not one-size-fits-all broadcasts.",
          },
          {
            title: "Admin Governance",
            description:
              "Configure polling, reminders, thresholds, API credentials, users, and logs from an auth-protected dashboard.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="surface rounded-[1.75rem] border border-border p-6"
          >
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Capability
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-foreground">
              {item.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {item.description}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
