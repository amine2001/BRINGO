type StatusPillProps = {
  tone?: "neutral" | "info" | "good" | "warn" | "danger";
  children: React.ReactNode;
};

const toneMap = {
  neutral:
    "border-[color:var(--dashboard-border)] bg-[color:var(--dashboard-surface-subtle)] text-[color:var(--dashboard-body)]",
  info: "border-cyan-400/30 bg-cyan-400/12 text-cyan-200",
  good: "border-emerald-400/30 bg-emerald-400/12 text-emerald-200",
  warn: "border-amber-300/30 bg-amber-300/12 text-amber-200",
  danger: "border-rose-400/30 bg-rose-400/12 text-rose-200",
};

export function StatusPill({
  tone = "neutral",
  children,
}: StatusPillProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
}
