"use client";

import { useLayoutEffect } from "react";
import type { FeedPost } from "@/components/features/training-feed/feed-post-card";
import { useTrainingFeed } from "@/components/features/training-feed/training-feed-context";

type TrainingFeedPostsHydrateProps = {
  initialPosts: FeedPost[];
};

export function TrainingFeedPostsHydrate({ initialPosts }: TrainingFeedPostsHydrateProps) {
  const { setPosts } = useTrainingFeed();

  useLayoutEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts, setPosts]);

  return null;
}
