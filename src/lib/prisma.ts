import "server-only";

import { PrismaClient } from "@prisma/client";
import {
  isPrismaQueryLoggingEnabled,
  recordPrismaQuery,
} from "@/lib/prisma-instrumentation";

function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (!isPrismaQueryLoggingEnabled()) {
    return base;
  }

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = performance.now();
          const result = await query(args);
          recordPrismaQuery(model, operation, performance.now() - start);
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
