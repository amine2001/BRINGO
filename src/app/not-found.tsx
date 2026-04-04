import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-1 items-center px-6 py-16">
      <div className="surface w-full rounded-[2rem] border border-border p-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-foreground">
          This route is not part of the control tower.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          The page you requested does not exist, or it may require an authenticated
          dashboard session.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
