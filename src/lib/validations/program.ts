import { z } from "zod";

export const programSchema = z.object({
  name: z.string().min(1).max(200),
  orderIndex: z.number().int().min(0).default(0),
});

export const trainingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  orderIndex: z.number().int().min(0).optional(),
});

const sessionStatusEnum = z.enum(["confirmed", "pending", "cancelled"]);
const creationStatusEnum = z.enum(["confirmed", "pending"]);

function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export const sessionInputSchema = z
  .object({
    trainerIds: z.array(z.string().min(1)).default([]),
    locationId: z.string().optional().or(z.literal("")),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    status: creationStatusEnum,
  })
  .refine((d) => combineDateAndTime(d.date, d.endTime) > combineDateAndTime(d.date, d.startTime), {
    message: "end_before_start",
    path: ["endTime"],
  })
  .transform((d) => ({
    trainerIds: d.trainerIds,
    locationId: d.locationId || "",
    startDatetime: combineDateAndTime(d.date, d.startTime).toISOString(),
    endDatetime: combineDateAndTime(d.date, d.endTime).toISOString(),
    status: d.status,
  }));

export const sessionSchema = z
  .object({
    trainerIds: z.array(z.string().min(1)).optional(),
    trainerId: z.string().optional().or(z.literal("")),
    locationId: z.string().optional().or(z.literal("")),
    startDatetime: z.string().min(1),
    endDatetime: z.string().min(1),
    status: sessionStatusEnum,
  })
  .refine((d) => new Date(d.endDatetime) > new Date(d.startDatetime), {
    message: "end_before_start",
    path: ["endDatetime"],
  })
  .transform((d) => ({
    trainerIds: d.trainerIds ?? (d.trainerId ? [d.trainerId] : []),
    locationId: d.locationId || "",
    startDatetime: d.startDatetime,
    endDatetime: d.endDatetime,
    status: d.status,
  }));

export const sessionBulkSchema = z.object({
  sessions: z.array(sessionInputSchema).min(1).max(50),
});
