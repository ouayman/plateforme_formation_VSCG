import { prisma } from "@/lib/prisma";
import { validateAvatarUpload } from "@/lib/avatar-upload-utils";
import { deleteStoredFile, saveUserAvatar } from "@/lib/uploads";

export async function uploadUserAvatar(userId: string, file: File) {
  const validationError = validateAvatarUpload(file.name, file.size);
  if (validationError) {
    return { error: "invalid_file" as const, message: validationError };
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });
  if (!existing) {
    return { error: "not_found" as const };
  }

  try {
    const storedPath = await saveUserAvatar(userId, file);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: storedPath },
      select: { id: true, avatarUrl: true },
    });

    if (existing.avatarUrl) {
      await deleteStoredFile(existing.avatarUrl);
    }

    return { user: updated, path: storedPath };
  } catch {
    return { error: "upload_failed" as const };
  }
}

export async function removeUserAvatar(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });
  if (!existing) {
    return { error: "not_found" as const };
  }

  if (existing.avatarUrl) {
    await deleteStoredFile(existing.avatarUrl);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null },
  });

  return { ok: true as const };
}
