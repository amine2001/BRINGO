type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
  trend?: string;
  tone?: "default" | "good" | "warn";
};

const toneStyles = {
  default: "border-white/10 bg-white/6",
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
      <p className="text-sm text-slate-300">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
        {trend ? (
          <span className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-1 text-xs text-slate-200">
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{hint}</p>
    </article>
  );
}
