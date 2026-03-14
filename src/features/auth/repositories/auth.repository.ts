import type { AuthError, User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthRepositoryResult = {
  error: AuthError | null;
  user: User | null;
  hasSession: boolean;
};

export async function signInWithPassword(input: {
  email: string;
  password: string;
}): Promise<AuthRepositoryResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);

  return {
    error,
    user: data.user,
    hasSession: Boolean(data.session),
  };
}

export async function signUpWithPassword(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthRepositoryResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
        full_name: `${input.firstName} ${input.lastName}`,
      },
    },
  });

  return {
    error,
    user: data.user,
    hasSession: Boolean(data.session),
  };
}

export async function signOutUser() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  return { error };
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
