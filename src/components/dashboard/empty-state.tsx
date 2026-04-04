type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/15 bg-white/4 px-6 py-10 text-center">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
