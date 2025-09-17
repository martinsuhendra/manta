import { z } from "zod";

import { USER_ROLES } from "@/lib/types";

export const userSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.MEMBER, USER_ROLES.TEACHER]),
  phoneNo: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z.object({
    memberships: z.number(),
  }),
});

export type User = z.infer<typeof userSchema>;
