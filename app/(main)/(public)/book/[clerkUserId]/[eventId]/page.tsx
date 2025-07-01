import { getEvent } from "@/server/actions/events";
import { AlertTriangle } from "lucide-react";
import {
  roundToNearestMinutes,
  addYears,
  eachMinuteOfInterval,
  endOfDay,
} from "date-fns";
import { getValidTimesFromSchedule } from "@/server/actions/schedule";
import NoTimeSlots from "@/components/NoTimeSlots";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clerkClient } from "@clerk/nextjs/server";
import BookingClient from "@/components/BookingClient";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ clerkUserId: string; eventId: string }>;
}) {
  const { clerkUserId, eventId } = await params;

  // fetch event details from db using the provided user and event
  const event = await getEvent(clerkUserId, eventId);

  if (!event) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 rounded-md flex items-center gap-2 text-sm max-w-md mx-auto mt-6">
        <AlertTriangle className="w-5 h-5" />
        <span>This event doesn't exist anymore!</span>
      </div>
    );
  }

  // get the full user object from clerk
  const client = await clerkClient();
  const calendarUser = await client.users.getUser(clerkUserId);

  const startDate = roundToNearestMinutes(new Date(), {
    nearestTo: 15,
    roundingMethod: "ceil",
  });

  const endDate = endOfDay(addYears(startDate, 1));

  let validTimes: Date[] = [];

  try {
    validTimes = await getValidTimesFromSchedule(
      eachMinuteOfInterval({ start: startDate, end: endDate }, { step: 15 }),
      event
    );
  } catch (error) {
    console.error("Error getting valid times:", error);
    // Return a user-friendly error page
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 rounded-md flex items-center gap-2 text-sm max-w-md mx-auto mt-6">
        <AlertTriangle className="w-5 h-5" />
        <span>
          Unable to load available times. This might be due to missing schedule
          or calendar integration issues. Please try again later or contact the
          event host.
        </span>
      </div>
    );
  }

  if (validTimes.length === 0) {
    return <NoTimeSlots event={event} calendarUser={calendarUser} />;
  }

  // Render the booking form with the list of valid available times
  return (
    <Card className="max-w-4xl mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
      <CardHeader>
        <CardTitle>
          Book {event.name} with {calendarUser.fullName}
        </CardTitle>
        {event.description && (
          <CardDescription>{event.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <BookingClient
          validTimes={validTimes}
          eventId={event.id}
          clerkUserId={clerkUserId}
        />
      </CardContent>
    </Card>
  );
}
