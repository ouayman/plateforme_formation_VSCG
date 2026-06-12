import { z } from "zod";

export const projectSchema = z
  .object({
    name: z.string().min(1).max(200),
    companyId: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: "end_before_start",
    path: ["endDate"],
  });

export const locationSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional().or(z.literal("")),
  instructions: z.string().max(2000).optional().or(z.literal("")),
});

export const signatorySchema = z.object({
  name: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  signatureImageUrl: z
    .string()
    .max(500)
    .refine(
      (value) =>
        value === "" ||
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("signatures/"),
      { message: "invalid_signature" }
    )
    .default(""),
});
