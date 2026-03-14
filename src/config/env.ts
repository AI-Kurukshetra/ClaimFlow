const requiredPublicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const requiredAdminEnv = {
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

function getMissingVariables() {
  return Object.entries(requiredPublicEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

function getMissingAdminVariables() {
  return Object.entries(requiredAdminEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

export function assertSupabaseEnv() {
  const missing = getMissingVariables();

  if (missing.length > 0) {
    throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}.`);
  }
}

export function getSupabaseEnv() {
  assertSupabaseEnv();

  return {
    url: requiredPublicEnv.supabaseUrl as string,
    anonKey: requiredPublicEnv.supabaseAnonKey as string,
  };
}

export function assertSupabaseAdminEnv() {
  assertSupabaseEnv();

  const missing = getMissingAdminVariables();

  if (missing.length > 0) {
    throw new Error(`Missing Supabase admin environment variables: ${missing.join(", ")}.`);
  }
}

export function getSupabaseAdminEnv() {
  assertSupabaseAdminEnv();

  return {
    url: requiredPublicEnv.supabaseUrl as string,
    serviceRoleKey: requiredAdminEnv.serviceRoleKey as string,
  };
}
