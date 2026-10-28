import { google } from "googleapis";
import crypto from "crypto";

interface CreateMeetSessionParams {
  hostName: string;
  learnerName: string;
  scheduledStartUTC: string; // ISO 8601 UTC string
  scheduledEndUTC: string;   // ISO 8601 UTC string
}

/**
 * Uses a centralized Google Cloud Service Account to create a calendar event
 * on SilverLingo's central calendar and extract the generated Google Meet link.
 * Neither the Elderly Host nor the Teen Learner ever needs to connect a Google account.
 */
export async function generateCentralGoogleMeetLink({
  hostName,
  learnerName,
  scheduledStartUTC,
  scheduledEndUTC,
}: CreateMeetSessionParams): Promise<string> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );
  const calendarId = process.env.GOOGLE_CENTRAL_CALENDAR_ID || "primary";

  // Graceful fallback for local development when credentials are not yet set
  if (!clientEmail || !privateKey || privateKey.includes("...")) {
    const mockCode = crypto.randomBytes(4).toString("hex");
    return `https://meet.google.com/slv-${mockCode.slice(0, 4)}-${mockCode.slice(4, 8)}`;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary: `SilverLingo 1-on-1: ${hostName} & ${learnerName}`,
      description:
        "30-minute intergenerational language exchange session hosted on SilverLingo.",
      start: {
        dateTime: scheduledStartUTC,
        timeZone: "UTC",
      },
      end: {
        dateTime: scheduledEndUTC,
        timeZone: "UTC",
      },
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    },
  });

  const meetLink =
    response.data.hangoutLink ||
    response.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri;

  if (!meetLink) {
    throw new Error("Google Calendar API did not return a Google Meet link.");
  }

  return meetLink;
}
