export const participantRoutes = {
  trainings: "/my-trainings",
  training: (id: string) => `/trainings/${id}`,
  planning: "/planning",
} as const;
