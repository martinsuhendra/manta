/**
 * Same values as Prisma `TeacherFeeModel`. Defined here because `@prisma/client`'s
 * enum object can be undefined when API routes are bundled (e.g. Turbopack).
 */
export const TeacherFeeModel = {
  FLAT_PER_SESSION: "FLAT_PER_SESSION",
  PER_PARTICIPANT: "PER_PARTICIPANT",
} as const;

export type TeacherFeeModel = (typeof TeacherFeeModel)[keyof typeof TeacherFeeModel];
