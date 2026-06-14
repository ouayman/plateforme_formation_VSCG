import { z } from "zod";

import { PASSWORD } from "@/lib/constants";

export const passwordFieldSchema = z
  .string()
  .min(PASSWORD.MIN_LENGTH, "too_short")
  .max(128);

export const loginPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const identifyEmailSchema = z.object({
  email: z.string().email(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordFieldSchema,
});

export const changeAccountPasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: passwordFieldSchema,
});

export const adminSetPasswordSchema = z.object({
  newPassword: passwordFieldSchema,
});
