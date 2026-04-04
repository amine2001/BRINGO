import "server-only";

import { and, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { isSuperUserRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { companies, getDb, users } from "@/lib/db";

export type CompanyContext = {
  authUser: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  company: typeof companies.$inferSelect;
  profile: typeof users.$inferSelect | null;
  bootstrapMode: boolean;
};

export async function getOptionalCompanyContext(): Promise<CompanyContext | null> {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return null;
  }

  const db = getDb();
  const [profile] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, authUser.id), eq(users.isActive, true)))
    .limit(1);

  if (profile) {
    const [company] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, profile.companyId), eq(companies.isActive, true)))
      .limit(1);

    if (!company) {
      return null;
    }

    return {
      authUser,
      company,
      profile,
      bootstrapMode: false,
    };
  }

  const [{ totalUsers }] = await db
    .select({ totalUsers: count() })
    .from(users);

  if (totalUsers > 0) {
    return null;
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.isActive, true))
    .limit(1);

  if (!company) {
    return null;
  }

  return {
    authUser,
    company,
    profile: null,
    bootstrapMode: true,
  };
}

export async function requireCompanyContext(): Promise<CompanyContext> {
  const context = await getOptionalCompanyContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export function canManageCompanies(context: CompanyContext) {
  return context.bootstrapMode || isSuperUserRole(context.profile?.role);
}

export async function requireSuperUserContext(): Promise<CompanyContext> {
  const context = await requireCompanyContext();

  if (!canManageCompanies(context)) {
    redirect("/dashboard/access");
  }

  return context;
}
