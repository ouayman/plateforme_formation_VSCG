import { z } from "zod";

export const unavailabilityInputSchema = z
  .object({
    startDatetime: z.string().min(1),
    endDatetime: z.string().min(1),
  })
  .refine((d) => new Date(d.endDatetime) > new Date(d.startDatetime), {
    message: "end_before_start",
    path: ["endDatetime"],
  });

export const unavailabilityBulkSchema = z.object({
  items: z.array(unavailabilityInputSchema).min(1).max(100),
});
