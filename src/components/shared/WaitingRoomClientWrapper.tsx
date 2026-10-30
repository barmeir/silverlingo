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

  const hostEmail =
    searchParams.get("hostEmail") ||
    matchedCustomHost?.email ||
    (matchedCustomHost?.contact?.includes("@")
      ? matchedCustomHost.contact
      : `${hostName.toLowerCase().replace(/\s+/g, ".")}@silverlingo.org`);

  const hostPhone =
    searchParams.get("hostPhone") ||
    matchedCustomHost?.phone ||
    (matchedCustomHost?.contact && !matchedCustomHost.contact.includes("@")
      ? matchedCustomHost.contact
      : "+1-800-555-0191");

  const hostAvatar =
    matchedCustomHost?.avatarUrl ||
    searchParams.get("hostAvatar") ||
    "/avatars/arthur.png";

  const learnerName =
    searchParams.get("learner") ||
    (profile?.role === "teen" ? profile.fullName : "Mateo");

  const learnerEmail =
    searchParams.get("learnerEmail") ||
    profile?.email ||
    (profile?.contact?.includes("@")
      ? profile.contact
      : "learner@silverlingo.org");

  const learnerPhone =
    searchParams.get("learnerPhone") ||
    profile?.phone ||
    (profile?.contact && !profile.contact.includes("@")
      ? profile.contact
      : "+972-50-123-4567");

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
      hostEmail={hostEmail}
      hostPhone={hostPhone}
      hostAvatar={hostAvatar}
      learnerName={learnerName}
      learnerEmail={learnerEmail}
      learnerPhone={learnerPhone}
      learnerAvatar={learnerAvatar}
      scheduledStartUTC={scheduledStartUTC}
      googleMeetLink={googleMeetLink}
      aiIcebreaker={aiIcebreaker}
    />
  );
}
