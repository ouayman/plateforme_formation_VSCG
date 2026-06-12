export function isDemoMode() {
  return (
    process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "true"
  );
}
