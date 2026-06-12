export const GLOBAL_ROLES = ["ADMIN", "PLANNER", "TRAINER"] as const;
export type GlobalRoleValue = (typeof GLOBAL_ROLES)[number];

export const GLOBAL_ROLE_LABELS: Record<GlobalRoleValue, string> = {
  ADMIN: "Admin",
  PLANNER: "Planner",
  TRAINER: "Formateur",
};

export function formatGlobalRoles(roles: string[]) {
  if (roles.length === 0) return "—";
  return roles.map((r) => GLOBAL_ROLE_LABELS[r as GlobalRoleValue] ?? r).join(", ");
}
