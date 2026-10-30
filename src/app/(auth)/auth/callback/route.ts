import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
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
  }

  if (authSuccess) {
    if (next) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Check if the authenticated user already has a profile in public.users
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
        return NextResponse.redirect(`${origin}${dest}`);
      }
    }

    // New user -> send to /onboarding to complete their profile
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
