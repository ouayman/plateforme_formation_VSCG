/**
 * Sync idempotent du schéma auth mot de passe sur Vercel.
 * La prod Neon a été créée avec db push : prisma migrate deploy échoue
 * car la migration init tente de recréer des tables existantes.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function columnExists(table, column) {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function tableExists(table) {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function indexExists(indexName) {
  const rows = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = ${indexName}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function syncPasswordAuthSchema() {
  if (!(await columnExists("users", "password_hash"))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "users" ADD COLUMN "password_hash" TEXT`
    );
    console.log("[vercel-db-sync] Added users.password_hash");
  } else {
    console.log("[vercel-db-sync] users.password_hash already exists");
  }

  if (!(await tableExists("password_reset_tokens"))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "password_reset_tokens" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "token_hash" TEXT NOT NULL,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "used_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
      )
    `);
    console.log("[vercel-db-sync] Created password_reset_tokens");
  } else {
    console.log("[vercel-db-sync] password_reset_tokens already exists");
  }

  if (!(await indexExists("password_reset_tokens_token_hash_idx"))) {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens"("token_hash")`
    );
  }

  if (!(await indexExists("password_reset_tokens_user_id_expires_at_idx"))) {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX "password_reset_tokens_user_id_expires_at_idx" ON "password_reset_tokens"("user_id", "expires_at")`
    );
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("already exists")) {
      throw error;
    }
  }

  console.log("[vercel-db-sync] Password auth schema OK");
}

async function syncPlatformSettingsSchema() {
  if (!(await columnExists("platform_settings", "logo_email_url"))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "platform_settings" ADD COLUMN "logo_email_url" TEXT`
    );
    console.log("[vercel-db-sync] Added platform_settings.logo_email_url");
  } else {
    console.log("[vercel-db-sync] platform_settings.logo_email_url already exists");
  }
}

async function main() {
  await syncPasswordAuthSchema();
  await syncPlatformSettingsSchema();
}

main()
  .catch((error) => {
    console.error("[vercel-db-sync] Failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
