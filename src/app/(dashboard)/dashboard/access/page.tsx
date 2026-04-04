import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  saveUserAction,
  toggleUserActiveAction,
} from "@/lib/dashboard/actions";
import { getUsersPageData } from "@/lib/dashboard/queries";
import { USER_ROLES, isSuperUserRole } from "@/lib/auth/roles";
import { canManageCompanies, requireCompanyContext } from "@/lib/tenant/context";

const accessColumns = [
  { key: "user", label: "User" },
  { key: "role", label: "Role" },
  { key: "company", label: "Company" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

export default async function AccessPage() {
  const context = await requireCompanyContext();
  const hasCompanyAccess = canManageCompanies(context);
  const data = await getUsersPageData(context.company.id, context.profile?.role);
  const companyMap = new Map(data.companies.map((company) => [company.id, company.name]));
  const roleOptions = hasCompanyAccess
    ? USER_ROLES
    : USER_ROLES.filter((role) => role !== "super_user");

  const accessRows = data.users.map((user) => ({
    user: (
      <div>
        <p className="font-medium text-white">{user.fullName ?? "Unassigned name"}</p>
        <p className="mt-1 text-xs text-slate-400">{user.email}</p>
      </div>
    ),
    role: (
      <StatusPill tone={isSuperUserRole(user.role) ? "info" : "neutral"}>
        {user.role.replace("_", " ")}
      </StatusPill>
    ),
    company: companyMap.get(user.companyId) ?? context.company.name,
    status: (
      <StatusPill tone={user.isActive ? "good" : "warn"}>
        {user.isActive ? "Active" : "Disabled"}
      </StatusPill>
    ),
    actions: (
      <div className="space-y-3">
        <form action={saveUserAction} className="flex flex-col gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="fullName" value={user.fullName ?? ""} />
          <input type="hidden" name="email" value={user.email ?? ""} />
          <div className="flex flex-col gap-2 xl:flex-row">
            <select
              name="role"
              defaultValue={user.role}
              className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role.replace("_", " ")}
                </option>
              ))}
            </select>
            <select
              name="companyId"
              defaultValue={user.companyId}
              disabled={!hasCompanyAccess}
              className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            >
              {data.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <button className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/15">
              Save access
            </button>
          </div>
        </form>

        <form action={toggleUserActiveAction}>
          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="nextValue" value={user.isActive ? "false" : "true"} />
          <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10">
            {user.isActive ? "Disable user" : "Enable user"}
          </button>
        </form>
      </div>
    ),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access"
        title="Manage users, roles, and workspace access"
        description={
          hasCompanyAccess
            ? "Super users can assign roles across companies and unlock the company management section."
            : "Manage your team's access inside the current company. Super user access is reserved for platform administrators."
        }
      />

      <SectionCard
        title="Access directory"
        description="Review each user's role, company scope, and account status from one screen."
      >
        <DataTable columns={accessColumns} rows={accessRows} />
      </SectionCard>

      <SectionCard
        title="Create access"
        description="Add a new user, choose the role, and place them in the right company."
      >
        <form action={saveUserAction} className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Full name</span>
            <input
              name="fullName"
              type="text"
              placeholder="Sara El Idrissi"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Email address</span>
            <input
              name="email"
              type="email"
              placeholder="admin@company.com"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Temporary password</span>
            <input
              name="password"
              type="password"
              placeholder="Set an initial password"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Role</span>
            <select
              name="role"
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Company</span>
            <select
              name="companyId"
              defaultValue={context.company.id}
              disabled={!hasCompanyAccess}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            >
              {data.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Create user
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
