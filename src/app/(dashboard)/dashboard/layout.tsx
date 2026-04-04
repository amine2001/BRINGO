import { DashboardShell } from "@/components/dashboard/shell";
import { requireCompanyContext } from "@/lib/tenant/context";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireCompanyContext();

  return (
    <DashboardShell
      companyName={context.company.name}
      userEmail={context.authUser.email ?? undefined}
      bootstrapMode={context.bootstrapMode}
    >
      {children}
    </DashboardShell>
  );
}
