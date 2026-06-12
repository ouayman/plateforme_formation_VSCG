import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { canAccessTrainingAsParticipant } from "@/lib/permissions";
import { resolveStoredPath } from "@/lib/uploads";
import { displayFileName } from "@/lib/upload-utils";
import { isStaffFeedViewer, trainingPostVisibilityFilter } from "@/lib/training-feed";

export async function GET(
  _req: Request,
  {
    params,
  }: { params: { trainingId: string; postId: string; attachmentId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!(await canAccessTrainingAsParticipant(user.id, params.trainingId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const staffView = await isStaffFeedViewer(user.id);

  const attachment = await prisma.trainingPostAttachment.findFirst({
    where: {
      id: params.attachmentId,
      postId: params.postId,
      post: {
        trainingId: params.trainingId,
        ...trainingPostVisibilityFilter(user.id, staffView),
      },
    },
  });

  if (!attachment) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const absolutePath = resolveStoredPath(attachment.fileUrl);
    const buffer = await import("fs/promises").then((fs) => fs.readFile(absolutePath));
    const fileName = attachment.fileName ?? displayFileName(attachment.fileUrl);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
