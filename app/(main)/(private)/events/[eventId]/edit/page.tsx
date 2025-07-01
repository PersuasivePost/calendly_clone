import EventForm from "@/components/forms/EventForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvent } from "@/server/actions/events";
import { auth } from "@clerk/nextjs/server";

export default async function EditEventPage({
  params, //extracting the eventid from the url
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const { eventId } = await params;

  const event = await getEvent(userId, eventId);
  if (!event) return <h1>Event not found</h1>;

  // Render the page with a card layout, displaying the "Edit Event" form
  return (
    <Card className="max-w-md mx-auto border-4 border-blue-100 shadow-2xl shadow-accent-foreground">
      <CardHeader>
        <CardTitle>Edit Event</CardTitle>
      </CardHeader>
      <CardContent>
        <EventForm
          event={{ ...event, description: event.description || undefined }} // If description is null, pass undefined
        />
      </CardContent>
    </Card>
  );
}
