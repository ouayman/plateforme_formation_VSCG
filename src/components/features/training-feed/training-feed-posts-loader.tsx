import { prisma } from "@/lib/prisma";
import {
  postAuthorInclude,
  serializeTrainingPost,
  trainingPostVisibilityFilter,
} from "@/lib/training-feed";
import { TrainingFeedPostsHydrate } from "@/components/features/training-feed/training-feed-posts-hydrate";

type TrainingFeedPostsLoaderProps = {
  trainingId: string;
  userId: string;
  staffView: boolean;
};

const trainingPostSelect = {
  id: true,
  type: true,
  systemType: true,
  text: true,
  linkUrl: true,
  linkTitle: true,
  linkDescription: true,
  linkImageUrl: true,
  createdAt: true,
  updatedAt: true,
  author: postAuthorInclude.author,
  attachments: postAuthorInclude.attachments,
  reactions: postAuthorInclude.reactions,
} as const;

export async function TrainingFeedPostsLoader({
  trainingId,
  userId,
  staffView,
}: TrainingFeedPostsLoaderProps) {
  const posts = await prisma.trainingPost.findMany({
    where: {
      trainingId,
      ...trainingPostVisibilityFilter(userId, staffView),
    },
    select: trainingPostSelect,
    orderBy: { createdAt: "desc" },
  });

  return (
    <TrainingFeedPostsHydrate
      initialPosts={posts.map((p) => serializeTrainingPost(p, userId))}
    />
  );
}
