import { NextResponse } from "next/server";
import {
  buildParticipantMessages,
  type MeetingLifecycleEvent,
  type ParticipantContact,
} from "@/lib/notifications";

interface NotifyMeetingRequestBody {
  meetingId?: string;
  eventType: MeetingLifecycleEvent;
  host: ParticipantContact;
  learner: ParticipantContact;
  scheduledStartUTC: string;
  googleMeetLink: string;
  aiIcebreaker: string;
}

async function sendServerSmsIfConfigured(to: string, body: string) {
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

async function sendServerEmailIfConfigured(
  to: string,
  subject: string,
  textBody: string
) {
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
    const body: NotifyMeetingRequestBody = await request.json();
    const {
      eventType = "scheduled",
      host,
      learner,
      scheduledStartUTC,
      googleMeetLink,
      aiIcebreaker,
    } = body;

    if (!host || !learner || !scheduledStartUTC) {
      return NextResponse.json(
        { error: "host, learner, and scheduledStartUTC are required." },
        { status: 400 }
      );
    }

    const hostMsgs = buildParticipantMessages(
      host,
      learner,
      scheduledStartUTC,
      googleMeetLink,
      aiIcebreaker,
      eventType
    );

    const learnerMsgs = buildParticipantMessages(
      learner,
      host,
      scheduledStartUTC,
      googleMeetLink,
      aiIcebreaker,
      eventType
    );

    const [hostSmsSent, hostEmailSent, learnerSmsSent, learnerEmailSent] =
      await Promise.all([
        sendServerSmsIfConfigured(host.phone, hostMsgs.smsBody),
        sendServerEmailIfConfigured(
          host.email,
          hostMsgs.emailSubject,
          hostMsgs.emailBody
        ),
        sendServerSmsIfConfigured(learner.phone, learnerMsgs.smsBody),
        sendServerEmailIfConfigured(
          learner.email,
          learnerMsgs.emailSubject,
          learnerMsgs.emailBody
        ),
      ]);

    return NextResponse.json({
      ok: true,
      eventType,
      dispatched: {
        hostSmsSent,
        hostEmailSent,
        learnerSmsSent,
        learnerEmailSent,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to dispatch notifications" },
      { status: 500 }
    );
  }
}
