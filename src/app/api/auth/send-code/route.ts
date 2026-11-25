import { NextResponse } from "next/server";

interface SendVerificationCodeBody {
  channel: "email" | "phone";
  address: string;
  code: string;
  recipientName?: string;
}

async function sendTwilioSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from || !to) return false;

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
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
    return res.ok;
  } catch {
    return false;
  }
}

async function sendResendEmail(to: string, subject: string, textBody: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "SilverLingo <onboarding@resend.dev>";
  if (!resendKey || !to) return false;

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
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body: SendVerificationCodeBody = await request.json();
    const { channel, address, code, recipientName = "SilverLingo User" } = body;

    if (!channel || !address || !code) {
      return NextResponse.json(
        { error: "channel, address, and code are required." },
        { status: 400 }
      );
    }

    const smsText = `SilverLingo First-Time Sign-In Verification Code: ${code}. Enter this 6-digit code to verify your account.`;
    const emailSubject = `SilverLingo Verification Code: ${code} (First-Time Sign-In)`;
    const emailBody = [
      `Hi ${recipientName},`,
      ``,
      `Welcome to SilverLingo! Since this is your first time signing in, please verify your account with this 6-digit verification code:`,
      ``,
      `Verification Code: ${code}`,
      ``,
      `Once verified, you will not need a verification code on future sign-ins.`,
      `— The SilverLingo Team`,
    ].join("\n");

    let providerSent = false;
    if (channel === "phone") {
      providerSent = await sendTwilioSms(address, smsText);
    } else {
      providerSent = await sendResendEmail(address, emailSubject, emailBody);
    }

    return NextResponse.json({
      ok: true,
      channel,
      address,
      providerSent,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to send verification code" },
      { status: 500 }
    );
  }
}
