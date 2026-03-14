import { signupAction } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/components/auth-form";

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <AuthForm
        action={signupAction}
        mode="signup"
        title="Create your account"
        description="Start ClaimFlow with your name, email, and a secure password."
        submitLabel="Create account"
        pendingLabel="Creating account..."
        footerText="Already registered?"
        footerLabel="Log in"
        footerHref="/login"
        error={getParamValue(params.error)}
        message={getParamValue(params.message)}
      />
    </main>
  );
}
