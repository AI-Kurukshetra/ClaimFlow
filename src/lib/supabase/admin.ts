import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/config/env";

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
