#!/usr/bin/env node
/**
 * P0 — mesure TTFB prod locale (npm run start).
 * Usage: npm run perf:ttfb
 * Prérequis: serveur sur BASE_URL (défaut http://localhost:3000)
 */
import { PrismaClient } from "@prisma/client";
import { performance } from "node:perf_hooks";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const WARN_MS = Number(process.env.TTFB_WARN_MS ?? 500);
const SLOW_MS = Number(process.env.TTFB_SLOW_MS ?? 1500);
const SESSION_COOKIE = "vsc_session";

const prisma = new PrismaClient({ log: ["error"] });

async function waitForServer(maxMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${BASE_URL}/login`, { redirect: "manual" });
      if (res.status < 500) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function parseSetCookie(setCookie) {
  if (!setCookie) return null;
  const first = Array.isArray(setCookie) ? setCookie[0] : setCookie.split(",")[0];
  const match = first.match(/^([^=]+)=([^;]*)/);
  if (!match) return null;
  return `${match[1]}=${match[2]}`;
}

async function demoLoginAdmin() {
  const usersRes = await fetch(`${BASE_URL}/api/auth/demo-users`);
  if (!usersRes.ok) {
    return { ok: false, reason: `demo-users HTTP ${usersRes.status}` };
  }
  const users = await usersRes.json();
  const admin =
    users.find((u) => u.globalRoles?.includes("ADMIN")) ??
    users.find((u) => u.type === "internal") ??
    users[0];
  if (!admin?.id) {
    return { ok: false, reason: "aucun utilisateur demo" };
  }

  const loginRes = await fetch(`${BASE_URL}/api/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: admin.id }),
  });
  if (!loginRes.ok) {
    return { ok: false, reason: `demo-login HTTP ${loginRes.status}` };
  }

  const setCookie = loginRes.headers.getSetCookie?.() ?? loginRes.headers.get("set-cookie");
  const cookie = parseSetCookie(setCookie);
  if (!cookie?.startsWith(`${SESSION_COOKIE}=`)) {
    return { ok: false, reason: "cookie session absent (DEMO_MODE ?)" };
  }
  return { ok: true, cookie, userId: admin.id };
}

async function measurePath(path, cookie) {
  const url = `${BASE_URL}${path}`;
  const results = [];

  for (let run = 1; run <= 2; run += 1) {
    const start = performance.now();
    const res = await fetch(url, {
      redirect: "manual",
      headers: cookie ? { Cookie: cookie } : {},
    });
    const ttfbMs = Math.round(performance.now() - start);
    const body = await res.text();
    results.push({
      run,
      status: res.status,
      ttfbMs,
      bytes: body.length,
      location: res.headers.get("location"),
    });
  }

  return results;
}

function tier(ms) {
  if (ms >= SLOW_MS) return "1500ms+";
  if (ms >= WARN_MS) return "500ms+";
  return "ok";
}

async function resolvePaths() {
  const [project, training] = await Promise.all([
    prisma.project.findFirst({ select: { id: true } }),
    prisma.training.findFirst({ select: { id: true } }),
  ]);

  const paths = [
    "/login",
    "/projects",
    "/my-trainings",
    "/admin/trainers",
    "/admin/users",
    "/planning",
  ];
  if (project) paths.push(`/projects/${project.id}`);
  if (training) paths.push(`/trainings/${training.id}`);
  return paths;
}

async function main() {
  console.log(`\n=== P0 TTFB (prod locale) — ${BASE_URL} ===\n`);

  const up = await waitForServer();
  if (!up) {
    console.error("Serveur injoignable. Lance: npm run build && npm run start");
    process.exit(1);
  }

  const paths = await resolvePaths();
  const auth = await demoLoginAdmin();

  if (!auth.ok) {
    console.warn(`Auth demo: ${auth.reason} — mesures sans session (redirect attendu)\n`);
  } else {
    console.log(`Session: admin demo (${auth.userId})\n`);
  }

  const cookie = auth.ok ? auth.cookie : null;
  const rows = [];

  console.log("Route".padEnd(42) + "Run  Status  TTFB     Tier     Note");
  console.log("-".repeat(88));

  for (const path of paths) {
    const runs = await measurePath(path, cookie);
    for (const r of runs) {
      const note =
        !cookie && r.status >= 300 && r.status < 400
          ? "redirect (non auth)"
          : r.status === 200
            ? "html"
            : r.status >= 300 && r.status < 400
              ? `→ ${r.location ?? "?"}`
              : `HTTP ${r.status}`;
      rows.push({ path, ...r, note, tier: tier(r.ttfbMs) });
      console.log(
        `${path.padEnd(42)}${String(r.run).padStart(3)}  ${String(r.status).padStart(5)}  ${String(r.ttfbMs).padStart(5)}ms  ${tier(r.ttfbMs).padEnd(8)} ${note}`
      );
    }
  }

  const authed = rows.filter((r) => r.status === 200);
  const warm = authed.filter((r) => r.run === 2);
  const cold = authed.filter((r) => r.run === 1);
  const slowWarm = warm.filter((r) => r.ttfbMs >= WARN_MS);
  const slowCold = cold.filter((r) => r.ttfbMs >= WARN_MS);

  console.log("\n--- Synthèse (réponses 200 authentifiées) ---");
  console.log(`Routes mesurées: ${paths.length} | cold 200: ${cold.length} | warm 200: ${warm.length}`);
  console.log(`TTFB warm >= ${WARN_MS}ms: ${slowWarm.length}/${warm.length || 0}`);
  console.log(`TTFB cold >= ${WARN_MS}ms: ${slowCold.length}/${cold.length || 0}`);

  if (warm.length > 0) {
    const avgWarm = Math.round(warm.reduce((s, r) => s + r.ttfbMs, 0) / warm.length);
    const maxWarm = Math.max(...warm.map((r) => r.ttfbMs));
    console.log(`TTFB warm moyen: ${avgWarm}ms | max: ${maxWarm}ms`);
  }

  console.log("\nInterprétation:");
  console.log(`- warm TTFB > ${WARN_MS}ms → serveur (layout/loaders/SQL)`);
  console.log("- warm TTFB ok mais navigateur lent → client (JS/hydration) — voir Network DOMContentLoaded");
  console.log("- cold >> warm → 1ère requête process/connexion\n");

  if (!auth.ok) {
    console.log("Pour mesures authentifiées: DEMO_MODE=true + npm run db:seed\n");
    process.exit(2);
  }

  process.exit(slowWarm.length > 0 ? 1 : 0);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
