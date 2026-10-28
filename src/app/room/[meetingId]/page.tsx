import React, { Suspense } from "react";
import WaitingRoomClientWrapper from "@/components/shared/WaitingRoomClientWrapper";

export function generateStaticParams() {
  return [{ meetingId: "demo-session" }];
}

export default function MeetingWaitingRoomPage({
  params,
}: {
  params: { meetingId: string };
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#4A148C]" />}>
      <WaitingRoomClientWrapper meetingId={params.meetingId} />
    </Suspense>
  );
}
