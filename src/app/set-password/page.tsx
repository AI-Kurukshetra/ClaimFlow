import { redirect } from "next/navigation";

import { SetPasswordForm } from "@/features/auth/components/set-password-form";
import { getAuthenticatedUser } from "@/features/auth/services/auth.service";

export default async function SetPasswordPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="auth-page">
      <SetPasswordForm />
    </main>
  );
}
