import {
  createClient as createBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { withBasePath } from "@/lib/assets";

export interface VerificationDispatchResult {
  code: string;
  channel: "email" | "phone";
  address: string;
  messagePreview: string;
  providerSent: boolean;
  providerName: string;
}

/**
 * Generates a 6-digit verification code for first-time login and dispatches it
 * to the user's Email or Phone Number via Cloudflare Worker / Next.js API + Supabase Auth OTP + Supabase notification log.
 */
export async function sendFirstLoginVerificationCode(params: {
  userId?: string;
  recipientName: string;
  recipientRole?: "elderly" | "teen";
  channel: "email" | "phone";
  address: string;
}): Promise<VerificationDispatchResult> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const {
    userId,
    recipientName,
    recipientRole = "teen",
    channel,
    address,
  } = params;

  const messagePreview =
    channel === "phone"
      ? `SilverLingo SMS to ${address}: Your first-time login verification code is ${code}`
      : `SilverLingo Email to ${address}: Your first-time login verification code is ${code}`;

  let providerSent = false;
  let providerName = "instant_code";

  // 1. Trigger Cloudflare Worker / Next.js API route (Twilio / Textbelt for SMS, Resend for Email)
  if (typeof window !== "undefined") {
    try {
      const apiEndpoint = window.location.hostname.includes("github.io")
        ? "https://silverlingo.silverlingo.workers.dev/api/auth/send-code"
        : withBasePath("/api/auth/send-code");

      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          address,
          code,
          recipientName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.providerSent) {
          providerSent = true;
          providerName = data.provider || "server";
        }
      }
    } catch {
      // Fallback to Supabase Auth & instant verification banner below
    }
  }

  // 2. If Email channel and Resend wasn't used, also trigger Supabase Auth built-in Email OTP
  if (isSupabaseConfigured()) {
    try {
      const supabase = createBrowserSupabase();

      if (channel === "email" && !providerSent) {
        supabase.auth
          .signInWithOtp({
            email: address,
            options: {
              shouldCreateUser: true,
              emailRedirectTo:
                typeof window !== "undefined"
                  ? `${window.location.origin}/auth/callback`
                  : undefined,
            },
          })
          .then(({ error }) => {
            if (!error) {
              providerSent = true;
              providerName = "supabase_email";
            }
          }, () => {});
      }

      // 3. Record the verification notification in Supabase public.meeting_notifications
      const isUuid =
        userId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          userId
        );

      await supabase.from("meeting_notifications").insert({
        meeting_id: null,
        recipient_user_id: isUuid ? userId : null,
        recipient_name: recipientName,
        recipient_role: recipientRole,
        channel: channel === "phone" ? "sms" : "email",
        recipient_address: address,
        subject:
          channel === "email"
            ? `SilverLingo First-Time Login Verification Code: ${code}`
            : null,
        message_body: messagePreview,
        delivery_status: "sent",
      });
    } catch {
      // Ignore if table not migrated yet
    }
  }

  return {
    code,
    channel,
    address,
    messagePreview,
    providerSent,
    providerName,
  };
}
