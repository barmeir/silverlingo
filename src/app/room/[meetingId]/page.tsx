import React from "react";
import WaitingRoom from "@/components/shared/WaitingRoom";
import { createClient } from "@/lib/supabase/server";

interface RoomPageProps {
  params: { meetingId: string };
  searchParams: {
    host?: string;
    hostAvatar?: string;
    learner?: string;
    start?: string;
    meet?: string;
    icebreaker?: string;
  };
}

export default async function MeetingWaitingRoomPage({
  params,
  searchParams,
}: RoomPageProps) {
  let hostName = searchParams.host || "Arthur Pendelton";
  let hostAvatar = searchParams.hostAvatar || "/avatars/arthur.png";
  let learnerName = searchParams.learner || "Mateo";
  let scheduledStartUTC =
    searchParams.start || new Date(Date.now() + 4 * 60 * 1000).toISOString();
  let googleMeetLink =
    searchParams.meet || "https://meet.google.com/slv-demo-room";
  let aiIcebreaker =
    searchParams.icebreaker ||
    "Mateo, ask Arthur about his favorite Marvel movie!";

  // Attempt to load from Supabase if a persisted UUID meetingId is accessed directly
  if (!params.meetingId.startsWith("demo-")) {
    try {
      const supabase = createClient();
      const { data: meeting } = await supabase
        .from("meetings")
        .select(
          "scheduled_start, google_meet_link, ai_icebreaker, host:users!meetings_host_id_fkey(full_name), learner:users!meetings_learner_id_fkey(full_name)"
        )
        .eq("id", params.meetingId)
        .single();

      if (meeting) {
        scheduledStartUTC = meeting.scheduled_start;
        googleMeetLink = meeting.google_meet_link;
        aiIcebreaker = meeting.ai_icebreaker;
        if ((meeting as any).host?.full_name) {
          hostName = (meeting as any).host.full_name;
        }
        if ((meeting as any).learner?.full_name) {
          learnerName = (meeting as any).learner.full_name;
        }
      }
    } catch {
      // Fallback to searchParams / demo defaults when running without Supabase env
    }
  }

  return (
    <WaitingRoom
      hostName={hostName}
      hostAvatar={hostAvatar}
      learnerName={learnerName}
      scheduledStartUTC={scheduledStartUTC}
      googleMeetLink={googleMeetLink}
      aiIcebreaker={aiIcebreaker}
    />
  );
}
