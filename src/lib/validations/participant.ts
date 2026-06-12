import { z } from "zod";

export const projectRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["COORDINATOR", "TRAINER"]),
  canAddParticipants: z.boolean().optional(),
  canPublishFeed: z.boolean().optional(),
  canUnlockCertificates: z.boolean().optional(),
  canManageSessions: z.boolean().optional(),
});

export const programParticipantSchema = z.object({
  userId: z.string().min(1),
});

export const addProgramParticipantSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  trainingIds: z.array(z.string().min(1)).default([]),
});

export const assignTrainingSchema = z.object({
  trainingId: z.string().min(1),
});

export const attendanceUpdateSchema = z.object({
  attendances: z.array(
    z.object({
      userId: z.string().min(1),
      attendanceStatus: z.enum(["present", "absent"]).nullable(),
    })
  ),
});
