import { DashboardShell } from "@/components/dashboard/shell";
import { requireCompanyContext } from "@/lib/tenant/context";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireCompanyContext();

  return <DashboardShell>{children}</DashboardShell>;
}
