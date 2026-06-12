import { z } from "zod";
import { GLOBAL_ROLES } from "@/lib/user-roles";

const globalRoleEnum = z.enum(GLOBAL_ROLES);

export const inviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  companyId: z.string().min(1),
  type: z.enum(["internal", "client"]),
  globalRoles: z.array(globalRoleEnum).default([]),
});

export const updateUserRolesSchema = z.object({
  globalRoles: z.array(globalRoleEnum),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  companyId: z.string().min(1).optional(),
  type: z.enum(["internal", "client"]).optional(),
  globalRoles: z.array(globalRoleEnum).optional(),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updateAccountSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
