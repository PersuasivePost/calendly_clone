"use server";

import { db } from "@/drizzle/db";
import { scheduleAvailabilityTable, scheduleTable } from "@/drizzle/schema";

type ScheduleRow = typeof scheduleTable.$inferSelect;
type AvailabilityRow = typeof scheduleAvailabilityTable.$inferSelect;

export type FullSchedule = ScheduleRow & {
  availabilities: AvailabilityRow[];
};

export async function getSchedule(
  userId: string
): Promise<FullSchedule | null> {
  const schedule = await db.query.scheduleTable.findFirst({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
    with: {
      availabilities: true,
    },
  });

  return schedule as FullSchedule | null;
}
