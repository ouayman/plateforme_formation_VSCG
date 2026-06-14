#!/usr/bin/env node
/**
 * Baseline perf P0 — simule les lectures Prisma par route (local).
 * Usage: npm run perf:routes
 */
import { PrismaClient } from "@prisma/client";
import { performance } from "node:perf_hooks";

const WARN_MS = Number(process.env.PRISMA_WARN_MS ?? 300);
const SLOW_MS = Number(process.env.PRISMA_SLOW_MS ?? 1000);

const prisma = new PrismaClient({ log: ["error"] });

async function timed(label, queryCount, fn) {
  const start = performance.now();
  await fn();
  const ms = Math.round(performance.now() - start);
  const tier = ms >= SLOW_MS ? "1000ms+" : ms >= WARN_MS ? "300ms+" : "ok";
  return { label, ms, tier, queryCount };
}

async function main() {
  const user = await prisma.user.findFirst({
    select: { id: true, companyId: true },
  });
  const training = await prisma.training.findFirst({
    select: { id: true, programId: true, program: { select: { projectId: true } } },
  });
  const project = await prisma.project.findFirst({ select: { id: true } });

  if (!user) {
    console.error("Aucun utilisateur — npm run db:seed");
    process.exit(1);
  }

  const routes = [];

  routes.push(
    await timed("P0 demo-users (users + orgName parallèle)", 2, async () => {
      await Promise.all([
        prisma.user.findMany({
          orderBy: [{ type: "asc" }, { lastName: "asc" }],
          take: 50,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            type: true,
            company: { select: { name: true } },
            globalRoles: { select: { role: true } },
            projectRoles: { select: { role: true } },
            _count: { select: { programs: true } },
          },
        }),
        prisma.platformSettings.findUnique({
          where: { id: "default" },
          select: { organizationName: true },
        }),
      ]);
    })
  );

  routes.push(
    await timed("P0 auth shell (user + roles + settings)", 3, async () => {
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
      await Promise.all([
        prisma.userProjectRole.findMany({
          where: { userId: user.id },
          select: { projectId: true, role: true },
        }),
        prisma.platformSettings.findUnique({ where: { id: "default" } }),
      ]);
      return u;
    })
  );

  routes.push(
    await timed("P0 /projects (list active + companies)", 2, async () => {
      await Promise.all([
        prisma.project.findMany({
          orderBy: { startDate: "desc" },
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            deletedAt: true,
            company: { select: { name: true } },
            _count: { select: { programs: true } },
          },
        }),
        prisma.company.findMany({
          where: { type: "client" },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
      ]);
    })
  );

  if (training) {
    routes.push(
      await timed("P0 /trainings/[id] core", 1, () =>
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
                project: {
                  select: { id: true, name: true, company: { select: { name: true } } },
                },
              },
            },
            participants: {
              where: { userId: user.id, deletedAt: null },
              select: { id: true },
              take: 1,
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
            certificates: {
              where: { userId: user.id },
              select: { status: true },
            },
          },
        })
      )
    );

    routes.push(
      await timed("P0 /trainings/[id] secondary batch (staff)", 5, async () => {
        await Promise.all([
          prisma.feedback.findMany({
            where: { trainingId: training.id },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: { select: { firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.user.findMany({
            where: { globalRoles: { some: { role: "TRAINER" } } },
            select: { id: true, firstName: true, lastName: true },
            orderBy: { lastName: "asc" },
          }),
          prisma.projectLocation.findMany({
            where: { projectId: training.program.projectId },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          }),
          prisma.certificate.findMany({
            where: { trainingId: training.id },
            select: {
              userId: true,
              status: true,
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          }),
          prisma.sessionParticipant.findMany({
            where: {
              session: { trainingId: training.id, status: { not: "cancelled" } },
            },
            select: { userId: true, attendanceStatus: true },
          }),
        ]);
      })
    );
  }

  routes.push(
    await timed("P0 /planning participant sessions", 1, async () => {
        await prisma.userTraining.findMany({
          where: { userId: user.id, deletedAt: null },
          select: {
            training: {
              select: {
                id: true,
                title: true,
                program: { select: { name: true, project: { select: { id: true } } } },
                sessions: {
                  where: { status: { not: "cancelled" } },
                  orderBy: { startDatetime: "asc" },
                  select: {
                    id: true,
                    startDatetime: true,
                    endDatetime: true,
                    location: { select: { name: true } },
                  },
                },
              },
            },
          },
        });
    })
  );

  routes.push(
    await timed("P0 /planning staff sessions", 1, () =>
        prisma.session.findMany({
          where: { status: { not: "cancelled" } },
          orderBy: { startDatetime: "asc" },
          take: 100,
          select: {
            id: true,
            startDatetime: true,
            endDatetime: true,
            ...{
              location: { select: { name: true } },
              training: {
                select: {
                  id: true,
                  title: true,
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
                },
              },
            },
          },
        })
    )
  );

  if (project) {
    routes.push(
      await timed("P0 /projects/[id] detail (1 query, no duplicate access)", 1, () =>
        prisma.project.findUnique({
          where: { id: project.id },
          select: {
            id: true,
            name: true,
            companyId: true,
            startDate: true,
            endDate: true,
            deletedAt: true,
            company: { select: { id: true, name: true } },
            programs: {
              orderBy: { orderIndex: "asc" },
              select: {
                id: true,
                name: true,
                orderIndex: true,
                _count: { select: { trainings: true, participants: true } },
              },
            },
            locations: {
              orderBy: { name: "asc" },
              select: { id: true, name: true, address: true },
            },
            signatories: {
              orderBy: { name: "asc" },
              select: { id: true, name: true, title: true },
            },
            projectRoles: {
              where: { role: "COORDINATOR" },
              select: {
                id: true,
                userId: true,
                canAddParticipants: true,
                canPublishFeed: true,
                canUnlockCertificates: true,
                canManageSessions: true,
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true, type: true },
                },
              },
              orderBy: { user: { lastName: "asc" } },
            },
          },
        })
      )
    );

    routes.push(
      await timed("P0 /projects/[id] editor data (staff, parallèle)", 2, async () => {
        const p = await prisma.project.findUnique({
          where: { id: project.id },
          select: { companyId: true },
        });
        if (!p) return;
        await Promise.all([
          prisma.user.findMany({
            where: { type: "client", companyId: p.companyId },
            select: { id: true, firstName: true, lastName: true, email: true },
            orderBy: { lastName: "asc" },
          }),
          prisma.company.findMany({
            where: { type: "client" },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          }),
        ]);
      })
    );
  }

  routes.push(
    await timed("P0 /projects list", 3, async () => {
      await prisma.project.count();
    })
  );

  console.log("\n=== Perf routes baseline (local SQL) ===\n");
  console.log("Route".padEnd(52) + "Queries  Time     Tier");
  console.log("-".repeat(78));

  let totalQueries = 0;
  for (const row of routes.sort((a, b) => b.ms - a.ms)) {
    totalQueries += row.queryCount;
    console.log(
      `${row.label.padEnd(52)}${String(row.queryCount).padStart(4)}   ${String(row.ms).padStart(5)}ms  ${row.tier}`
    );
  }

  const warn = routes.filter((r) => r.ms >= WARN_MS);
  const slow = routes.filter((r) => r.ms >= SLOW_MS);
  console.log(`\nRoutes: ${routes.length} | Requêtes simulées: ${totalQueries}`);
  console.log(`>=300ms: ${warn.length} | >=1000ms: ${slow.length}`);
  console.log("\nContrats JSON : docs/PERF_BASELINE.md");
  console.log("Preview prod : LOG_PRISMA_QUERIES=true sur Vercel\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
