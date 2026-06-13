"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FeedPost } from "@/components/features/training-feed/feed-post-card";
import type { CertificateRow } from "@/components/features/training-feed/feed-certificate-panel";

type ParticipantUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type TrainingFeedContextValue = {
  posts: FeedPost[];
  postsReady: boolean;
  setPosts: (posts: FeedPost[]) => void;
  prependPost: (post: FeedPost) => void;
  removePost: (postId: string) => void;
  updatePost: (postId: string, patch: Partial<FeedPost>) => void;
  certificates: CertificateRow[];
  availableParticipants: ParticipantUser[];
  updateCertificateStatus: (userId: string, status: "locked" | "unlocked") => void;
  updateAllCertificateStatus: (
    userIds: string[],
    status: "locked" | "unlocked"
  ) => void;
  assignParticipant: (user: ParticipantUser, certificate: CertificateRow) => void;
  unassignParticipant: (userId: string) => void;
};

const TrainingFeedContext = createContext<TrainingFeedContextValue | null>(null);

type TrainingFeedProviderProps = {
  initialCertificates: CertificateRow[];
  initialAvailableParticipants: ParticipantUser[];
  children: ReactNode;
};

export function TrainingFeedProvider({
  initialCertificates,
  initialAvailableParticipants,
  children,
}: TrainingFeedProviderProps) {
  const [posts, setPostsState] = useState<FeedPost[]>([]);
  const [postsReady, setPostsReady] = useState(false);
  const [certificates, setCertificates] = useState(initialCertificates);
  const [availableParticipants, setAvailableParticipants] = useState(
    initialAvailableParticipants
  );

  const setPosts = useCallback((next: FeedPost[]) => {
    setPostsState(next);
    setPostsReady(true);
  }, []);

  const prependPost = useCallback((post: FeedPost) => {
    setPostsState((prev) => [post, ...prev]);
    setPostsReady(true);
  }, []);

  const removePost = useCallback((postId: string) => {
    setPostsState((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const updatePost = useCallback((postId: string, patch: Partial<FeedPost>) => {
    setPostsState((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...patch } : p))
    );
  }, []);

  const updateCertificateStatus = useCallback(
    (userId: string, status: "locked" | "unlocked") => {
      setCertificates((prev) =>
        prev.map((c) => (c.userId === userId ? { ...c, status } : c))
      );
    },
    []
  );

  const updateAllCertificateStatus = useCallback(
    (userIds: string[], status: "locked" | "unlocked") => {
      const ids = new Set(userIds);
      setCertificates((prev) =>
        prev.map((c) => (ids.has(c.userId) ? { ...c, status } : c))
      );
    },
    []
  );

  const assignParticipant = useCallback(
    (user: ParticipantUser, certificate: CertificateRow) => {
      setCertificates((prev) =>
        [...prev, certificate].sort((a, b) =>
          a.user.lastName.localeCompare(b.user.lastName, "fr")
        )
      );
      setAvailableParticipants((prev) => prev.filter((p) => p.id !== user.id));
    },
    []
  );

  const unassignParticipant = useCallback((userId: string) => {
    setCertificates((prev) => {
      const removed = prev.find((c) => c.userId === userId);
      if (removed) {
        setAvailableParticipants((available) => [
          ...available,
          {
            id: removed.userId,
            firstName: removed.user.firstName,
            lastName: removed.user.lastName,
            email: removed.user.email,
          },
        ].sort((a, b) => a.lastName.localeCompare(b.lastName, "fr")));
      }
      return prev.filter((c) => c.userId !== userId);
    });
  }, []);

  const value = useMemo(
    () => ({
      posts,
      postsReady,
      setPosts,
      prependPost,
      removePost,
      updatePost,
      certificates,
      availableParticipants,
      updateCertificateStatus,
      updateAllCertificateStatus,
      assignParticipant,
      unassignParticipant,
    }),
    [
      posts,
      postsReady,
      setPosts,
      prependPost,
      removePost,
      updatePost,
      certificates,
      availableParticipants,
      updateCertificateStatus,
      updateAllCertificateStatus,
      assignParticipant,
      unassignParticipant,
    ]
  );

  return (
    <TrainingFeedContext.Provider value={value}>{children}</TrainingFeedContext.Provider>
  );
}

export function useTrainingFeed() {
  const ctx = useContext(TrainingFeedContext);
  if (!ctx) {
    throw new Error("useTrainingFeed must be used within TrainingFeedProvider");
  }
  return ctx;
}
