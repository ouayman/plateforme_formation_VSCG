import { ProjectRole, TrainingPostType, UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canManageProjects, getUserPermissions, isStaff } from "@/lib/permissions";
import type { ReactionCounts, ReactionType } from "@/lib/training-feed-utils";

export async function getTrainingProjectId(trainingId: string) {
  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    select: { program: { select: { projectId: true, id: true } } },
  });
  return training?.program ?? null;
}

export async function canPublishTrainingFeed(userId: string, projectId: string) {
  if (await canManageProjects(userId)) return true;

  const perms = await getUserPermissions(userId);
  if (perms.isTrainer) return true;

  if (
    perms.projectRoles.some(
      (r) => r.projectId === projectId && r.role === ProjectRole.TRAINER
    )
  ) {
    return true;
  }

  const coordinator = await prisma.userProjectRole.findFirst({
    where: {
      userId,
      projectId,
      role: ProjectRole.COORDINATOR,
      canPublishFeed: true,
    },
    select: { id: true },
  });
  return !!coordinator;
}

export async function canModerateTrainingPost(
  userId: string,
  authorId: string | null,
  postType: TrainingPostType
) {
  if (await canManageProjects(userId)) return true;
  if (postType === TrainingPostType.system) return false;
  return authorId === userId;
}

export function trainingPostVisibilityFilter(userId: string, staffView: boolean) {
  if (staffView) {
    return {
      OR: [
        { type: TrainingPostType.manual },
        { type: TrainingPostType.system, targetUserId: null },
      ],
    };
  }
  return {
    OR: [
      { type: TrainingPostType.manual },
      { type: TrainingPostType.system, targetUserId: userId },
      { type: TrainingPostType.system, targetUserId: null },
    ],
  };
}

export async function isStaffFeedViewer(userId: string) {
  const perms = await getUserPermissions(userId);
  return isStaff(perms) || perms.isTrainer;
}

export function serializeTrainingPost(
  post: {
    id: string;
    type: TrainingPostType;
    systemType: string | null;
    text: string | null;
    linkUrl: string | null;
    linkTitle: string | null;
    linkDescription: string | null;
    linkImageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      company: { name: string; type: UserType };
    } | null;
    attachments: {
      id: string;
      fileUrl: string;
      fileName: string | null;
      createdAt: Date;
    }[];
    reactions?: { userId: string; type: ReactionType }[];
  },
  viewerId: string
) {
  const counts: ReactionCounts = { like: 0, celebrate: 0, insightful: 0 };
  for (const r of post.reactions ?? []) {
    counts[r.type]++;
  }

  return {
    id: post.id,
    type: post.type,
    systemType: post.systemType,
    text: post.text,
    linkUrl: post.linkUrl,
    linkTitle: post.linkTitle,
    linkDescription: post.linkDescription,
    linkImageUrl: post.linkImageUrl,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: post.author
      ? {
          id: post.author.id,
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          avatarUrl: post.author.avatarUrl,
          companyName:
            post.author.company.type === UserType.internal
              ? "VSCG"
              : post.author.company.name,
        }
      : null,
    attachments: post.attachments.map((a) => ({
      id: a.id,
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      createdAt: a.createdAt.toISOString(),
    })),
    reactionCounts: counts,
    reactionTotal: (post.reactions ?? []).length,
    userReaction:
      post.reactions?.find((r) => r.userId === viewerId)?.type ?? null,
  };
}

export const postAuthorInclude = {
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      company: { select: { name: true, type: true } },
    },
  },
  attachments: { orderBy: { createdAt: "asc" as const } },
  reactions: { select: { userId: true, type: true } },
} as const;
