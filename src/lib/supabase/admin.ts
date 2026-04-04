import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv, getSupabaseEnv } from "@/lib/env";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  if (!adminClient) {
    const supabaseEnv = getSupabaseEnv();
    const adminEnv = getSupabaseAdminEnv();

    adminClient = createClient(
      supabaseEnv.NEXT_PUBLIC_SUPABASE_URL,
      adminEnv.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return adminClient;
}
