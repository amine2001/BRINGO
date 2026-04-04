import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { saveUserAction, toggleUserActiveAction } from "@/lib/dashboard/actions";
import { getUsersPageData } from "@/lib/dashboard/queries";
import { requireCompanyContext } from "@/lib/tenant/context";

const userColumns = [
  { key: "user", label: "User" },
  { key: "role", label: "Role" },
  { key: "tenant", label: "Tenant" },
  { key: "lastSeen", label: "Last seen" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

export default async function UsersPage() {
  const context = await requireCompanyContext();
  const data = await getUsersPageData(context.company.id);
  const companyMap = new Map(data.companies.map((company) => [company.id, company.name]));

  const userRows = data.users.map((user) => ({
    user: (
      <div>
        <p className="font-medium text-white">{user.fullName ?? "Unassigned name"}</p>
        <p className="mt-1 text-xs text-slate-400">{user.email}</p>
      </div>
    ),
    role: user.role,
    tenant: companyMap.get(user.companyId) ?? context.company.name,
    lastSeen: "Tracked via Supabase session",
    status: (
      <StatusPill tone={user.isActive ? "good" : "warn"}>
        {user.isActive ? "Active" : "Disabled"}
      </StatusPill>
    ),
    actions: (
      <form action={toggleUserActiveAction}>
        <input type="hidden" name="userId" value={user.id} />
        <input type="hidden" name="nextValue" value={user.isActive ? "false" : "true"} />
        <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10">
          {user.isActive ? "Disable" : "Enable"}
        </button>
      </form>
    ),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Users"
        title="Manage admin access and tenant ownership"
        description="This screen is structured for Supabase Auth-backed account management, role assignment, and tenant scoping."
        actions={
          <button className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15">
            Invite user
          </button>
        }
      />

      <SectionCard
        title="Admin directory"
        description="All access-sensitive properties are visible at a glance before server actions are wired."
      >
        <DataTable columns={userColumns} rows={userRows} />
      </SectionCard>

      <SectionCard
        title="Create or invite user"
        description="Future actions can bind directly to these fields to create invited users and assign roles."
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
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Tenant</span>
            <select
              name="companyId"
              defaultValue={context.company.id}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
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
              Send invitation
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
