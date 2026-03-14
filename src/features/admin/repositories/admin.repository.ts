import type { AuthError, User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type InviteAdjusterRepositoryResult = {
  error: AuthError | null;
  user: User | null;
};

export async function inviteAdjuster(input: {
  email: string;
  firstName: string;
  lastName: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(input.email, {
    data: {
      first_name: input.firstName,
      last_name: input.lastName,
      full_name: `${input.firstName} ${input.lastName}`,
      role: "adjuster",
    },
  });

  return {
    error,
    user: data.user,
  } satisfies InviteAdjusterRepositoryResult;
}
