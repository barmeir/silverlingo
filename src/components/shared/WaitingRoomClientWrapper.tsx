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

  const activeMeetingId = searchParams.get("meetingId") || meetingId;
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
      : "+12125550191");

  const hostTimezone =
    searchParams.get("hostTz") ||
    matchedCustomHost?.timezone ||
    "America/New_York";

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
      : "+13105550142");

  const learnerTimezone =
    searchParams.get("learnerTz") ||
    profile?.timezone ||
    "America/Los_Angeles";

  const learnerAvatar =
    profile?.role === "teen" && profile.avatarUrl
      ? profile.avatarUrl
      : "/avatars/mateo.png";

  const scheduledStartUTC =
    searchParams.get("start") ||
    new Date(Date.now() + 4 * 60 * 1000).toISOString();
  const googleMeetLink =
    searchParams.get("meet") || "https://meet.jit.si/SilverLingo-LiveRoom";
  const aiIcebreaker =
    searchParams.get("icebreaker") ||
    "Mateo, ask Arthur about his favorite Marvel movie!";

  return (
    <WaitingRoom
      key={activeMeetingId}
      meetingId={activeMeetingId}
      hostName={hostName}
      hostEmail={hostEmail}
      hostPhone={hostPhone}
      hostTimezone={hostTimezone}
      hostAvatar={hostAvatar}
      learnerName={learnerName}
      learnerEmail={learnerEmail}
      learnerPhone={learnerPhone}
      learnerTimezone={learnerTimezone}
      learnerAvatar={learnerAvatar}
      scheduledStartUTC={scheduledStartUTC}
      googleMeetLink={googleMeetLink}
      aiIcebreaker={aiIcebreaker}
    />
  );
}
