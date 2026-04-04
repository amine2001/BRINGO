export const USER_ROLES = ["super_user", "admin", "operator", "viewer"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function isSuperUserRole(role: string | null | undefined) {
  return role === "super_user";
}
