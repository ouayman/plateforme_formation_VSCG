import "server-only";

import bcrypt from "bcryptjs";

import { PASSWORD } from "@/lib/constants";

const BCRYPT_ROUNDS = 12;

export type PasswordValidationError = "too_short";

export function validatePassword(password: string): PasswordValidationError | null {
  if (password.length < PASSWORD.MIN_LENGTH) {
    return "too_short";
  }
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const error = validatePassword(password);
  if (error) {
    throw new Error(error);
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
