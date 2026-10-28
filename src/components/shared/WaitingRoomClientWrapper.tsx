"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import WaitingRoom from "@/components/shared/WaitingRoom";

export default function WaitingRoomClientWrapper({
  meetingId,
}: {
  meetingId: string;
}) {
  const searchParams = useSearchParams();

  const hostName = searchParams.get("host") || "Arthur Pendelton";
  const hostAvatar = searchParams.get("hostAvatar") || "/avatars/arthur.png";
  const learnerName = searchParams.get("learner") || "Mateo";
  const scheduledStartUTC =
    searchParams.get("start") ||
    new Date(Date.now() + 4 * 60 * 1000).toISOString();
  const googleMeetLink =
    searchParams.get("meet") || "https://meet.google.com/slv-demo-room";
  const aiIcebreaker =
    searchParams.get("icebreaker") ||
    "Mateo, ask Arthur about his favorite Marvel movie!";

  return (
    <WaitingRoom
      key={meetingId}
      hostName={hostName}
      hostAvatar={hostAvatar}
      learnerName={learnerName}
      scheduledStartUTC={scheduledStartUTC}
      googleMeetLink={googleMeetLink}
      aiIcebreaker={aiIcebreaker}
    />
  );
}
