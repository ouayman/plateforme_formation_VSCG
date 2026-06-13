import "server-only";

import { PrismaClient } from "@prisma/client";

const SLOW_QUERY_MS = Number(process.env.SLOW_QUERY_MS ?? 500);

function shouldLogSlowQueries() {
  if (process.env.LOG_SLOW_QUERIES === "true") return true;
  if (process.env.LOG_SLOW_QUERIES === "false") return false;
  return process.env.NODE_ENV === "development";
}

function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (!shouldLogSlowQueries()) {
    return base;
  }

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = performance.now();
          const result = await query(args);
          const durationMs = performance.now() - start;

          if (durationMs >= SLOW_QUERY_MS) {
            const argsPreview = JSON.stringify(args);
            console.warn(
              `[prisma:slow] ${model}.${operation} ${Math.round(durationMs)}ms`,
              argsPreview.length > 200 ? `${argsPreview.slice(0, 200)}…` : argsPreview
            );
          }

          return result;
        },
      },
    },
  });
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
