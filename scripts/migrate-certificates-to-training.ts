/**
 * One-off migration: certificates.program_id → certificates.training_id
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function columnExists(table: string, column: string) {
  const rows = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${table}
      AND column_name = ${column}
  `;
  return rows.length > 0;
}

async function main() {
  const hasProgramId = await columnExists("certificates", "program_id");
  const hasTrainingId = await columnExists("certificates", "training_id");

  if (!hasProgramId && hasTrainingId) {
    console.log("Migration déjà appliquée.");
    return;
  }

  if (!hasProgramId) {
    console.log("Colonne program_id absente — rien à migrer.");
    return;
  }

  if (!hasTrainingId) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE certificates
      ADD COLUMN training_id TEXT REFERENCES trainings(id) ON DELETE CASCADE
    `);
    console.log("Colonne training_id ajoutée.");
  }

  await prisma.$executeRawUnsafe(`
    UPDATE certificates c
    SET training_id = sub.training_id
    FROM (
      SELECT DISTINCT ON (c2.id)
        c2.id AS cert_id,
        t.id AS training_id
      FROM certificates c2
      INNER JOIN trainings t ON t.program_id = c2.program_id
      WHERE c2.training_id IS NULL
      ORDER BY c2.id, t.order_index ASC
    ) sub
    WHERE c.id = sub.cert_id AND c.training_id IS NULL
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO certificates (id, user_id, program_id, training_id, status, unlocked_by, unlocked_at, generated_at)
    SELECT
      'mig_' || c.id || '_' || t.id,
      c.user_id,
      c.program_id,
      t.id,
      c.status,
      c.unlocked_by,
      c.unlocked_at,
      c.generated_at
    FROM certificates c
    INNER JOIN trainings t ON t.program_id = c.program_id
    WHERE c.training_id IS NOT NULL
      AND t.id <> c.training_id
      AND NOT EXISTS (
        SELECT 1 FROM certificates c2
        WHERE c2.user_id = c.user_id AND c2.training_id = t.id
      )
  `);

  console.log("Données migrées vers training_id.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
