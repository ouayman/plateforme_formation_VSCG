import { z } from "zod";

export const reportSchema = z.object({
  content: z.string().trim().min(1).max(50000),
});
