export const USER_ROLES = ["super_user", "admin", "operator", "viewer"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function isViewerRole(role: string | null | undefined) {
  return role === "viewer";
}

export function isAdminRole(role: string | null | undefined) {
  return role === "admin";
}

export function isSuperUserRole(role: string | null | undefined) {
  return role === "super_user";
}

export function canAccessDashboardHref(
  role: string | null | undefined,
  href: string,
) {
  if (isViewerRole(role)) {
    return (
      href === "/dashboard" ||
      href === "/dashboard/stores" ||
      href === "/dashboard/workflow" ||
      href === "/dashboard/settings"
    );
  }

  if (isAdminRole(role)) {
    return href !== "/dashboard/access" && href !== "/dashboard/api-config";
  }

  return true;
}

export function canManageStores(role: string | null | undefined) {
  return !isViewerRole(role);
}

export function canDeleteStores(role: string | null | undefined) {
  return !isViewerRole(role) && !isAdminRole(role);
}

export function canEditWorkflow(role: string | null | undefined) {
  return !isViewerRole(role);
}

export function canAccessUserManagement(role: string | null | undefined) {
  return !isViewerRole(role) && !isAdminRole(role);
}

export function canAccessApiConfig(role: string | null | undefined) {
  return !isViewerRole(role) && !isAdminRole(role);
}
