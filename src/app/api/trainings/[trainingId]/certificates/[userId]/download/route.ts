import { NextResponse } from "next/server";
import { CertificateStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { buildCertificateHtml } from "@/lib/certificates";
import { canDownloadCertificate } from "@/lib/permissions";

export async function GET(
  req: Request,
  { params }: { params: { trainingId: string; userId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const targetUserId = params.userId === "me" ? user.id : params.userId;

  if (!(await canDownloadCertificate(user.id, params.trainingId, targetUserId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const certificate = await prisma.certificate.findUnique({
    where: {
      userId_trainingId: { userId: targetUserId, trainingId: params.trainingId },
    },
    include: {
      user: {
        select: { firstName: true, lastName: true, company: { select: { name: true } } },
      },
      training: {
        select: {
          title: true,
          program: {
            select: {
              name: true,
              project: {
                select: {
                  signatories: { take: 1, orderBy: { name: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!certificate) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (certificate.status !== CertificateStatus.unlocked) {
    return NextResponse.json({ error: "locked" }, { status: 403 });
  }

  const generatedAt = new Date();
  await prisma.certificate.update({
    where: { id: certificate.id },
    data: { generatedAt },
  });

  const signatory = certificate.training.program.project.signatories[0];
  const html = buildCertificateHtml({
    certificateTitle: certificate.training.title,
    programName: certificate.training.program.name,
    participantName: `${certificate.user.firstName} ${certificate.user.lastName}`,
    companyName: certificate.user.company.name,
    signatoryName: signatory?.name ?? null,
    signatoryTitle: signatory?.title ?? null,
    generatedAt,
  });

  const print = new URL(req.url).searchParams.get("print") === "1";

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...(print ? {} : { "Content-Disposition": "inline" }),
    },
  });
}
