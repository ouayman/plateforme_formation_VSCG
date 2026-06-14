import { z } from "zod";

const mediaPathSchema = z.string().min(1).max(500);

export const platformSettingsSchema = z.object({
  organizationName: z.string().min(1).max(200),
  logoDarkUrl: mediaPathSchema,
  logoLightUrl: mediaPathSchema,
  logoEmailUrl: mediaPathSchema.nullable().optional(),
  welcomeSignatory: z.string().min(1).max(200),
});

export const projectRolePatchSchema = z
  .object({
    canAddParticipants: z.boolean().optional(),
    canPublishFeed: z.boolean().optional(),
    canUnlockCertificates: z.boolean().optional(),
    canManageSessions: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.canAddParticipants !== undefined ||
      data.canPublishFeed !== undefined ||
      data.canUnlockCertificates !== undefined ||
      data.canManageSessions !== undefined,
    { message: "At least one field required" }
  );
