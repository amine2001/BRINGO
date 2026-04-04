type SectionCardProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionCard({
  title,
  action,
  children,
}: SectionCardProps) {
  return (
    <section className="dashboard-panel rounded-[28px] p-6">
      <div className="flex flex-col gap-4 border-b border-[color:var(--dashboard-border)] pb-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <h3 className="text-xl font-semibold tracking-tight text-[color:var(--dashboard-heading)]">
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}
