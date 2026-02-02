import { USER_ROLES, UserRole } from "@/lib/types";

export function getAvailableRoles(
  mode: "add" | "edit",
  canCreateSuperAdmin: boolean,
  canEditRoles: boolean,
  currentRole?: UserRole,
): UserRole[] {
  if (mode === "add") {
    const baseRoles: UserRole[] = [USER_ROLES.MEMBER, USER_ROLES.TEACHER, USER_ROLES.ADMIN];
    if (canCreateSuperAdmin) {
      baseRoles.push(USER_ROLES.SUPERADMIN);
    }
    return baseRoles;
  }

  // For edit mode
  if (!canEditRoles) {
    return currentRole ? [currentRole] : [USER_ROLES.MEMBER];
  }
  return [USER_ROLES.MEMBER, USER_ROLES.TEACHER, USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN];
}
