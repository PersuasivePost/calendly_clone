"use server";

import { db } from "@/drizzle/db";
import { eventTable } from "@/drizzle/schema";
import { eventFormSchema } from "@/schema/events";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";

export async function createEvent(
  unsafeData: z.infer<typeof eventFormSchema>
): Promise<void> {
  try {
    const { userId } = await auth();

    const { success, data } = eventFormSchema.safeParse(unsafeData);

    if (!success || !userId) {
      throw new Error("Invaild event data or user not authenticated");
    }

    await db.insert(eventTable).values({ ...data, clerkUserId: userId });
  } catch (error: any) {
    throw new Error(`Failed to create event: ${error.message || error}`);
  } finally {
    revalidatePath("/events");
    redirect("/events");
  }
}

export async function updateEvent(
  id: string,
  unsafeData: z.infer<typeof eventFormSchema>
): Promise<void> {
  try {
    const { userId } = await auth();

    const { success, data } = eventFormSchema.safeParse(unsafeData);

    if (!success || !userId) {
      throw new Error("Invalid event data or user not authenticated");
    }

    // attempt to update the event in the db
    const { rowCount } = await db
      .update(eventTable)
      .set({ ...data })
      .where(and(eq(eventTable.id, id), eq(eventTable.clerkUserId, userId)));

    if (rowCount === 0) {
      throw new Error(
        "Event not found or user not authorized to update this event"
      );
    }
  } catch (error: any) {
    throw new Error(`Failed to update event: ${error.message || error}`);
  } finally {
    revalidatePath("/events");
    redirect("/events");
  }
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    // authenticate the user
    const { userId } = await auth();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { rowCount } = await db
      .delete(eventTable)
      .where(and(eq(eventTable.id, id), eq(eventTable.clerkUserId, userId)));

    if (rowCount === 0) {
      throw new Error(
        "Event not found or user not authorized to delete this event"
      );
    }
  } catch (error: any) {
    throw new Error(`Failed to delete event: ${error.message || error}`);
  } finally {
    revalidatePath("/events");
    redirect("/events");
  }
}

type EventRow = typeof eventTable.$inferSelect;

export async function getEvents(clerkUserId: string): Promise<EventRow[]> {
  const events = await db.query.eventTable.findMany({
    where: ({ clerkUserId: userIdCol }, { eq }) => eq(userIdCol, clerkUserId),
    orderBy: ({ name }, { asc, sql }) => asc(sql`lower(${name})`),
  });

  return events;
}

// get event
export async function getEvent(
  userId: string,
  eventId: string
): Promise<EventRow | undefined> {
  const event = await db.query.eventTable.findFirst({
    where: ({ id, clerkUserId }, { and, eq }) =>
      and(eq(clerkUserId, userId), eq(id, eventId)),
  });

  return event ?? undefined;
}

export type PublicEvent = Omit<EventRow, "isActive"> & { isActive: true };

export async function getPublicEvents(
  clerkUserId: string
): Promise<PublicEvent[]> {
  const events = await db.query.eventTable.findMany({
    where: ({ clerkUserId: userIdCol, isActive }, { eq, and }) =>
      and(eq(userIdCol, clerkUserId), eq(isActive, true)),
    orderBy: ({ name }, { asc, sql }) => asc(sql`lower(${name})`),
  });

  return events as PublicEvent[];
}
