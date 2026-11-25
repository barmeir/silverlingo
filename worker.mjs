/**
 * Cloudflare Worker entrypoint for SilverLingo.
 * Handles /api/auth/send-code and /api/meetings/notify on the Cloudflare Edge,
 * and falls back to serving the static Next.js export (./out) via env.ASSETS.
 */

async function sendSmsEdge(env, to, body) {
  if (!to || !body) return { sent: false, provider: "none" };

  // 1. Try Twilio SMS if configured in Cloudflare Worker environment variables
  const sid = env?.TWILIO_ACCOUNT_SID;
  const token = env?.TWILIO_AUTH_TOKEN;
  const from = env?.TWILIO_PHONE_NUMBER;
  if (sid && token && from) {
    try {
      const auth = btoa(`${sid}:${token}`);
      const params = new URLSearchParams({ To: to, From: from, Body: body });
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );
      if (res.ok) {
        return { sent: true, provider: "twilio" };
      }
    } catch {}
  }

  // 2. Try Textbelt SMS gateway (supports TEXTBELT_API_KEY or free daily US/CA quota key "textbelt")
  try {
    const textbeltKey = env?.TEXTBELT_API_KEY || "textbelt";
    const tbRes = await fetch("https://textbelt.com/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: to,
        message: body,
        key: textbeltKey,
      }),
    });
    const tbData = await tbRes.json();
    if (tbData?.success) {
      return { sent: true, provider: "textbelt" };
    }
  } catch {}

  return { sent: false, provider: "fallback_ui" };
}

async function sendEmailEdge(env, to, subject, textBody) {
  if (!to || !subject || !textBody) return { sent: false, provider: "none" };

  // 1. Try Resend Email API if configured in Cloudflare Worker environment variables
  const resendKey = env?.RESEND_API_KEY;
  const fromEmail =
    env?.RESEND_FROM_EMAIL || "SilverLingo <onboarding@resend.dev>";
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          text: textBody,
        }),
      });
      if (res.ok) {
        return { sent: true, provider: "resend" };
      }
    } catch {}
  }

  return { sent: false, provider: "supabase_or_fallback_ui" };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 1. POST /api/auth/send-code
    if (
      request.method === "POST" &&
      url.pathname.endsWith("/api/auth/send-code")
    ) {
      try {
        const body = await request.json();
        const {
          channel,
          address,
          code,
          recipientName = "SilverLingo User",
        } = body;

        if (!channel || !address || !code) {
          return Response.json(
            { error: "channel, address, and code are required." },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        const smsText = `SilverLingo Verification Code: ${code}. Enter this 6-digit code to complete your first-time sign-in.`;
        const emailSubject = `SilverLingo Verification Code: ${code}`;
        const emailBody = [
          `Hi ${recipientName},`,
          ``,
          `Welcome to SilverLingo! Here is your 6-digit verification code for your first-time sign-in:`,
          ``,
          `Verification Code: ${code}`,
          ``,
          `Once verified, you will not need a verification code on future sign-ins.`,
          `— The SilverLingo Team`,
        ].join("\n");

        let delivery = { sent: false, provider: "none" };
        if (channel === "phone") {
          delivery = await sendSmsEdge(env, address, smsText);
        } else {
          delivery = await sendEmailEdge(env, address, emailSubject, emailBody);
        }

        return Response.json(
          {
            ok: true,
            channel,
            address,
            providerSent: delivery.sent,
            provider: delivery.provider,
          },
          { headers: CORS_HEADERS }
        );
      } catch (err) {
        return Response.json(
          { error: err.message || "Failed to send verification code" },
          { status: 500, headers: CORS_HEADERS }
        );
      }
    }

    // 2. POST /api/meetings/notify
    if (
      request.method === "POST" &&
      url.pathname.endsWith("/api/meetings/notify")
    ) {
      try {
        const body = await request.json();
        const {
          eventType = "scheduled",
          host,
          learner,
          hostSmsBody,
          hostEmailSubject,
          hostEmailBody,
          learnerSmsBody,
          learnerEmailSubject,
          learnerEmailBody,
        } = body;

        const [hSms, hEmail, lSms, lEmail] = await Promise.all([
          host?.phone && hostSmsBody
            ? sendSmsEdge(env, host.phone, hostSmsBody)
            : Promise.resolve({ sent: false }),
          host?.email && hostEmailSubject && hostEmailBody
            ? sendEmailEdge(env, host.email, hostEmailSubject, hostEmailBody)
            : Promise.resolve({ sent: false }),
          learner?.phone && learnerSmsBody
            ? sendSmsEdge(env, learner.phone, learnerSmsBody)
            : Promise.resolve({ sent: false }),
          learner?.email && learnerEmailSubject && learnerEmailBody
            ? sendEmailEdge(
                env,
                learner.email,
                learnerEmailSubject,
                learnerEmailBody
              )
            : Promise.resolve({ sent: false }),
        ]);

        return Response.json(
          {
            ok: true,
            eventType,
            dispatched: {
              hostSmsSent: hSms.sent,
              hostEmailSent: hEmail.sent,
              learnerSmsSent: lSms.sent,
              learnerEmailSent: lEmail.sent,
            },
          },
          { headers: CORS_HEADERS }
        );
      } catch (err) {
        return Response.json(
          { error: err.message || "Failed to dispatch notifications" },
          { status: 500, headers: CORS_HEADERS }
        );
      }
    }

    // 3. Static Asset Fallback (./out)
    if (env?.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
