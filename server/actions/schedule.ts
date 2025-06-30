"use server";

import { db } from "@/drizzle/db";
import { scheduleAvailabilityTable, scheduleTable } from "@/drizzle/schema";
import { scheduleFormSchema } from "@/schema/schedule";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
      throw new Error("Invaild schedule data or user not authenticated");
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
        db
          .insert(scheduleAvailabilityTable)
          .values(
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
