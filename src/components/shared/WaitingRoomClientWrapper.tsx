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
  const { profile, customHosts, meetings } = useUserProfile();

  const queryMeetingId = searchParams.get("meetingId");
  const matchedMeeting =
    (queryMeetingId && meetings.find((m) => m.id === queryMeetingId)) ||
    (meetingId !== "demo-session"
      ? meetings.find((m) => m.id === meetingId)
      : meetings.find((m) => m.status === "scheduled") || meetings[0]);

  const activeMeetingId =
    queryMeetingId || matchedMeeting?.id || meetingId;

  const hostName =
    searchParams.get("host") ||
    matchedMeeting?.hostName ||
    "Arthur Pendelton";
  const matchedCustomHost = customHosts.find((h) => h.fullName === hostName);

  const hostEmail =
    searchParams.get("hostEmail") ||
    matchedMeeting?.hostEmail ||
    matchedCustomHost?.email ||
    (matchedCustomHost?.contact?.includes("@")
      ? matchedCustomHost.contact
      : `${hostName.toLowerCase().replace(/\s+/g, ".")}@silverlingo.org`);

  const hostPhone =
    searchParams.get("hostPhone") ||
    matchedMeeting?.hostPhone ||
    matchedCustomHost?.phone ||
    (matchedCustomHost?.contact && !matchedCustomHost.contact.includes("@")
      ? matchedCustomHost.contact
      : "+12125550191");

  const hostTimezone =
    searchParams.get("hostTz") ||
    matchedMeeting?.hostTimezone ||
    matchedCustomHost?.timezone ||
    "America/New_York";

  const hostAvatar =
    matchedCustomHost?.avatarUrl ||
    matchedMeeting?.hostAvatar ||
    searchParams.get("hostAvatar") ||
    "/avatars/arthur.png";

  const learnerName =
    searchParams.get("learner") ||
    matchedMeeting?.learnerName ||
    (profile?.role === "teen" ? profile.fullName : "Mateo");

  const learnerEmail =
    searchParams.get("learnerEmail") ||
    matchedMeeting?.learnerEmail ||
    profile?.email ||
    (profile?.contact?.includes("@")
      ? profile.contact
      : "learner@silverlingo.org");

  const learnerPhone =
    searchParams.get("learnerPhone") ||
    matchedMeeting?.learnerPhone ||
    profile?.phone ||
    (profile?.contact && !profile.contact.includes("@")
      ? profile.contact
      : "+13105550142");

  const learnerTimezone =
    searchParams.get("learnerTz") ||
    matchedMeeting?.learnerTimezone ||
    profile?.timezone ||
    "America/Los_Angeles";

  const learnerAvatar =
    matchedMeeting?.learnerAvatar ||
    (profile?.role === "teen" && profile.avatarUrl
      ? profile.avatarUrl
      : "/avatars/mateo.png");

  const scheduledStartUTC =
    matchedMeeting?.scheduledStartUTC ||
    searchParams.get("start") ||
    new Date(Date.now() + 4 * 60 * 1000).toISOString();
  const googleMeetLink =
    searchParams.get("meet") ||
    matchedMeeting?.googleMeetLink ||
    "https://meet.jit.si/SilverLingo-LiveRoom";
  const aiIcebreaker =
    searchParams.get("icebreaker") ||
    matchedMeeting?.aiIcebreaker ||
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
