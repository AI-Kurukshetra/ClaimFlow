import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/features/auth/services/auth.service";

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  redirect(user ? "/dashboard" : "/login");
}

