type SectionCardProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionCard({
  title,
  description,
  action,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/45 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <h3 className="text-xl font-semibold tracking-tight text-white">{title}</h3>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}
