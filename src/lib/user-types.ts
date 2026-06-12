import { UserType } from "@prisma/client";

export const USER_TYPE_LABELS: Record<UserType, string> = {
  internal: "VSCG",
  client: "Client",
};

export function formatUserType(type: UserType | string) {
  return USER_TYPE_LABELS[type as UserType] ?? type;
}

export function isVscgUser(type: UserType | string) {
  return type === UserType.internal || type === "internal";
}
