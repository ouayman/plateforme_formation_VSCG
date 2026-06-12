const SESSION_REF_PREFIX = "vscg://session/";

export function sessionRef(sessionId: string) {
  return `${SESSION_REF_PREFIX}${sessionId}`;
}

export function isInternalPostLink(linkUrl: string | null) {
  return !!linkUrl?.startsWith(SESSION_REF_PREFIX) || linkUrl === "vscg://feedback";
}

export type ReactionCounts = {
  like: number;
  celebrate: number;
  insightful: number;
};

export type ReactionType = keyof ReactionCounts;
