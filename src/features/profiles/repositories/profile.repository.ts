import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileRole = "admin" | "adjuster" | "claimant";

export type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  role: ProfileRole | null;
  created_at: string | null;
};

export async function getProfileById(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, full_name, role, created_at")
    .eq("id", userId)
    .maybeSingle<UserProfile>();

  return { data, error };
}
