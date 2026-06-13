#!/usr/bin/env node
/**
 * Audit local des requêtes Prisma typiques (navigation).
 * Usage: node scripts/prisma-audit.mjs
 */
import { PrismaClient } from "@prisma/client";
import { performance } from "node:perf_hooks";

const WARN_MS = 300;
const SLOW_MS = 1000;

const prisma = new PrismaClient({ log: ["error"] });

async function timed(label, fn) {
  const start = performance.now();
  const result = await fn();
  const ms = Math.round(performance.now() - start);
  const tier = ms >= SLOW_MS ? "1000ms+" : ms >= WARN_MS ? "300ms+" : "ok";
  return { label, ms, tier, result };
}

async function main() {
  const user = await prisma.user.findFirst({
    select: { id: true },
  });
  if (!user) {
    console.error("Aucun utilisateur en base — lancez npm run db:seed");
    process.exit(1);
  }

  const training = await prisma.training.findFirst({
    select: { id: true, programId: true, program: { select: { projectId: true } } },
  });

  const project = await prisma.project.findFirst({ select: { id: true } });

  const checks = [];

  checks.push(
    await timed("getCurrentUser-like (user + roles)", async () => {
      const u = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          type: true,
          companyId: true,
          avatarUrl: true,
          company: { select: { id: true, name: true, type: true, logoUrl: true } },
          globalRoles: { select: { role: true } },
          companies: { select: { company: { select: { id: true, name: true, type: true } } } },
        },
      });
      const roles = await prisma.userProjectRole.findMany({
        where: { userId: user.id },
        select: { projectId: true, role: true },
      });
      return { u, roles };
    })
  );

  checks.push(
    await timed("platformSettings", () =>
      prisma.platformSettings.findUnique({ where: { id: "default" } })
    )
  );

  if (project) {
    checks.push(
      await timed("project detail (programs+locations+roles)", () =>
        prisma.project.findUnique({
          where: { id: project.id },
          select: {
            id: true,
            name: true,
            company: { select: { id: true, name: true } },
            programs: {
              orderBy: { orderIndex: "asc" },
              select: { _count: { select: { trainings: true, participants: true } } },
            },
            locations: { orderBy: { name: "asc" }, select: { id: true, name: true } },
            signatories: { orderBy: { name: "asc" }, select: { id: true, name: true } },
            projectRoles: {
              where: { role: "COORDINATOR" },
              select: {
                user: { select: { id: true, firstName: true, lastName: true, email: true, type: true } },
              },
            },
          },
        })
      )
    );
  }

  if (training) {
    checks.push(
      await timed("training page core (training+sessions)", () =>
        prisma.training.findUnique({
          where: { id: training.id },
          select: {
            id: true,
            title: true,
            programId: true,
            program: {
              select: {
                id: true,
                name: true,
                projectId: true,
                project: { select: { id: true, name: true, company: { select: { name: true } } } },
              },
            },
            sessions: {
              orderBy: { startDatetime: "asc" },
              select: {
                id: true,
                startDatetime: true,
                endDatetime: true,
                status: true,
                location: { select: { name: true, address: true, instructions: true } },
                trainer: { select: { firstName: true, lastName: true } },
                trainers: { select: { user: { select: { firstName: true, lastName: true } } } },
                participants: {
                  where: { userId: user.id },
                  select: { attendanceStatus: true },
                },
              },
            },
          },
        })
      )
    );

    checks.push(
      await timed("training posts feed", () =>
        prisma.trainingPost.findMany({
          where: { trainingId: training.id },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            type: true,
            text: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                company: { select: { name: true, type: true } },
              },
            },
            attachments: { select: { id: true, fileUrl: true, fileName: true, createdAt: true } },
            reactions: { select: { userId: true, type: true } },
          },
        })
      )
    );

    checks.push(
      await timed("planning sessions list", () =>
        prisma.session.findMany({
          where: { status: { not: "cancelled" } },
          orderBy: { startDatetime: "asc" },
          take: 50,
          select: {
            id: true,
            startDatetime: true,
            endDatetime: true,
            training: {
              select: {
                id: true,
                title: true,
                program: {
                  select: {
                    name: true,
                    project: {
                      select: { id: true, name: true, company: { select: { name: true } } },
                    },
                  },
                },
              },
            },
          },
        })
      )
    );
  }

  console.log("\n=== Prisma audit (local) ===\n");
  for (const row of checks.sort((a, b) => b.ms - a.ms)) {
    console.log(`${row.tier.padEnd(8)} ${String(row.ms).padStart(5)}ms  ${row.label}`);
  }

  const warn = checks.filter((c) => c.ms >= WARN_MS);
  const slow = checks.filter((c) => c.ms >= SLOW_MS);
  console.log(`\nTotal: ${checks.length} checks | >=300ms: ${warn.length} | >=1000ms: ${slow.length}`);
  console.log("\nEn dev, naviguez l'app : les logs [prisma:300ms+] / [prisma:1000ms+] s'affichent dans le terminal.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
