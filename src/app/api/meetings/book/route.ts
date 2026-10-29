import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { generateCentralGoogleMeetLink } from "@/lib/google-calendar";
import { generateMeetingIcebreaker } from "@/lib/openai";

interface BookMeetingRequestBody {
  hostId: string;
  hostName?: string;
  hostHobbies?: string[];
  learnerId?: string;
  learnerName?: string;
  learnerHobbies?: string[];
  scheduledStartUTC: string; // ISO 8601 in UTC
}

export async function POST(request: Request) {
  try {
    const body: BookMeetingRequestBody = await request.json();
    const {
      hostId,
      scheduledStartUTC,
      hostName: fallbackHostName = "Arthur",
      hostHobbies: fallbackHostHobbies = [
        "Football / Soccer",
        "Classic Movies & Marvel",
      ],
      learnerName: fallbackLearnerName = "Mateo",
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
    let learnerName = fallbackLearnerName;
    let hostHobbies = fallbackHostHobbies;
    let learnerHobbies = fallbackLearnerHobbies;

    const supabaseReady = isSupabaseConfigured();

    // Enrich names & hobbies from Supabase only when real credentials are configured
    if (supabaseReady) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) learnerId = user.id;

        const { data: usersData } = await supabase
          .from("users")
          .select("id, full_name")
          .in("id", [hostId, learnerId]);

        if (usersData && usersData.length > 0) {
          const foundHost = usersData.find((u) => u.id === hostId);
          const foundLearner = usersData.find((u) => u.id === learnerId);
          if (foundHost?.full_name) hostName = foundHost.full_name;
          if (foundLearner?.full_name) learnerName = foundLearner.full_name;
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

    // 1. Generate Google Meet link via Central Google Cloud Service Account
    //    & Generate 1-sentence AI Icebreaker via OpenAI GPT-4o-mini in parallel
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

    return NextResponse.json({
      meeting: meetingRecord,
      hostName,
      learnerName,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to book meeting." },
      { status: 500 }
    );
  }
}
