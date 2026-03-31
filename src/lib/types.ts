export const MEMBERSHIP_STATUS = {
  ACTIVE: "ACTIVE",
  FREEZED: "FREEZED",
  EXPIRED: "EXPIRED",
  SUSPENDED: "SUSPENDED",
  PENDING: "PENDING",
} as const;

export type MembershipStatus = (typeof MEMBERSHIP_STATUS)[keyof typeof MEMBERSHIP_STATUS];

export const USER_ROLES = {
  ADMIN: "ADMIN",
  SUPERADMIN: "SUPERADMIN",
  DEVELOPER: "DEVELOPER",
  MEMBER: "MEMBER",
  TEACHER: "TEACHER",
};

export type UserRole = string;

export const USER_ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.ADMIN]: "Admin",
  [USER_ROLES.SUPERADMIN]: "Super Admin",
  [USER_ROLES.DEVELOPER]: "Developer",
  [USER_ROLES.MEMBER]: "Member",
  [USER_ROLES.TEACHER]: "Teacher",
};

export const DEFAULT_USER_ROLE: UserRole = USER_ROLES.MEMBER;

export type RoleBadgeVariant = "destructive" | "default" | "secondary" | "outline" | "success";

export function getRoleVariant(role: string): RoleBadgeVariant {
  switch (role) {
    case USER_ROLES.DEVELOPER:
      return "destructive";
    case USER_ROLES.SUPERADMIN:
      return "destructive";
    case USER_ROLES.ADMIN:
      return "default";
    case USER_ROLES.TEACHER:
      return "success";
    case USER_ROLES.MEMBER:
      return "secondary";
    default:
      return "outline";
  }
}

export function getUserRoleLabel(role: string): string {
  switch (role) {
    case USER_ROLES.ADMIN:
      return USER_ROLE_LABELS[USER_ROLES.ADMIN];
    case USER_ROLES.SUPERADMIN:
      return USER_ROLE_LABELS[USER_ROLES.SUPERADMIN];
    case USER_ROLES.DEVELOPER:
      return USER_ROLE_LABELS[USER_ROLES.DEVELOPER];
    case USER_ROLES.MEMBER:
      return USER_ROLE_LABELS[USER_ROLES.MEMBER];
    case USER_ROLES.TEACHER:
      return USER_ROLE_LABELS[USER_ROLES.TEACHER];
    default:
      return role;
  }
}
