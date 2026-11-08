import {
  createClient as createBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { withBasePath } from "@/lib/assets";
import { formatUTCInZone, safeTimeZone } from "@/lib/timezone";

export type MeetingLifecycleEvent = "scheduled" | "changed" | "canceled";

export interface ParticipantContact {
  id: string;
  name: string;
  role: "elderly" | "teen";
  email: string;
  phone: string;
  timezone: string;
  country?: string;
  usState?: string;
}

export interface MeetingNotificationPayload {
  meetingId?: string;
  eventType?: MeetingLifecycleEvent;
  host: ParticipantContact;
  learner: ParticipantContact;
  scheduledStartUTC: string;
  googleMeetLink: string;
  aiIcebreaker: string;
  skipServerDispatch?: boolean;
}

export interface DispatchedNotificationRecord {
  id?: string;
  meetingId?: string;
  eventType: MeetingLifecycleEvent;
  recipientName: string;
  recipientRole: "elderly" | "teen";
  recipientTimezone: string;
  localDateLabel: string;
  localTimeLabel: string;
  tzAbbrev: string;
  channel: "sms" | "email";
  recipientAddress: string;
  subject?: string;
  messageBody: string;
  deliveryStatus: "sent" | "queued_db";
  createdAt: string;
}

/**
 * Builds the SMS and Email notification messages for a specific participant
 * in THAT participant's local time zone (including Date, Local Time, and TZ Abbreviation).
 */
export function buildParticipantMessages(
  recipient: ParticipantContact,
  partner: ParticipantContact,
  scheduledStartUTC: string,
  googleMeetLink: string,
  aiIcebreaker: string,
  eventType: MeetingLifecycleEvent = "scheduled"
) {
  const recipientTz = safeTimeZone(recipient.timezone);
  const partnerTz = safeTimeZone(partner.timezone);

  const localZoned = formatUTCInZone(scheduledStartUTC, recipientTz, "en");
  const partnerZoned = formatUTCInZone(scheduledStartUTC, partnerTz, "en");

  const statusHeader =
    eventType === "changed"
      ? "UPDATED / RESCHEDULED"
      : eventType === "canceled"
      ? "CANCELED"
      : "CONFIRMED & REMINDER";

  const smsBody =
    eventType === "canceled"
      ? `SilverLingo [${statusHeader}]: Your 30-min call with ${partner.name} on ${localZoned.dateLabel} at ${localZoned.timeLabel} ${localZoned.tzAbbrev} (${recipientTz}) has been CANCELED.`
      : `SilverLingo [${statusHeader}]: 30-min call with ${partner.name} on ${localZoned.dateLabel} at ${localZoned.timeLabel} ${localZoned.tzAbbrev} (${recipientTz}). Video link: ${googleMeetLink} | Icebreaker: "${aiIcebreaker}"`;

  const emailSubject =
    eventType === "changed"
      ? `[Rescheduled] SilverLingo Call: ${recipient.name} & ${partner.name} — ${localZoned.dateLabel} at ${localZoned.timeLabel} ${localZoned.tzAbbrev}`
    : eventType === "canceled"
      ? `[Canceled] SilverLingo Call: ${recipient.name} & ${partner.name} (${localZoned.dateLabel})`
      : `SilverLingo Call Confirmed: ${recipient.name} & ${partner.name} — ${localZoned.dateLabel} at ${localZoned.timeLabel} ${localZoned.tzAbbrev}`;

  const emailBody =
    eventType === "canceled"
      ? [
          `Hi ${recipient.name},`,
          ``,
          `Your 30-minute SilverLingo 1-on-1 conversation with ${partner.name} has been CANCELED.`,
          ``,
          `• Original Date: ${localZoned.dateLabel}`,
          `• Original Time (Your Time Zone): ${localZoned.timeLabel} ${localZoned.tzAbbrev} (${recipientTz})`,
          `• Partner's Time Zone (${partner.name}): ${partnerZoned.timeLabel} ${partnerZoned.tzAbbrev} (${partnerTz})`,
          ``,
          `You can book a new time anytime on SilverLingo.`,
          `— The SilverLingo Team`,
        ].join("\n")
      : [
          `Hi ${recipient.name},`,
          ``,
          eventType === "changed"
            ? `Your 30-minute SilverLingo 1-on-1 video conversation with ${partner.name} has been RESCHEDULED to a new time:`
            : `Your 30-minute SilverLingo 1-on-1 video conversation with ${partner.name} is CONFIRMED!`,
          ``,
          `• Meeting Date: ${localZoned.dateLabel}`,
          `• Your Local Time: ${localZoned.timeLabel} ${localZoned.tzAbbrev} (${recipientTz})`,
          `• ${partner.name}'s Local Time: ${partnerZoned.timeLabel} ${partnerZoned.tzAbbrev} (${partnerTz})`,
          `• Duration: 30 Minutes`,
          `• Direct Video Call Link: ${googleMeetLink}`,
          `• AI Icebreaker: "${aiIcebreaker}"`,
          ``,
          `Enjoy your conversation!`,
          `— The SilverLingo Team`,
        ].join("\n");

  return {
    smsBody,
    emailSubject,
    emailBody,
    localDateLabel: localZoned.dateLabel,
    localTimeLabel: localZoned.timeLabel,
    tzAbbrev: localZoned.tzAbbrev,
    recipientTz,
  };
}

/**
 * Fetches email, phone, and timezone from Supabase public.users for both accounts in the meeting,
 * falling back to provided profile contact details.
 */
export async function resolveParticipantsFromDB(params: {
  hostId: string;
  hostName: string;
  hostEmail?: string;
  hostPhone?: string;
  hostTimezone?: string;
  learnerId: string;
  learnerName: string;
  learnerEmail?: string;
  learnerPhone?: string;
  learnerTimezone?: string;
}): Promise<{ host: ParticipantContact; learner: ParticipantContact }> {
  let hostEmail = params.hostEmail || "arthur.host@silverlingo.org";
  let hostPhone = params.hostPhone || "+12125550191";
  let hostTimezone = safeTimeZone(params.hostTimezone || "America/New_York");
  let learnerEmail = params.learnerEmail || "learner@silverlingo.org";
  let learnerPhone = params.learnerPhone || "+13105550142";
  let learnerTimezone = safeTimeZone(params.learnerTimezone);
  let hostName = params.hostName;
  let learnerName = params.learnerName;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createBrowserSupabase();
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, email, phone, timezone")
        .in("id", [params.hostId, params.learnerId]);

      if (users && users.length > 0) {
        const dbHost = users.find((u: any) => u.id === params.hostId);
        const dbLearner = users.find((u: any) => u.id === params.learnerId);

        if (dbHost) {
          if (dbHost.full_name) hostName = dbHost.full_name;
          if (dbHost.email) hostEmail = dbHost.email;
          if (dbHost.phone) hostPhone = dbHost.phone;
          if (dbHost.timezone) hostTimezone = safeTimeZone(dbHost.timezone);
        }
        if (dbLearner) {
          if (dbLearner.full_name) learnerName = dbLearner.full_name;
          if (dbLearner.email) learnerEmail = dbLearner.email;
          if (dbLearner.phone) learnerPhone = dbLearner.phone;
          if (dbLearner.timezone)
            learnerTimezone = safeTimeZone(dbLearner.timezone);
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
      timezone: hostTimezone,
    },
    learner: {
      id: params.learnerId,
      name: learnerName,
      role: "teen",
      email: learnerEmail,
      phone: learnerPhone,
      timezone: learnerTimezone,
    },
  };
}

/**
 * Logs all 4 notifications (SMS + Email for both Host and Learner, each in their own timezone)
 * into Supabase public.meeting_notifications AND dispatches via backend.
 */
export async function logNotificationsToSupabase(
  payload: MeetingNotificationPayload
): Promise<DispatchedNotificationRecord[]> {
  const eventType: MeetingLifecycleEvent = payload.eventType || "scheduled";

  const hostMsgs = buildParticipantMessages(
    payload.host,
    payload.learner,
    payload.scheduledStartUTC,
    payload.googleMeetLink,
    payload.aiIcebreaker,
    eventType
  );

  const learnerMsgs = buildParticipantMessages(
    payload.learner,
    payload.host,
    payload.scheduledStartUTC,
    payload.googleMeetLink,
    payload.aiIcebreaker,
    eventType
  );

  const nowIso = new Date().toISOString();

  const records: DispatchedNotificationRecord[] = [
    {
      meetingId: payload.meetingId,
      eventType,
      recipientName: payload.host.name,
      recipientRole: "elderly",
      recipientTimezone: hostMsgs.recipientTz,
      localDateLabel: hostMsgs.localDateLabel,
      localTimeLabel: hostMsgs.localTimeLabel,
      tzAbbrev: hostMsgs.tzAbbrev,
      channel: "sms",
      recipientAddress: payload.host.phone,
      messageBody: hostMsgs.smsBody,
      deliveryStatus: "sent",
      createdAt: nowIso,
    },
    {
      meetingId: payload.meetingId,
      eventType,
      recipientName: payload.host.name,
      recipientRole: "elderly",
      recipientTimezone: hostMsgs.recipientTz,
      localDateLabel: hostMsgs.localDateLabel,
      localTimeLabel: hostMsgs.localTimeLabel,
      tzAbbrev: hostMsgs.tzAbbrev,
      channel: "email",
      recipientAddress: payload.host.email,
      subject: hostMsgs.emailSubject,
      messageBody: hostMsgs.emailBody,
      deliveryStatus: "sent",
      createdAt: nowIso,
    },
    {
      meetingId: payload.meetingId,
      eventType,
      recipientName: payload.learner.name,
      recipientRole: "teen",
      recipientTimezone: learnerMsgs.recipientTz,
      localDateLabel: learnerMsgs.localDateLabel,
      localTimeLabel: learnerMsgs.localTimeLabel,
      tzAbbrev: learnerMsgs.tzAbbrev,
      channel: "sms",
      recipientAddress: payload.learner.phone,
      messageBody: learnerMsgs.smsBody,
      deliveryStatus: "sent",
      createdAt: nowIso,
    },
    {
      meetingId: payload.meetingId,
      eventType,
      recipientName: payload.learner.name,
      recipientRole: "teen",
      recipientTimezone: learnerMsgs.recipientTz,
      localDateLabel: learnerMsgs.localDateLabel,
      localTimeLabel: learnerMsgs.localTimeLabel,
      tzAbbrev: learnerMsgs.tzAbbrev,
      channel: "email",
      recipientAddress: payload.learner.email,
      subject: learnerMsgs.emailSubject,
      messageBody: learnerMsgs.emailBody,
      deliveryStatus: "sent",
      createdAt: nowIso,
    },
  ];

  if (typeof window !== "undefined") {
    try {
      const existingRaw = window.localStorage.getItem(
        "silverlingo_notification_log"
      );
      const existing: DispatchedNotificationRecord[] = existingRaw
        ? JSON.parse(existingRaw)
        : [];
      const updated = [...records, ...existing].slice(0, 40);
      window.localStorage.setItem(
        "silverlingo_notification_log",
        JSON.stringify(updated)
      );
    } catch {
      // Ignore storage quota errors
    }
  }

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

  // Also trigger server-side SMS (Twilio) & Email (Resend) dispatch when not already sent by /api/meetings/book
  if (typeof window !== "undefined" && !payload.skipServerDispatch) {
    try {
      await fetch(withBasePath("/api/meetings/notify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: payload.meetingId,
          eventType,
          host: payload.host,
          learner: payload.learner,
          scheduledStartUTC: payload.scheduledStartUTC,
          googleMeetLink: payload.googleMeetLink,
          aiIcebreaker: payload.aiIcebreaker,
        }),
      });
    } catch {
      // Static export environment falls back to Supabase + client notification log
    }
  }

  return records;
}
