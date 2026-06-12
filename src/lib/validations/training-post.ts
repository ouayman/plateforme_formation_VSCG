import { z } from "zod";

export const linkPreviewSchema = z.object({
  url: z.string().url().max(2000),
});

export const trainingPostPatchSchema = z.object({
  text: z.string().max(10000).nullable().optional(),
  linkUrl: z.string().url().max(2000).nullable().optional(),
  linkTitle: z.string().max(500).nullable().optional(),
  linkDescription: z.string().max(2000).nullable().optional(),
  linkImageUrl: z.string().max(2000).nullable().optional(),
  clearLink: z.boolean().optional(),
});
