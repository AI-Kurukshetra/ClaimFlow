import { AuthForm } from "@/features/auth/components/auth-form";
import { loginAction } from "@/features/auth/actions";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <AuthForm
        action={loginAction}
        title="Log in"
        description="Access ClaimFlow with your email and password."
        submitLabel="Log in"
        pendingLabel="Signing in..."
        footerText="Need an account?"
        footerLabel="Create one"
        footerHref="/signup"
        error={getParamValue(params.error)}
        message={getParamValue(params.message)}
      />
    </main>
  );
}

