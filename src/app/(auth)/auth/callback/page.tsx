"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleAuth() {
      const code = searchParams.get("code");
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;
      const next = searchParams.get("next");

      const supabase = createClient();
      let authSuccess = false;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) authSuccess = true;
      } else if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash,
        });
        if (!error) authSuccess = true;
      } else {
        // Also check if session was already established via URL hash (#access_token=...)
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) authSuccess = true;
      }

      if (authSuccess) {
        if (next) {
          router.replace(next);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: existingProfile } = await supabase
            .from("users")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle();

          if (existingProfile) {
            const dest =
              existingProfile.role === "elderly" ? "/availability" : "/explore";
            router.replace(dest);
            return;
          }
        }

        router.replace("/onboarding");
      } else {
        router.replace("/login?error=auth_callback_failed");
      }
    }

    handleAuth();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-[#4A148C] text-white flex items-center justify-center p-6">
      <div className="bg-[#5E1B9E] border-2 border-purple-400/50 rounded-3xl p-8 text-center max-w-md w-full shadow-2xl">
        <p className="text-2xl font-bold mb-2">Signing you in...</p>
        <p className="text-lg text-purple-200">
          Preparing your SilverLingo profile...
        </p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#4A148C] text-white flex items-center justify-center p-6">
          <p className="text-2xl font-bold">Signing you in...</p>
        </main>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
