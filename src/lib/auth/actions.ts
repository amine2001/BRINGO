"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { companies, getDb, users } from "@/lib/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing_credentials");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=invalid_credentials");
  }

  const db = getDb();
  const [profile] = await db
    .select({
      companyId: users.companyId,
    })
    .from(users)
    .where(and(eq(users.id, user.id), eq(users.isActive, true)))
    .limit(1);

  if (!profile) {
    redirect("/login?error=no_dashboard_access");
  }

  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.id, profile.companyId), eq(companies.isActive, true)))
    .limit(1);

  if (!company) {
    redirect("/login?error=no_dashboard_access");
  }

  redirect("/dashboard");
}
