import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { canAccessTrainingAsParticipant } from "@/lib/permissions";
import { readStoredFile } from "@/lib/uploads";
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

  const file = await readStoredFile(attachment.fileUrl);
  if (!file) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const fileName = attachment.fileName ?? displayFileName(attachment.fileUrl);

  return new NextResponse(file.body, {
    headers: {
      "Content-Type": file.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
    },
  });
}
