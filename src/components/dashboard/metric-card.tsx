type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
  trend?: string;
  tone?: "default" | "good" | "warn";
};

const toneStyles = {
  default: "dashboard-soft-card",
  good: "border-emerald-400/25 bg-emerald-400/10",
  warn: "border-amber-300/30 bg-amber-300/10",
};

export function MetricCard({
  label,
  value,
  hint,
  trend,
  tone = "default",
}: MetricCardProps) {
  return (
    <article
      className={`rounded-[24px] border p-5 shadow-lg shadow-slate-950/20 ${toneStyles[tone]}`}
    >
      <p className="text-sm text-[color:var(--dashboard-body)]">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-3xl font-semibold tracking-tight text-[color:var(--dashboard-heading)]">
          {value}
        </p>
        {trend ? (
          <span className="dashboard-strong-card rounded-full px-3 py-1 text-xs text-[color:var(--dashboard-body)]">
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:var(--dashboard-muted-text)]">{hint}</p>
    </article>
  );
}
