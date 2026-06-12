import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { canAccessTrainingAsParticipant } from "@/lib/permissions";
import { fetchLinkPreview } from "@/lib/link-preview";
import { deleteStoredFile } from "@/lib/uploads";
import {
  canModerateTrainingPost,
  postAuthorInclude,
  serializeTrainingPost,
} from "@/lib/training-feed";
import { trainingPostPatchSchema } from "@/lib/validations/training-post";

export async function PATCH(
  req: Request,
  { params }: { params: { trainingId: string; postId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!(await canAccessTrainingAsParticipant(user.id, params.trainingId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const post = await prisma.trainingPost.findFirst({
    where: { id: params.postId, trainingId: params.trainingId },
    select: { id: true, authorId: true, type: true },
  });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!(await canModerateTrainingPost(user.id, post.authorId, post.type))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = trainingPostPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  let linkData: {
    linkUrl?: string | null;
    linkTitle?: string | null;
    linkDescription?: string | null;
    linkImageUrl?: string | null;
  } = {};

  if (parsed.data.clearLink) {
    linkData = {
      linkUrl: null,
      linkTitle: null,
      linkDescription: null,
      linkImageUrl: null,
    };
  } else if (parsed.data.linkUrl !== undefined) {
    if (parsed.data.linkUrl) {
      const preview = await fetchLinkPreview(parsed.data.linkUrl);
      linkData = {
        linkUrl: parsed.data.linkUrl,
        linkTitle: parsed.data.linkTitle ?? preview?.title ?? null,
        linkDescription: parsed.data.linkDescription ?? preview?.description ?? null,
        linkImageUrl: parsed.data.linkImageUrl ?? preview?.imageUrl ?? null,
      };
    } else {
      linkData = {
        linkUrl: null,
        linkTitle: null,
        linkDescription: null,
        linkImageUrl: null,
      };
    }
  }

  const updated = await prisma.trainingPost.update({
    where: { id: post.id },
    data: {
      ...(parsed.data.text !== undefined ? { text: parsed.data.text } : {}),
      ...linkData,
    },
    include: postAuthorInclude,
  });

  return NextResponse.json(serializeTrainingPost(updated, user.id));
}

export async function DELETE(
  _req: Request,
  { params }: { params: { trainingId: string; postId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!(await canAccessTrainingAsParticipant(user.id, params.trainingId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const post = await prisma.trainingPost.findFirst({
    where: { id: params.postId, trainingId: params.trainingId },
    include: { attachments: true },
  });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!(await canModerateTrainingPost(user.id, post.authorId, post.type))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await Promise.all(post.attachments.map((a) => deleteStoredFile(a.fileUrl)));
  await prisma.trainingPost.delete({ where: { id: post.id } });

  return NextResponse.json({ ok: true });
}
