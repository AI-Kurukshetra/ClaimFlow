import type { AuthError, User } from "@supabase/supabase-js";

import { getAppUrl } from "@/config/env";
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
  const redirectTo = `${getAppUrl()}/auth/callback`;

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(input.email, {
    data: {
      first_name: input.firstName,
      last_name: input.lastName,
      full_name: `${input.firstName} ${input.lastName}`,
      role: "adjuster",
    },
    redirectTo,
  });

  return {
    error,
    user: data.user,
  } satisfies InviteAdjusterRepositoryResult;
}
