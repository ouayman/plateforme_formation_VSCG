import { NextResponse } from "next/server";
import { CertificateStatus } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { canUnlockCertificate } from "@/lib/permissions";

const patchSchema = z.object({
  status: z.enum(["locked", "unlocked"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { trainingId: string; userId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const training = await prisma.training.findUnique({
    where: { id: params.trainingId },
    select: { program: { select: { projectId: true } } },
  });
  if (!training) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!(await canUnlockCertificate(user.id, training.program.projectId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  const nextStatus =
    parsed.success && parsed.data.status === "locked"
      ? CertificateStatus.locked
      : CertificateStatus.unlocked;

  const targetUserId = params.userId === "me" ? user.id : params.userId;

  const certificate = await prisma.certificate.update({
    where: {
      userId_trainingId: { userId: targetUserId, trainingId: params.trainingId },
    },
    data:
      nextStatus === CertificateStatus.unlocked
        ? {
            status: CertificateStatus.unlocked,
            unlockedBy: user.id,
            unlockedAt: new Date(),
          }
        : {
            status: CertificateStatus.locked,
            unlockedBy: null,
            unlockedAt: null,
          },
  });

  if (nextStatus === CertificateStatus.unlocked) {
    const { createCertificateAvailablePost } = await import("@/lib/training-system-posts");
    await createCertificateAvailablePost(params.trainingId, targetUserId);
  }

  return NextResponse.json(certificate);
}
