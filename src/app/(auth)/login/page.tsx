import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { signInWithPasswordAction } from "@/lib/auth/actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorCopy: Record<string, string> = {
  missing_credentials: "Enter both your email address and password to continue.",
  invalid_credentials: "The provided credentials could not be verified.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage = params.error ? errorCopy[params.error] : null;

  return (
    <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-300/40 backdrop-blur xl:p-10">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
          Secure Access
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Sign in to the control tower
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Use your Supabase-backed admin account to manage stores, notification
          routing, Redash connectivity, and alert thresholds.
        </p>
      </div>

      <form action={signInWithPasswordAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-slate-700"
          >
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="ops@company.com"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <button
              type="button"
              className="text-sm font-medium text-cyan-700 transition hover:text-cyan-900"
            >
              Reset password
            </button>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          />
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
            Keep this device trusted for 7 days
          </label>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            SSO ready
          </span>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Sign in
        </button>
      </form>

      {errorMessage ? (
        <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Operational reminder</p>
        <p className="mt-2 leading-6 text-amber-800">
          Admin sessions should be limited to authorized users because this
          console controls Telegram delivery routing and tenant-level API
          credentials.
        </p>
      </div>
    </div>
  );
}
