import { DAYS_OF_WEEK_IN_ORDER_IN_ORDER } from "@/constants";
import z from "zod";

export const scheduleFormSchema = z.object({
  timezone: z.string().min(1, "Required"),
  availabilities: z
    .array(
      z.object({
        dayOfWeek: z.enum(DAYS_OF_WEEK_IN_ORDER_IN_ORDER),
        startTime: z
          .string()
          .regex(
            /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
            "Time must be in HH:mm format"
          ),
        endTime: z
          .string()
          .regex(
            /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
            "Time must be in HH:mm format"
          ),
      })
    )
    .superRefine((availabilities, ctx) => {
      availabilities.forEach((availability, index) => {
        const overlaps = availabilities.some((a, i) => {
          return (
            i !== index &&
            a.dayOfWeek === availability.dayOfWeek &&
            timeToFloat(a.startTime) < timeToFloat(availability.endTime) &&
            timeToFloat(a.endTime) > timeToFloat(availability.startTime)
          );
        });

        if(overlaps) {
            ctx.addIssue({
                code: "custom",
                message: "Availability overlaps with another, path: [index, "startTime"],
            })
        }

        if (
            timeToFloat(availability.startTime) >= timeToFloat(availability.endTime)
        ) {
            ctx.addIssue({
                code: "custom",
                message: "end time must be after start time",
                path: [index, "endTime"]
            })
        }
      });
    }),
});
