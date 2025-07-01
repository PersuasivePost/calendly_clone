"use client";

import MeetingForm from "./forms/MeetingForm";

interface BookingClientProps {
  validTimes: Date[];
  eventId: string;
  clerkUserId: string;
}

export default function BookingClient({
  validTimes,
  eventId,
  clerkUserId,
}: BookingClientProps) {
  return (
    <MeetingForm
      validTimes={validTimes}
      eventId={eventId}
      clerkUserId={clerkUserId}
    />
  );
}
