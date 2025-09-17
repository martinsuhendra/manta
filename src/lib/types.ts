export const USER_ROLES = {
  ADMIN: "ADMIN",
  SUPERADMIN: "SUPERADMIN",
  MEMBER: "MEMBER",
  TEACHER: "TEACHER",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: "Admin",
  [USER_ROLES.SUPERADMIN]: "Super Admin",
  [USER_ROLES.MEMBER]: "Member",
  [USER_ROLES.TEACHER]: "Teacher",
};

export const DEFAULT_USER_ROLE: UserRole = USER_ROLES.MEMBER;

export function getRoleVariant(role: string) {
  switch (role) {
    case USER_ROLES.SUPERADMIN:
      return "destructive";
    case USER_ROLES.ADMIN:
      return "default";
    case USER_ROLES.TEACHER:
      return "secondary";
    case USER_ROLES.MEMBER:
      return "outline";
    default:
      return "outline";
  }
}
