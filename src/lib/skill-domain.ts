import { GlobalRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function listSkillDomains() {
  return prisma.skillDomain.findMany({
    orderBy: { orderIndex: "asc" },
  });
}

export async function getTrainerSkillDomainIds(userId: string) {
  const rows = await prisma.userSkillDomain.findMany({
    where: { userId },
    select: { skillDomainId: true },
  });
  return rows.map((r) => r.skillDomainId);
}

export async function getTrainingSkillDomainIds(trainingId: string) {
  const rows = await prisma.trainingSkillDomain.findMany({
    where: { trainingId },
    select: { skillDomainId: true },
  });
  return rows.map((r) => r.skillDomainId);
}

export async function setTrainingSkillDomains(trainingId: string, skillDomainIds: string[]) {
  await prisma.trainingSkillDomain.deleteMany({ where: { trainingId } });
  if (skillDomainIds.length === 0) return;
  await prisma.trainingSkillDomain.createMany({
    data: skillDomainIds.map((skillDomainId) => ({ trainingId, skillDomainId })),
    skipDuplicates: true,
  });
}

export async function setUserSkillDomains(userId: string, skillDomainIds: string[]) {
  await prisma.userSkillDomain.deleteMany({ where: { userId } });
  if (skillDomainIds.length === 0) return;
  await prisma.userSkillDomain.createMany({
    data: skillDomainIds.map((skillDomainId) => ({ userId, skillDomainId })),
    skipDuplicates: true,
  });
}

export async function suggestTrainersForTraining(trainingId: string) {
  const domainIds = await getTrainingSkillDomainIds(trainingId);
  if (domainIds.length === 0) {
    return prisma.user.findMany({
      where: { globalRoles: { some: { role: GlobalRole.TRAINER } } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
      orderBy: { lastName: "asc" },
    });
  }

  return prisma.user.findMany({
    where: {
      globalRoles: { some: { role: GlobalRole.TRAINER } },
      skillDomains: { some: { skillDomainId: { in: domainIds } } },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
    orderBy: { lastName: "asc" },
  });
}
