import { AsyncLocalStorage } from "node:async_hooks";

export type PrismaQueryRecord = {
  model: string;
  operation: string;
  durationMs: number;
};

type PrismaRequestStore = {
  label: string;
  startedAt: number;
  queries: PrismaQueryRecord[];
};

const WARN_MS = Number(process.env.PRISMA_WARN_MS ?? 300);
const SLOW_MS = Number(process.env.PRISMA_SLOW_MS ?? 1000);

const requestStore = new AsyncLocalStorage<PrismaRequestStore>();

export function isPrismaQueryLoggingEnabled() {
  if (process.env.LOG_PRISMA_QUERIES === "true") return true;
  if (process.env.LOG_PRISMA_QUERIES === "false") return false;
  return process.env.NODE_ENV === "development";
}

export function runWithPrismaInstrumentation<T>(
  label: string,
  fn: () => T
): T {
  if (!isPrismaQueryLoggingEnabled()) {
    return fn();
  }

  return requestStore.run(
    {
      label,
      startedAt: performance.now(),
      queries: [],
    },
    fn
  );
}

export async function runWithPrismaInstrumentationAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!isPrismaQueryLoggingEnabled()) {
    return fn();
  }

  return requestStore.run(
    {
      label,
      startedAt: performance.now(),
      queries: [],
    },
    fn
  );
}

export function recordPrismaQuery(model: string, operation: string, durationMs: number) {
  const store = requestStore.getStore();
  if (!store) return;

  store.queries.push({
    model,
    operation,
    durationMs: Math.round(durationMs * 10) / 10,
  });

  const tag = `${model}.${operation}`;
  const rounded = Math.round(durationMs);

  if (durationMs >= SLOW_MS) {
    console.error(`[prisma:1000ms+] ${tag} ${rounded}ms`);
  } else if (durationMs >= WARN_MS) {
    console.warn(`[prisma:300ms+] ${tag} ${rounded}ms`);
  } else if (process.env.LOG_PRISMA_ALL === "true") {
    console.log(`[prisma] ${tag} ${rounded}ms`);
  }
}

export function logPrismaRequestSummary() {
  const store = requestStore.getStore();
  if (!store || store.queries.length === 0) return;

  const totalMs = Math.round(performance.now() - store.startedAt);
  const dbMs = Math.round(store.queries.reduce((sum, q) => sum + q.durationMs, 0));
  const warn = store.queries.filter((q) => q.durationMs >= WARN_MS);
  const slow = store.queries.filter((q) => q.durationMs >= SLOW_MS);

  console.log(
    `[prisma:request] ${store.label} | ${store.queries.length} queries | db ${dbMs}ms | total ${totalMs}ms | >=300ms: ${warn.length} | >=1000ms: ${slow.length}`
  );

  if (warn.length > 0) {
    console.warn(
      `[prisma:request:300ms+] ${store.label}`,
      warn.map((q) => `${q.model}.${q.operation}(${Math.round(q.durationMs)}ms)`).join(", ")
    );
  }

  if (slow.length > 0) {
    console.error(
      `[prisma:request:1000ms+] ${store.label}`,
      slow.map((q) => `${q.model}.${q.operation}(${Math.round(q.durationMs)}ms)`).join(", ")
    );
  }
}

export { WARN_MS as PRISMA_WARN_MS, SLOW_MS as PRISMA_SLOW_MS };
