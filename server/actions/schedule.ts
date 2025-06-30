"use server";

import { fromZonedTime } from "date-fns-tz";
import { db } from "@/drizzle/db";
import { scheduleAvailabilityTable, scheduleTable } from "@/drizzle/schema";
import { scheduleFormSchema } from "@/schema/schedule";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCalendarEventTimes } from "../google/googleCalendar";
import { addMinutes, areIntervalsOverlapping, isFriday, isMonday, isSaturday, isSunday, isThursday, isTuesday, isWednesday, isWithinInterval, setHours, setMinutes } from "date-fns";
import { DAYS_OF_WEEK_IN_ORDER_IN_ORDER } from "@/constants";

type ScheduleRow = typeof scheduleTable.$inferSelect;
type AvailabilityRow = typeof scheduleAvailabilityTable.$inferSelect;

export type FullSchedule = ScheduleRow & {
  availabilities: AvailabilityRow[];
};

export async function getSchedule(userId: string): Promise<FullSchedule> {
  const schedule = await db.query.scheduleTable.findFirst({
    where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
    with: {
      availabilities: true,
    },
  });

  return schedule as FullSchedule;
}

export async function saveSchedule(
  unsafeData: z.infer<typeof scheduleFormSchema>
) {
  try {
    const { userId } = await auth();

    const { success, data } = scheduleFormSchema.safeParse(unsafeData);

    if (!success || userId == null) {
      throw new Error("Invalid schedule data or user not authenticated");
    }

    const { availabilities, ...scheduleData } = data;

    const [{ id: scheduleId }] = await db
      .insert(scheduleTable)
      .values({ ...scheduleData, clerkUserId: userId })
      .onConflictDoUpdate({
        target: scheduleTable.clerkUserId,
        set: scheduleData,
      })
      .returning({ id: scheduleTable.id });

    const statements: [BatchItem<"pg">] = [
      db
        .delete(scheduleAvailabilityTable)
        .where(eq(scheduleAvailabilityTable.scheduleId, scheduleId)),
    ];

    if (availabilities.length > 0) {
      statements.push(
        db.insert(scheduleAvailabilityTable).values(
          availabilities.map((availability) => ({
            ...availability,
            scheduleId,
          }))
        )
      );
    }

    await db.batch(statements);
  } catch (error: any) {
    throw new Error(`Failed to save schedule: ${error.message || error}`);
  } finally {
    revalidatePath("/schedule");
  }
}

// filters a list of time slots to return only those that: 1. Match the users availability schedule and 2. do not overlap with existing google calendar events

export async function getValidTimesFromSchedule(
  timesInOrder: Date[], // All possible time slots to check
  event: { clerkUserId: string; durationInMinutes: number }
): Promise<Date[]> {
  const { clerkUserId: userId, durationInMinutes } = event;

  // define the start and end of the overall range to check
  const start = timesInOrder[0];
  const end = timesInOrder.at(-1);

  if (!start || !end) return [];

  const schedule = await getSchedule(userId);

  if (schedule == null) return [];

  const groupedAvailabilities = Object.groupBy(
    schedule.availabilities,
    (a) => a.dayOfWeek
  );

  // fetch all existing google calendar events between start and end
  const eventTimes = await getCalendarEventTimes(userId, { start, end });

  // filter and return only valid time slots based on availability and conflicts
  return timesInOrder.filter(intervalDate => {
    const availabilities = getAvailabilities(
      groupedAvailabilities,
      intervalDate,
      schedule.timezone
    );

    // Define the time range for a potential event starting at this interval
    const eventInterval = {
      start: intervalDate, // Proposed start time
      end: addMinutes(intervalDate, durationInMinutes), // Proposed end time (start + duration)
    };

    // Keep only the time slots that satisfy two conditions:
    return (
      // 1. This time slot does not overlap with any existing calendar events
      eventTimes.every(eventTime => {
        return !areIntervalsOverlapping(eventTime, eventInterval);
      }) &&
      // 2. The entire proposed event fits within at least one availability window
      availabilities.some(availability => {
        return (
          isWithinInterval(eventInterval.start, availability) && // Start is inside availability
          isWithinInterval(eventInterval.end, availability) // End is inside availability
        );
      })
    );
  });
}

function getAvailabilities(
  groupedAvailabilities: Partial<
    Record<
      (typeof DAYS_OF_WEEK_IN_ORDER_IN_ORDER)[number],
      (typeof scheduleAvailabilityTable.$inferSelect)[]
    >
  >,
  date: Date,
  timezone: string
): { start: Date; end: Date }[] {
  // Determine the day of the week based on the given date
  const dayOfWeek = (() => {
    if (isMonday(date)) return "monday";
    if (isTuesday(date)) return "tuesday";
    if (isWednesday(date)) return "wednesday";
    if (isThursday(date)) return "thursday";
    if (isFriday(date)) return "friday";
    if (isSaturday(date)) return "saturday";
    if (isSunday(date)) return "sunday";
    return null; // If the date doesn't match any day (highly unlikely), return null
  })();

  // If day of the week is not determined, return an empty array
  if (!dayOfWeek) return [];

  // Get the availabilities for the determined day
  const dayAvailabilities = groupedAvailabilities[dayOfWeek];

  // If there are no availabilities for that day, return an empty array
  if (!dayAvailabilities) return [];

  // Map each availability time range to a { start: Date, end: Date } object adjusted to the user's timezone
  return dayAvailabilities.map(({ startTime, endTime }) => {
    // Parse startTime (e.g., "09:30") into hours and minutes
    const [startHour, startMinute] = startTime.split(":").map(Number);
    // Parse endTime (e.g., "17:00") into hours and minutes
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Create a start Date object set to the correct hour and minute, then convert it to the given timezone
    const start = fromZonedTime(
      setMinutes(setHours(date, startHour), startMinute),
      timezone
    );

    // Create an end Date object set to the correct hour and minute, then convert it to the given timezone
    const end = fromZonedTime(
      setMinutes(setHours(date, endHour), endMinute),
      timezone
    );

    // Return the availability interval
    return { start, end };
  });
}
