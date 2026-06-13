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
    include: postAuthorInclude,
    orderBy: { createdAt: "desc" },
  });

  return (
    <TrainingFeedPostsHydrate
      initialPosts={posts.map((p) => serializeTrainingPost(p, userId))}
    />
  );
}
