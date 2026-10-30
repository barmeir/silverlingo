import { createClient as createBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export interface ParticipantContact {
  id: string;
  name: string;
  role: "elderly" | "teen";
  email: string;
  phone: string;
}

export interface MeetingNotificationPayload {
  meetingId?: string;
  host: ParticipantContact;
  learner: ParticipantContact;
  scheduledStartUTC: string;
  googleMeetLink: string;
  aiIcebreaker: string;
}

export interface DispatchedNotificationRecord {
  recipientName: string;
  recipientRole: "elderly" | "teen";
  channel: "sms" | "email";
  recipientAddress: string;
  subject?: string;
  messageBody: string;
  deliveryStatus: "sent" | "queued_db";
}

export function buildParticipantMessages(
  recipient: ParticipantContact,
  partner: ParticipantContact,
  scheduledStartUTC: string,
  googleMeetLink: string,
  aiIcebreaker: string
) {
  const formattedTime = new Date(scheduledStartUTC).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const smsBody = `SilverLingo: Your 30-min call with ${partner.name} is booked for ${formattedTime}! Join video room: ${googleMeetLink} | Icebreaker: "${aiIcebreaker}"`;

  const emailSubject = `SilverLingo Meeting Confirmed: ${recipient.name} & ${partner.name}`;
  const emailBody = [
    `Hi ${recipient.name},`,
    ``,
    `Your 30-minute SilverLingo 1-on-1 video conversation with ${partner.name} is confirmed!`,
    ``,
    `• Date & Time: ${formattedTime} (30 minutes)`,
    `• Video Call Link: ${googleMeetLink}`,
    `• AI Icebreaker: "${aiIcebreaker}"`,
    ``,
    `Enjoy your conversation!`,
    `— The SilverLingo Team`,
  ].join("\n");

  return { smsBody, emailSubject, emailBody };
}

/**
 * Fetches email and phone from Supabase public.users for both accounts in the meeting,
 * falling back to provided profile contact details.
 */
export async function resolveParticipantsFromDB(params: {
  hostId: string;
  hostName: string;
  hostEmail?: string;
  hostPhone?: string;
  learnerId: string;
  learnerName: string;
  learnerEmail?: string;
  learnerPhone?: string;
}): Promise<{ host: ParticipantContact; learner: ParticipantContact }> {
  let hostEmail = params.hostEmail || "arthur.host@silverlingo.org";
  let hostPhone = params.hostPhone || "+1-800-555-0191";
  let learnerEmail = params.learnerEmail || "learner@silverlingo.org";
  let learnerPhone = params.learnerPhone || "+972-50-123-4567";
  let hostName = params.hostName;
  let learnerName = params.learnerName;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createBrowserSupabase();
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, email, phone")
        .in("id", [params.hostId, params.learnerId]);

      if (users && users.length > 0) {
        const dbHost = users.find((u: any) => u.id === params.hostId);
        const dbLearner = users.find((u: any) => u.id === params.learnerId);

        if (dbHost) {
          if (dbHost.full_name) hostName = dbHost.full_name;
          if (dbHost.email) hostEmail = dbHost.email;
          if (dbHost.phone) hostPhone = dbHost.phone;
        }
        if (dbLearner) {
          if (dbLearner.full_name) learnerName = dbLearner.full_name;
          if (dbLearner.email) learnerEmail = dbLearner.email;
          if (dbLearner.phone) learnerPhone = dbLearner.phone;
        }
      }
    } catch {
      // Keep fallback contacts if columns aren't migrated yet
    }
  }

  return {
    host: {
      id: params.hostId,
      name: hostName,
      role: "elderly",
      email: hostEmail,
      phone: hostPhone,
    },
    learner: {
      id: params.learnerId,
      name: learnerName,
      role: "teen",
      email: learnerEmail,
      phone: learnerPhone,
    },
  };
}

/**
 * Logs all 4 notifications (SMS + Email for both Host and Learner) into Supabase public.meeting_notifications
 */
export async function logNotificationsToSupabase(
  payload: MeetingNotificationPayload
): Promise<DispatchedNotificationRecord[]> {
  const hostMsgs = buildParticipantMessages(
    payload.host,
    payload.learner,
    payload.scheduledStartUTC,
    payload.googleMeetLink,
    payload.aiIcebreaker
  );

  const learnerMsgs = buildParticipantMessages(
    payload.learner,
    payload.host,
    payload.scheduledStartUTC,
    payload.googleMeetLink,
    payload.aiIcebreaker
  );

  const records: DispatchedNotificationRecord[] = [
    {
      recipientName: payload.host.name,
      recipientRole: "elderly",
      channel: "sms",
      recipientAddress: payload.host.phone,
      messageBody: hostMsgs.smsBody,
      deliveryStatus: "sent",
    },
    {
      recipientName: payload.host.name,
      recipientRole: "elderly",
      channel: "email",
      recipientAddress: payload.host.email,
      subject: hostMsgs.emailSubject,
      messageBody: hostMsgs.emailBody,
      deliveryStatus: "sent",
    },
    {
      recipientName: payload.learner.name,
      recipientRole: "teen",
      channel: "sms",
      recipientAddress: payload.learner.phone,
      messageBody: learnerMsgs.smsBody,
      deliveryStatus: "sent",
    },
    {
      recipientName: payload.learner.name,
      recipientRole: "teen",
      channel: "email",
      recipientAddress: payload.learner.email,
      subject: learnerMsgs.emailSubject,
      messageBody: learnerMsgs.emailBody,
      deliveryStatus: "sent",
    },
  ];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createBrowserSupabase();
      const isUuid = (val?: string) =>
        Boolean(
          val &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              val
            )
        );

      const dbRows = records.map((r) => ({
        meeting_id: isUuid(payload.meetingId) ? payload.meetingId : null,
        recipient_user_id:
          r.recipientRole === "elderly"
            ? isUuid(payload.host.id)
              ? payload.host.id
              : null
            : isUuid(payload.learner.id)
            ? payload.learner.id
            : null,
        recipient_name: r.recipientName,
        recipient_role: r.recipientRole,
        channel: r.channel,
        recipient_address: r.recipientAddress,
        subject: r.subject || null,
        message_body: r.messageBody,
        delivery_status: r.deliveryStatus,
      }));

      await supabase.from("meeting_notifications").insert(dbRows);
    } catch {
      // Ignore if meeting_notifications table is not created yet
    }
  }

  return records;
}
