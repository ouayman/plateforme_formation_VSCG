/** Activé uniquement si DEMO_MODE=true (local, Vercel Preview, etc.). Toujours false en prod réelle. */
export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}
