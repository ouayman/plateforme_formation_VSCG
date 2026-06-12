/**
 * Lot 1 — migration fondations data.
 * Usage : npm run db:migrate-lot1
 * Ordre recommandé : db:migrate-lot1 --pre → db:push → db:migrate-lot1 → db:seed
 */
import { GlobalRole, ProjectRole, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function tableHasColumn(table: string, column: string) {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}

async function tableExists(table: string) {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}

export async function preSchemaMigration() {
  console.log("[Lot1] Pré-migration : purge legacy…");

  if (await tableExists("feedbacks")) {
    const deletedFeedbacks = await prisma.$executeRawUnsafe(`DELETE FROM feedbacks`);
    console.log(`  Feedbacks supprimés (${deletedFeedbacks} lignes affectées).`);
  }

  if (await tableExists("training_posts")) {
    try {
      const deletedPosts = await prisma.$executeRawUnsafe(`
        DELETE FROM training_posts
        WHERE system_type::text IN ('next_session', 'feedback_request')
      `);
      console.log(`  Posts système legacy supprimés (${deletedPosts} lignes affectées).`);
    } catch {
      console.log("  Posts système legacy : enum déjà migré, rien à purger.");
    }
  }
}

export async function postSchemaMigration() {
  console.log("[Lot1] Post-migration : données fondations…");

  if (!(await tableExists("user_trainings"))) {
    console.log("  Table user_trainings absente — exécutez db:push d'abord.");
    return;
  }

  const users = await prisma.user.findMany({ select: { id: true, companyId: true } });
  let companyLinks = 0;
  for (const user of users) {
    await prisma.userCompany.upsert({
      where: { userId_companyId: { userId: user.id, companyId: user.companyId } },
      create: { userId: user.id, companyId: user.companyId },
      update: {},
    });
    companyLinks++;
  }
  console.log(`  UserCompany : ${companyLinks} affiliation(s) assurée(s).`);

  const enrollments = await prisma.userProgram.findMany({
    select: {
      userId: true,
      program: { select: { trainings: { select: { id: true } } } },
    },
  });

  let trainingLinks = 0;
  for (const enrollment of enrollments) {
    for (const training of enrollment.program.trainings) {
      await prisma.userTraining.upsert({
        where: {
          userId_trainingId: { userId: enrollment.userId, trainingId: training.id },
        },
        create: { userId: enrollment.userId, trainingId: training.id },
        update: { deletedAt: null },
      });
      trainingLinks++;
    }
  }
  console.log(`  UserTraining : ${trainingLinks} affectation(s) créée(s)/restaurée(s).`);

  const projectTrainers = await prisma.userProjectRole.findMany({
    where: { role: ProjectRole.TRAINER },
    select: { userId: true },
  });

  for (const row of projectTrainers) {
    await prisma.userGlobalRole.upsert({
      where: { userId_role: { userId: row.userId, role: GlobalRole.TRAINER } },
      create: { userId: row.userId, role: GlobalRole.TRAINER },
      update: {},
    });
  }

  const removed = await prisma.userProjectRole.deleteMany({
    where: { role: ProjectRole.TRAINER },
  });
  console.log(`  Formateurs projet → rôle global : ${projectTrainers.length} migré(s), ${removed.count} rôle(s) projet supprimé(s).`);

  const defaultDomains = ["Lean", "Management", "Communication", "Sécurité", "Qualité"];
  for (let i = 0; i < defaultDomains.length; i++) {
    await prisma.skillDomain.upsert({
      where: { name: defaultDomains[i] },
      create: { name: defaultDomains[i], orderIndex: i },
      update: { orderIndex: i },
    });
  }
  console.log(`  Domaines de compétences : ${defaultDomains.length} entrées par défaut.`);

  await prisma.platformSettings.updateMany({
    where: { welcomeSignatory: "" },
    data: { welcomeSignatory: "L'équipe VSCG" },
  });

  console.log("[Lot1] Post-migration terminée.");
}

async function main() {
  const mode = process.argv[2] ?? "all";

  if (mode === "--pre" || mode === "all") {
    await preSchemaMigration();
  }

  const hasTrainingIdOnFeedback = await tableHasColumn("feedbacks", "training_id");
  const hasUserTrainings = await tableExists("user_trainings");

  if ((mode === "--post" || mode === "all") && hasTrainingIdOnFeedback && hasUserTrainings) {
    await postSchemaMigration();
  } else if (mode === "--post" || mode === "all") {
    console.log("[Lot1] Post-migration ignorée — schéma pas encore à jour. Lancez db:push puis relancez.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
