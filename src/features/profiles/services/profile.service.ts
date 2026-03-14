import { getProfileById } from "@/features/profiles/repositories/profile.repository";

export async function getUserProfile(userId: string) {
  const result = await getProfileById(userId);

  if (result.error) {
    return null;
  }

  return result.data;
}

export async function isAdminUser(userId: string) {
  const profile = await getUserProfile(userId);

  return profile?.role === "admin";
}
