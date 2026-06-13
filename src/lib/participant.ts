import { prisma } from "@/lib/prisma";

export async function getParticipantTrainings(userId: string, companyId?: string | null) {
  const assignments = await prisma.userTraining.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(companyId
        ? { training: { program: { project: { companyId } } } }
        : {}),
    },
    select: {
      training: {
        select: {
          id: true,
          title: true,
          description: true,
          programId: true,
          program: {
            select: {
              name: true,
              project: {
                select: {
                  id: true,
                  name: true,
                  company: { select: { name: true } },
                },
              },
            },
          },
          _count: { select: { sessions: true } },
          posts: {
            select: { _count: { select: { attachments: true } } },
          },
          sessions: {
            orderBy: { startDatetime: "asc" },
            select: {
              id: true,
              startDatetime: true,
              endDatetime: true,
              status: true,
              location: { select: { name: true } },
              participants: {
                where: { userId },
                select: { attendanceStatus: true },
              },
            },
          },
          certificates: {
            where: { userId },
            select: { status: true, unlockedAt: true },
          },
          feedbacks: {
            where: { userId },
            select: { id: true, rating: true },
          },
        },
      },
    },
    orderBy: { training: { program: { name: "asc" } } },
  });

  return assignments.map(({ training }) => ({
    id: training.id,
    title: training.title,
    description: training.description,
    programId: training.programId,
    programName: training.program.name,
    projectId: training.program.project.id,
    projectName: training.program.project.name,
    companyName: training.program.project.company.name,
    sessionCount: training._count.sessions,
    documentCount: training.posts.reduce((sum, post) => sum + post._count.attachments, 0),
    sessions: training.sessions.map((s) => ({
      id: s.id,
      startDatetime: s.startDatetime,
      endDatetime: s.endDatetime,
      status: s.status,
      locationName: s.location?.name ?? null,
      attendanceStatus: s.participants[0]?.attendanceStatus ?? null,
    })),
    certificate: training.certificates[0]
      ? {
          status: training.certificates[0].status,
          unlockedAt: training.certificates[0].unlockedAt?.toISOString() ?? null,
        }
      : null,
    hasFeedback: training.feedbacks.length > 0,
  }));
}
