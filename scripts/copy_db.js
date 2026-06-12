const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const LOCAL_DB =
  process.env.LOCAL_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/vsc_platform";
const REMOTE_DB = process.env.REMOTE_DATABASE_URL;

if (!REMOTE_DB) {
  console.error(
    "❌ Définissez REMOTE_DATABASE_URL dans .env (URL Neon avec ?sslmode=require)"
  );
  process.exit(1);
}

const localPrisma = new PrismaClient({
  datasources: { db: { url: LOCAL_DB } },
});

const remotePrisma = new PrismaClient({
  datasources: { db: { url: REMOTE_DB } },
});

/** Tables à copier dans l'ordre des dépendances FK. */
const COPY_ORDER = [
  { label: "companies", model: "company" },
  { label: "users", model: "user" },
  { label: "platform_settings", model: "platformSettings" },
  { label: "skill_domains", model: "skillDomain" },
  { label: "projects", model: "project" },
  { label: "project_locations", model: "projectLocation" },
  { label: "project_signatories", model: "projectSignatory" },
  { label: "programs", model: "program" },
  { label: "trainings", model: "training" },
  { label: "user_companies", model: "userCompany" },
  { label: "user_global_roles", model: "userGlobalRole" },
  { label: "user_skill_domains", model: "userSkillDomain" },
  { label: "user_project_roles", model: "userProjectRole" },
  { label: "user_programs", model: "userProgram" },
  { label: "user_trainings", model: "userTraining" },
  { label: "training_skill_domains", model: "trainingSkillDomain" },
  { label: "sessions", model: "session" },
  { label: "session_trainers", model: "sessionTrainer" },
  { label: "trainer_unavailabilities", model: "trainerUnavailability" },
  { label: "session_participants", model: "sessionParticipant" },
  { label: "training_posts", model: "trainingPost" },
  { label: "training_post_reactions", model: "trainingPostReaction" },
  { label: "training_post_attachments", model: "trainingPostAttachment" },
  { label: "documents", model: "document" },
  { label: "reports", model: "report" },
  { label: "feedbacks", model: "feedback" },
  { label: "certificates", model: "certificate" },
  { label: "otp_codes", model: "otpCode" },
];

async function copyTable(local, remote, { label, model }) {
  const rows = await local[model].findMany();
  console.log(`📦 ${rows.length} ${label}`);

  if (rows.length === 0) {
    return { label, local: 0, inserted: 0 };
  }

  const { count } = await remote[model].createMany({
    data: rows,
    skipDuplicates: true,
  });

  console.log(`✅ ${label} — ${count} ligne(s) insérée(s)`);
  return { label, local: rows.length, inserted: count };
}

async function main() {
  console.log("🚀 Copie locale → Neon");
  console.log(`   Source : ${maskDbUrl(LOCAL_DB)}`);
  console.log(`   Cible  : ${maskDbUrl(REMOTE_DB)}`);
  console.log("");

  const summary = [];

  for (const table of COPY_ORDER) {
    summary.push(await copyTable(localPrisma, remotePrisma, table));
  }

  console.log("");
  console.log("📊 Résumé");
  for (const { label, local, inserted } of summary) {
    if (local === 0) continue;
    const status = inserted === local ? "OK" : `${inserted}/${local}`;
    console.log(`   ${label}: ${status}`);
  }

  console.log("");
  console.log("🎉 Copie terminée");
}

function maskDbUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "****";
    return parsed.toString();
  } catch {
    return "(url invalide)";
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant la copie :");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await localPrisma.$disconnect();
    await remotePrisma.$disconnect();
  });
