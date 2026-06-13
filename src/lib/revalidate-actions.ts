"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function revalidateAppPath(path: string) {
  revalidatePath(path);
}

export async function revalidateTrainingPage(trainingId: string) {
  revalidatePath(`/trainings/${trainingId}`);
}

export async function revalidateSessionPage(sessionId: string) {
  revalidatePath(`/sessions/${sessionId}`);
}

export async function revalidatePlatformSettingsCache() {
  revalidateTag("platform-settings");
}
