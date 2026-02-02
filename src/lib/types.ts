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

export type RoleBadgeVariant = "destructive" | "default" | "secondary" | "outline" | "success";

export function getRoleVariant(role: string): RoleBadgeVariant {
  switch (role) {
    case USER_ROLES.SUPERADMIN:
      return "destructive";
    case USER_ROLES.ADMIN:
      return "default";
    case USER_ROLES.TEACHER:
      return "secondary";
    case USER_ROLES.MEMBER:
      return "success";
    default:
      return "outline";
  }
}
