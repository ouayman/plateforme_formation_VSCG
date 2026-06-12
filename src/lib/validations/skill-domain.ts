import { z } from "zod";

export const skillDomainSchema = z.object({
  name: z.string().min(1).max(120),
});

export const updateSkillDomainSchema = skillDomainSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field required" }
);

export const skillDomainTrainersSchema = z.object({
  trainerIds: z.array(z.string().min(1)),
});
