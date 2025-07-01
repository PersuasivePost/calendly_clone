import { getEvent } from "@/server/actions/events";
import { clerkClient } from "@clerk/nextjs/server";
import { AlertTriangle, CheckCircle, Calendar, Clock, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate, formatTimeString } from "@/lib/formatters";

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ clerkUserId: string; eventId: string }>;
  searchParams: Promise<{ startTime?: string }>;
}) {
  const { clerkUserId, eventId } = await params;
  const { startTime } = await searchParams;

  // Fetch event details
  const event = await getEvent(clerkUserId, eventId);

  if (!event) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 rounded-md flex items-center gap-2 text-sm max-w-md mx-auto mt-6">
        <AlertTriangle className="w-5 h-5" />
        <span>This event doesn't exist anymore!</span>
      </div>
    );
  }

  // Get the full user object from clerk
  const client = await clerkClient();
  const calendarUser = await client.users.getUser(clerkUserId);

  // Parse the start time if provided
  const meetingTime = startTime ? new Date(startTime) : null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-2 border-green-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-700">
            Meeting Booked Successfully!
          </CardTitle>
          <CardDescription className="text-lg">
            Your meeting has been scheduled and confirmed.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Event Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-semibold">Event</h3>
                <p className="text-gray-600">{event.name}</p>
                {event.description && (
                  <p className="text-sm text-gray-500">{event.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-purple-500" />
              <div>
                <h3 className="font-semibold">Host</h3>
                <p className="text-gray-600">{calendarUser.fullName}</p>
              </div>
            </div>

            {meetingTime && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <h3 className="font-semibold">Date & Time</h3>
                  <p className="text-gray-600">
                    {formatDate(meetingTime)} at {formatTimeString(meetingTime)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Duration: {event.durationInMinutes} minutes
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-6 border-t space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                📧 A confirmation email has been sent to you with meeting details and calendar invite.
              </p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href={`/book/${clerkUserId}`}>
                  Book Another Meeting
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
