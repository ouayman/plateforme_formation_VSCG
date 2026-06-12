import {
  PrismaClient,
  CompanyType,
  UserType,
  GlobalRole,
  ProjectRole,
  SessionStatus,
  CertificateStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_LOGO_DARK = "/branding/vscg-logo-dark.png";
const DEFAULT_LOGO_LIGHT = "/branding/vscg-icon.png";

async function main() {
  const internal = await prisma.company.upsert({
    where: { id: "seed-internal" },
    update: {
      logoUrl: DEFAULT_LOGO_DARK,
    },
    create: {
      id: "seed-internal",
      name: "Value Stream Consulting",
      type: CompanyType.internal,
      logoUrl: DEFAULT_LOGO_DARK,
    },
  });

  await prisma.platformSettings.upsert({
    where: { id: "default" },
    update: {
      organizationName: internal.name,
      logoDarkUrl: DEFAULT_LOGO_DARK,
      logoLightUrl: DEFAULT_LOGO_LIGHT,
      welcomeSignatory: "Ayman de VSCG",
    },
    create: {
      id: "default",
      organizationName: internal.name,
      logoDarkUrl: DEFAULT_LOGO_DARK,
      logoLightUrl: DEFAULT_LOGO_LIGHT,
      welcomeSignatory: "Ayman de VSCG",
    },
  });

  const client = await prisma.company.upsert({
    where: { id: "seed-client" },
    update: {},
    create: {
      id: "seed-client",
      name: "Acme Corp",
      type: CompanyType.client,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@vsc.local" },
    update: {},
    create: {
      email: "admin@vsc.local",
      firstName: "Admin",
      lastName: "VSC",
      companyId: internal.id,
      type: UserType.internal,
    },
  });

  const planner = await prisma.user.upsert({
    where: { email: "planner@vsc.local" },
    update: {},
    create: {
      email: "planner@vsc.local",
      firstName: "Marie",
      lastName: "Planner",
      companyId: internal.id,
      type: UserType.internal,
    },
  });

  const coordinator = await prisma.user.upsert({
    where: { email: "coordinator@acme.local" },
    update: {},
    create: {
      email: "coordinator@acme.local",
      firstName: "Jean",
      lastName: "Dupont",
      companyId: client.id,
      type: UserType.client,
    },
  });

  await prisma.userGlobalRole.upsert({
    where: { userId_role: { userId: admin.id, role: GlobalRole.ADMIN } },
    update: {},
    create: { userId: admin.id, role: GlobalRole.ADMIN },
  });

  await prisma.userGlobalRole.upsert({
    where: { userId_role: { userId: planner.id, role: GlobalRole.PLANNER } },
    update: {},
    create: { userId: planner.id, role: GlobalRole.PLANNER },
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project" },
    update: {},
    create: {
      id: "seed-project",
      name: "Formation Lean 2026",
      companyId: client.id,
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-06-30"),
    },
  });

  await prisma.projectLocation.upsert({
    where: { id: "seed-location" },
    update: {},
    create: {
      id: "seed-location",
      projectId: project.id,
      name: "Salle A — Paris",
      address: "12 rue de la Paix, 75002 Paris",
      instructions: "Badge à l'accueil",
    },
  });

  await prisma.projectSignatory.upsert({
    where: { id: "seed-signatory" },
    update: {},
    create: {
      id: "seed-signatory",
      projectId: project.id,
      name: "Sophie Martin",
      title: "DRH",
      signatureImageUrl: "",
    },
  });

  const trainer = await prisma.user.upsert({
    where: { email: "trainer@vsc.local" },
    update: { phone: "+33 6 00 00 00 01" },
    create: {
      email: "trainer@vsc.local",
      firstName: "Paul",
      lastName: "Formateur",
      phone: "+33 6 00 00 00 01",
      companyId: internal.id,
      type: UserType.internal,
    },
  });

  await prisma.userGlobalRole.upsert({
    where: { userId_role: { userId: trainer.id, role: GlobalRole.TRAINER } },
    update: {},
    create: { userId: trainer.id, role: GlobalRole.TRAINER },
  });

  await prisma.userProjectRole.upsert({
    where: {
      userId_projectId_role: {
        userId: coordinator.id,
        projectId: project.id,
        role: ProjectRole.COORDINATOR,
      },
    },
    update: { canAddParticipants: true, canUnlockCertificates: true },
    create: {
      userId: coordinator.id,
      projectId: project.id,
      role: ProjectRole.COORDINATOR,
      canAddParticipants: true,
      canUnlockCertificates: true,
    },
  });

  await prisma.userProjectRole.deleteMany({
    where: { userId: trainer.id, role: ProjectRole.TRAINER },
  });

  const program = await prisma.program.upsert({
    where: { id: "seed-program" },
    update: { name: "Programme Lean Practitioner" },
    create: {
      id: "seed-program",
      projectId: project.id,
      name: "Programme Lean Practitioner",
      orderIndex: 0,
    },
  });

  await prisma.training.upsert({
    where: { id: "seed-training" },
    update: {},
    create: {
      id: "seed-training",
      programId: program.id,
      title: "Introduction au Lean",
      description: "Fondamentaux et vocabulaire Lean",
      orderIndex: 0,
    },
  });

  const participant = await prisma.user.upsert({
    where: { email: "participant@acme.local" },
    update: {},
    create: {
      email: "participant@acme.local",
      firstName: "Luc",
      lastName: "Martin",
      companyId: client.id,
      type: UserType.client,
    },
  });

  await prisma.userProgram.upsert({
    where: {
      userId_programId: { userId: participant.id, programId: program.id },
    },
    update: {},
    create: { userId: participant.id, programId: program.id },
  });

  await prisma.userProjectRole.deleteMany({ where: { userId: participant.id } });

  const training = await prisma.training.findUniqueOrThrow({
    where: { id: "seed-training" },
  });

  await prisma.userTraining.upsert({
    where: {
      userId_trainingId: { userId: participant.id, trainingId: training.id },
    },
    update: { deletedAt: null },
    create: { userId: participant.id, trainingId: training.id },
  });

  for (const user of [admin, planner, trainer, coordinator, participant]) {
    await prisma.userCompany.upsert({
      where: { userId_companyId: { userId: user.id, companyId: user.companyId } },
      create: { userId: user.id, companyId: user.companyId },
      update: {},
    });
  }

  const leanDomain = await prisma.skillDomain.upsert({
    where: { name: "Lean" },
    create: { name: "Lean", orderIndex: 0 },
    update: {},
  });

  await prisma.userSkillDomain.upsert({
    where: {
      userId_skillDomainId: { userId: trainer.id, skillDomainId: leanDomain.id },
    },
    create: { userId: trainer.id, skillDomainId: leanDomain.id },
    update: {},
  });

  await prisma.trainingSkillDomain.upsert({
    where: {
      trainingId_skillDomainId: { trainingId: training.id, skillDomainId: leanDomain.id },
    },
    create: { trainingId: training.id, skillDomainId: leanDomain.id },
    update: {},
  });

  const seedSession = await prisma.session.upsert({
    where: { id: "seed-session" },
    update: {
      trainerId: trainer.id,
      locationId: "seed-location",
    },
    create: {
      id: "seed-session",
      trainingId: training.id,
      trainerId: trainer.id,
      locationId: "seed-location",
      startDatetime: new Date("2026-03-10T09:00:00"),
      endDatetime: new Date("2026-03-10T17:00:00"),
      status: SessionStatus.confirmed,
    },
  });

  await prisma.sessionParticipant.upsert({
    where: {
      sessionId_userId: { sessionId: seedSession.id, userId: participant.id },
    },
    update: { attendanceStatus: "present" },
    create: {
      sessionId: seedSession.id,
      userId: participant.id,
      attendanceStatus: "present",
    },
  });

  await prisma.certificate.upsert({
    where: {
      userId_trainingId: { userId: participant.id, trainingId: training.id },
    },
    update: {},
    create: {
      userId: participant.id,
      trainingId: training.id,
      status: CertificateStatus.locked,
    },
  });

  console.log("Seed OK:");
  console.log("  admin@vsc.local (ADMIN)");
  console.log("  planner@vsc.local (PLANNER)");
  console.log("  coordinator@acme.local (COORDINATOR)");
  console.log("  trainer@vsc.local (TRAINER global)");
  console.log("  participant@acme.local (participant programme + formation)");
  console.log("  Session seed : /sessions/seed-session (émargement OK, CR à rédiger)");
  console.log("  Attestation verrouillée — débloquer via admin/planner/coordinator autorisé");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
