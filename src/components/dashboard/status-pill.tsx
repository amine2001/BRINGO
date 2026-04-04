type StatusPillProps = {
  tone?: "neutral" | "info" | "good" | "warn" | "danger";
  children: React.ReactNode;
};

const toneMap = {
  neutral: "border-white/10 bg-white/5 text-slate-200",
  info: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
  good: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  warn: "border-amber-300/30 bg-amber-300/10 text-amber-50",
  danger: "border-rose-400/30 bg-rose-400/10 text-rose-100",
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
