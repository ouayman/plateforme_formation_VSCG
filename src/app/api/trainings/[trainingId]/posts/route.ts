import { NextResponse } from "next/server";
import { TrainingPostType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { canAccessTrainingAsParticipant } from "@/lib/permissions";
import { fetchLinkPreview } from "@/lib/link-preview";
import { validateUploadFile } from "@/lib/upload-utils";
import { savePostAttachment } from "@/lib/uploads";
import {
  canPublishTrainingFeed,
  getTrainingProjectId,
  isStaffFeedViewer,
  postAuthorInclude,
  serializeTrainingPost,
  trainingPostVisibilityFilter,
} from "@/lib/training-feed";

async function assertTrainingAccess(userId: string, trainingId: string) {
  return canAccessTrainingAsParticipant(userId, trainingId);
}

export async function GET(
  _req: Request,
  { params }: { params: { trainingId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!(await assertTrainingAccess(user.id, params.trainingId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const staffView = await isStaffFeedViewer(user.id);

  const posts = await prisma.trainingPost.findMany({
    where: {
      trainingId: params.trainingId,
      ...trainingPostVisibilityFilter(user.id, staffView),
    },
    include: postAuthorInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    posts: posts.map((p) => serializeTrainingPost(p, user.id)),
  });
}

export async function POST(
  req: Request,
  { params }: { params: { trainingId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ctx = await getTrainingProjectId(params.trainingId);
  if (!ctx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!(await assertTrainingAccess(user.id, params.trainingId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!(await canPublishTrainingFeed(user.id, ctx.projectId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const text = (form.get("text") as string | null)?.trim() || null;
  const linkUrl = (form.get("linkUrl") as string | null)?.trim() || null;
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (!text && !linkUrl && files.length === 0) {
    return NextResponse.json({ error: "empty_post" }, { status: 400 });
  }

  for (const file of files) {
    const err = validateUploadFile(file.name, file.size);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }

  let linkTitle: string | null = (form.get("linkTitle") as string | null) || null;
  let linkDescription: string | null = (form.get("linkDescription") as string | null) || null;
  let linkImageUrl: string | null = (form.get("linkImageUrl") as string | null) || null;

  if (linkUrl && !linkTitle) {
    const preview = await fetchLinkPreview(linkUrl);
    if (preview) {
      linkTitle = preview.title;
      linkDescription = preview.description;
      linkImageUrl = preview.imageUrl;
    }
  }

  const post = await prisma.trainingPost.create({
    data: {
      trainingId: params.trainingId,
      authorId: user.id,
      type: TrainingPostType.manual,
      text,
      linkUrl,
      linkTitle,
      linkDescription,
      linkImageUrl,
    },
    include: postAuthorInclude,
  });

  const attachments = [];
  for (const file of files) {
    const attachmentId = crypto.randomUUID();
    const fileUrl = await savePostAttachment(params.trainingId, attachmentId, file);
    const attachment = await prisma.trainingPostAttachment.create({
      data: {
        id: attachmentId,
        postId: post.id,
        fileUrl,
        fileName: file.name,
      },
    });
    attachments.push(attachment);
  }

  return NextResponse.json(
    serializeTrainingPost({ ...post, attachments }, user.id),
    { status: 201 }
  );
}
