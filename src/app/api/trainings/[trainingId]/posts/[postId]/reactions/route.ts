import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { canAccessTrainingAsParticipant } from "@/lib/permissions";
import type { ReactionCounts, ReactionType } from "@/lib/training-feed-utils";

const reactionSchema = z.object({
  type: z.enum(["like", "celebrate", "insightful"]).nullable(),
});

export async function PUT(
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
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json();
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  if (parsed.data.type === null) {
    await prisma.trainingPostReaction.deleteMany({
      where: { postId: params.postId, userId: user.id },
    });
  } else {
    await prisma.trainingPostReaction.upsert({
      where: {
        postId_userId: { postId: params.postId, userId: user.id },
      },
      create: {
        postId: params.postId,
        userId: user.id,
        type: parsed.data.type as ReactionType,
      },
      update: {
        type: parsed.data.type as ReactionType,
      },
    });
  }

  const reactions = await prisma.trainingPostReaction.findMany({
    where: { postId: params.postId },
    select: { type: true, userId: true },
  });

  const counts: ReactionCounts = { like: 0, celebrate: 0, insightful: 0 };
  for (const r of reactions) counts[r.type as ReactionType]++;

  return NextResponse.json({
    reactionCounts: counts,
    reactionTotal: reactions.length,
    userReaction: reactions.find((r) => r.userId === user.id)?.type ?? null,
  });
}
