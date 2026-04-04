import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
  trend?: string;
  icon?: IconDefinition;
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
  icon,
  tone = "default",
}: MetricCardProps) {
  return (
    <article
      className={`flex h-full flex-col rounded-[24px] border p-5 shadow-lg shadow-slate-950/20 ${toneStyles[tone]}`}
    >
      <p className="min-h-[48px] text-sm leading-6 text-[color:var(--dashboard-body)]">
        {label}
      </p>
      <div className="mt-3 flex min-h-[56px] items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--dashboard-border)] bg-[color:var(--dashboard-surface-subtle)] text-[color:var(--dashboard-body)]">
              <FontAwesomeIcon icon={icon} />
            </span>
          ) : null}
          <p className="text-3xl font-semibold tracking-tight text-[color:var(--dashboard-heading)]">
            {value}
          </p>
        </div>
        {trend ? (
          <span className="dashboard-strong-card rounded-full px-3 py-1 text-xs text-[color:var(--dashboard-body)]">
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-3 min-h-[72px] text-sm leading-6 text-[color:var(--dashboard-muted-text)]">
        {hint}
      </p>
    </article>
  );
}
