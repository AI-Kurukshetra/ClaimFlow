import { cache } from "react";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/features/auth/services/auth.service";
import { getUserProfile } from "@/features/profiles/services/profile.service";
import type { ProfileRole, UserProfile } from "@/features/profiles/repositories/profile.repository";

type DashboardContext = {
  profile: UserProfile | null;
  role: ProfileRole;
  user: {
    email?: string | null;
    id: string;
  };
};

export const getDashboardContext = cache(async (): Promise<DashboardContext> => {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile(user.id);
  const role = profile?.role ?? "claimant";

  return {
    profile,
    role,
    user: {
      id: user.id,
      email: user.email,
    },
  };
});

export function getDashboardHomeHref(role: ProfileRole | null | undefined) {
  switch (role) {
    case "adjuster":
      return "/dashboard/adjuster/reviewing";
    case "claimant":
      return "/dashboard/claimant/dashboard";
    case "admin":
    default:
      return "/dashboard";
  }
}

export async function requireDashboardRole(expectedRole: ProfileRole) {
  const context = await getDashboardContext();

  if (context.role !== expectedRole) {
    redirect(getDashboardHomeHref(context.role));
  }

  return context;
}


