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
}

/**
 * Generates a 6-digit verification code for first-time login and dispatches it
 * to the user's Email or Phone Number via backend API + Supabase notification log.
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

  // 1. Trigger server-side Email (Resend) or SMS (Twilio) if API route is available
  if (typeof window !== "undefined") {
    try {
      await fetch(withBasePath("/api/auth/send-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          address,
          code,
          recipientName,
        }),
      });
    } catch {
      // Static export environment falls back to Supabase log + instant code banner
    }
  }

  // 2. Record the verification notification in Supabase public.meeting_notifications
  if (isSupabaseConfigured()) {
    try {
      const supabase = createBrowserSupabase();
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
  };
}
