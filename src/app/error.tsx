"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-1 items-center px-6 py-16">
      <div className="surface w-full rounded-[2rem] border border-border p-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Application Error
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-foreground">
          The control tower hit an unexpected issue.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Retry this view. If the issue persists, inspect the server logs and
          recent order-processing events from the admin dashboard.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
