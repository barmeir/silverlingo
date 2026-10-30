"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import WaitingRoom from "@/components/shared/WaitingRoom";
import { useUserProfile } from "@/context/UserProfileContext";

export default function WaitingRoomClientWrapper({
  meetingId,
}: {
  meetingId: string;
}) {
  const searchParams = useSearchParams();
  const { profile, customHosts } = useUserProfile();

  const hostName = searchParams.get("host") || "Arthur Pendelton";
  const matchedCustomHost = customHosts.find((h) => h.fullName === hostName);

  const hostAvatar =
    matchedCustomHost?.avatarUrl ||
    searchParams.get("hostAvatar") ||
    "/avatars/arthur.png";

  const learnerName =
    searchParams.get("learner") ||
    (profile?.role === "teen" ? profile.fullName : "Mateo");

  const learnerAvatar =
    profile?.role === "teen" && profile.avatarUrl
      ? profile.avatarUrl
      : "/avatars/mateo.png";

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
      learnerAvatar={learnerAvatar}
      scheduledStartUTC={scheduledStartUTC}
      googleMeetLink={googleMeetLink}
      aiIcebreaker={aiIcebreaker}
    />
  );
}
