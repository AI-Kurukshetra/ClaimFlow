"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function getHashParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash);
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    let isMounted = true;

    async function completeAuth() {
      const supabase = createSupabaseBrowserClient();
      const hashParams = getHashParams();
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const errorDescription = hashParams.get("error_description") || searchParams.get("error_description");
      const errorCode = hashParams.get("error_code") || searchParams.get("error_code");
      const code = searchParams.get("code");

      if (errorDescription || errorCode) {
        const error = errorDescription || errorCode || "Authentication failed.";
        router.replace(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
      } else {
        router.replace("/login?error=Missing authentication token.");
        return;
      }

      if (isMounted) {
        setMessage("Redirecting to password setup...");
      }

      router.replace("/set-password");
      router.refresh();
    }

    void completeAuth();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-copy">
          <p className="eyebrow">ClaimFlow</p>
          <h1>Finalizing Access</h1>
          <p>{message}</p>
        </div>
      </section>
    </main>
  );
}
