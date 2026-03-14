import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/config/env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient(url, anonKey);
}

