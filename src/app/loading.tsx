export default function Loading() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-1 items-center justify-center px-6 py-16">
      <div className="surface w-full rounded-[2rem] border border-border p-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Loading
        </p>
        <div className="mx-auto mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
        </div>
      </div>
    </main>
  );
}
