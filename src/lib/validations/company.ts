import { z } from "zod";

const mediaPathSchema = z.string().max(500).optional().or(z.literal(""));

export const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.literal("client").default("client"),
  logoUrl: mediaPathSchema,
});

export const updateCompanySchema = z
  .object({
    name: z.string().min(1).max(200),
    type: z.literal("client").optional(),
    logoUrl: mediaPathSchema,
    attendanceThresholdPercent: z.number().int().min(0).max(100).optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field required",
  });

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
