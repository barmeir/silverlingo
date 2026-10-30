import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { generateCentralGoogleMeetLink } from "@/lib/google-calendar";
import { generateMeetingIcebreaker } from "@/lib/openai";
import {
  buildParticipantMessages,
  type ParticipantContact,
} from "@/lib/notifications";

interface BookMeetingRequestBody {
  hostId: string;
  hostName?: string;
  hostEmail?: string;
  hostPhone?: string;
  hostHobbies?: string[];
  learnerId?: string;
  learnerName?: string;
  learnerEmail?: string;
  learnerPhone?: string;
  learnerHobbies?: string[];
  scheduledStartUTC: string; // ISO 8601 in UTC
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
    const body: BookMeetingRequestBody = await request.json();
    const {
      hostId,
      scheduledStartUTC,
      hostName: fallbackHostName = "Arthur",
      hostEmail: fallbackHostEmail = "arthur.host@silverlingo.org",
      hostPhone: fallbackHostPhone = "+1-800-555-0191",
      hostHobbies: fallbackHostHobbies = [
        "Football / Soccer",
        "Classic Movies & Marvel",
      ],
      learnerName: fallbackLearnerName = "Mateo",
      learnerEmail: fallbackLearnerEmail = "learner@silverlingo.org",
      learnerPhone: fallbackLearnerPhone = "+972-50-123-4567",
      learnerHobbies: fallbackLearnerHobbies = [
        "Football / Soccer",
        "Music & Vinyl",
      ],
    } = body;

    if (!hostId || !scheduledStartUTC) {
      return NextResponse.json(
        { error: "hostId and scheduledStartUTC are required." },
        { status: 400 }
      );
    }

    const startDate = new Date(scheduledStartUTC);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduledStartUTC ISO timestamp." },
        { status: 400 }
      );
    }

    // Strict 30-minute meeting duration stored in UTC
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
    const scheduledEndUTC = endDate.toISOString();

    let learnerId =
      body.learnerId || "00000000-0000-0000-0000-000000000002";
    let hostName = fallbackHostName;
    let hostEmail = fallbackHostEmail;
    let hostPhone = fallbackHostPhone;
    let learnerName = fallbackLearnerName;
    let learnerEmail = fallbackLearnerEmail;
    let learnerPhone = fallbackLearnerPhone;
    let hostHobbies = fallbackHostHobbies;
    let learnerHobbies = fallbackLearnerHobbies;

    const supabaseReady = isSupabaseConfigured();

    // Enrich names, emails, phones & hobbies from Supabase public.users
    if (supabaseReady) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) learnerId = user.id;
        if (user?.email) learnerEmail = user.email;
        if (user?.phone) learnerPhone = user.phone;

        const { data: usersData } = await supabase
          .from("users")
          .select("id, full_name, email, phone")
          .in("id", [hostId, learnerId]);

        if (usersData && usersData.length > 0) {
          const foundHost = usersData.find((u: any) => u.id === hostId);
          const foundLearner = usersData.find((u: any) => u.id === learnerId);
          if (foundHost?.full_name) hostName = foundHost.full_name;
          if (foundHost?.email) hostEmail = foundHost.email;
          if (foundHost?.phone) hostPhone = foundHost.phone;
          if (foundLearner?.full_name) learnerName = foundLearner.full_name;
          if (foundLearner?.email) learnerEmail = foundLearner.email;
          if (foundLearner?.phone) learnerPhone = foundLearner.phone;
        }

        const { data: hobbiesData } = await supabase
          .from("user_hobbies")
          .select("user_id, hobbies(name)")
          .in("user_id", [hostId, learnerId]);

        if (hobbiesData && hobbiesData.length > 0) {
          const hList: string[] = [];
          const lList: string[] = [];
          hobbiesData.forEach((row: any) => {
            const hobbyName = row.hobbies?.name;
            if (!hobbyName) return;
            if (row.user_id === hostId) hList.push(hobbyName);
            if (row.user_id === learnerId) lList.push(hobbyName);
          });
          if (hList.length > 0) hostHobbies = hList;
          if (lList.length > 0) learnerHobbies = lList;
        }
      } catch {
        // Fallback to provided values
      }
    }

    // 1. Generate Google Meet link & AI Icebreaker in parallel
    const [googleMeetLink, aiIcebreaker] = await Promise.all([
      generateCentralGoogleMeetLink({
        hostName,
        learnerName,
        scheduledStartUTC: startDate.toISOString(),
        scheduledEndUTC,
      }),
      generateMeetingIcebreaker({
        hostName,
        learnerName,
        hostHobbies,
        learnerHobbies,
      }),
    ]);

    // 2. Save the meeting in UTC to Supabase
    let meetingRecord = {
      id: `demo-${Date.now()}`,
      host_id: hostId,
      learner_id: learnerId,
      scheduled_start: startDate.toISOString(),
      scheduled_end: scheduledEndUTC,
      google_meet_link: googleMeetLink,
      ai_icebreaker: aiIcebreaker,
      status: "scheduled",
    };

    if (supabaseReady) {
      try {
        const supabase = createClient();
        const { data: insertedMeeting, error: dbError } = await supabase
          .from("meetings")
          .insert({
            host_id: hostId,
            learner_id: learnerId,
            scheduled_start: startDate.toISOString(),
            scheduled_end: scheduledEndUTC,
            google_meet_link: googleMeetLink,
            ai_icebreaker: aiIcebreaker,
            status: "scheduled",
          })
          .select()
          .single();

        if (!dbError && insertedMeeting) {
          meetingRecord = insertedMeeting;
        }
      } catch {
        // Keep in-memory demo meeting record
      }
    }

    // 3. Send SMS & Email notifications to BOTH accounts (Host & Learner)
    const hostParticipant: ParticipantContact = {
      id: hostId,
      name: hostName,
      role: "elderly",
      email: hostEmail,
      phone: hostPhone,
    };
    const learnerParticipant: ParticipantContact = {
      id: learnerId,
      name: learnerName,
      role: "teen",
      email: learnerEmail,
      phone: learnerPhone,
    };

    const hostMsgs = buildParticipantMessages(
      hostParticipant,
      learnerParticipant,
      startDate.toISOString(),
      googleMeetLink,
      aiIcebreaker
    );
    const learnerMsgs = buildParticipantMessages(
      learnerParticipant,
      hostParticipant,
      startDate.toISOString(),
      googleMeetLink,
      aiIcebreaker
    );

    await Promise.all([
      sendServerSmsIfConfigured(hostPhone, hostMsgs.smsBody),
      sendServerEmailIfConfigured(
        hostEmail,
        hostMsgs.emailSubject,
        hostMsgs.emailBody
      ),
      sendServerSmsIfConfigured(learnerPhone, learnerMsgs.smsBody),
      sendServerEmailIfConfigured(
        learnerEmail,
        learnerMsgs.emailSubject,
        learnerMsgs.emailBody
      ),
    ]);

    return NextResponse.json({
      meeting: meetingRecord,
      hostName,
      hostEmail,
      hostPhone,
      learnerName,
      learnerEmail,
      learnerPhone,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to book meeting." },
      { status: 500 }
    );
  }
}
