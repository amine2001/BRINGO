import { formatDistanceToNow } from "date-fns";

import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  deleteCompanyAction,
  saveCompanyAction,
} from "@/lib/dashboard/actions";
import { getCompaniesPageData } from "@/lib/dashboard/queries";
import { requireSuperUserContext } from "@/lib/tenant/context";

const companyColumns = [
  { key: "company", label: "Company" },
  { key: "members", label: "Users" },
  { key: "stores", label: "Stores" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

export default async function CompaniesPage() {
  const context = await requireSuperUserContext();
  const data = await getCompaniesPageData();

  const companyRows = data.companies.map((company) => ({
    company: (
      <div>
        <p className="font-medium text-white">{company.name}</p>
        <p className="mt-1 text-xs text-slate-400">{company.slug}</p>
        <p className="mt-2 text-xs text-slate-500">
          Created {formatDistanceToNow(company.createdAt, { addSuffix: true })}
        </p>
      </div>
    ),
    members: company.userCount,
    stores: company.storeCount,
    status: (
      <StatusPill tone={company.isActive ? "good" : "warn"}>
        {company.isActive ? "Active" : "Inactive"}
      </StatusPill>
    ),
    actions:
      company.id === context.company.id ? (
        <span className="text-xs text-slate-400">Current workspace</span>
      ) : (
        <form action={deleteCompanyAction}>
          <input type="hidden" name="companyId" value={company.id} />
          <button className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-400/15">
            Remove company
          </button>
        </form>
      ),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Companies"
        title="Add and remove companies"
        description="This section is reserved for super users. Removing a company permanently deletes its users, stores, mappings, and logs."
      />

      <SectionCard
        title="Company directory"
        description="Track each company, its current footprint, and remove workspaces you no longer need."
      >
        <DataTable columns={companyColumns} rows={companyRows} />
      </SectionCard>

      <SectionCard
        title="Add company"
        description="Create a new workspace and the system will generate its slug automatically from the company name."
      >
        <form action={saveCompanyAction} className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block font-medium text-white">Company name</span>
            <input
              name="name"
              type="text"
              placeholder="Hyper Al Mazar"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Add company
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
