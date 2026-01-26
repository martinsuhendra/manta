import { z } from "zod";

import { USER_ROLES } from "@/lib/types";

export const memberSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.MEMBER, USER_ROLES.TEACHER]),
  phoneNo: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z.object({
    memberships: z.number(),
    transactions: z.number(),
    bookings: z.number(),
  }),
});

export type Member = z.infer<typeof memberSchema>;

export const memberDetailsSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.MEMBER, USER_ROLES.TEACHER]),
  phoneNo: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  memberships: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      joinDate: z.string(),
      expiredAt: z.string(),
      createdAt: z.string(),
      product: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        validDays: z.number(),
      }),
      transaction: z
        .object({
          id: z.string(),
          status: z.string(),
          amount: z.number(),
          currency: z.string(),
          paidAt: z.string().nullable(),
          createdAt: z.string(),
        })
        .nullable(),
    }),
  ),
  transactions: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      amount: z.number(),
      currency: z.string(),
      paymentMethod: z.string().nullable(),
      paymentProvider: z.string().nullable(),
      paidAt: z.string().nullable(),
      createdAt: z.string(),
      product: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
      }),
    }),
  ),
  bookings: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      createdAt: z.string(),
      classSession: z.object({
        id: z.string(),
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        status: z.string(),
        item: z.object({
          id: z.string(),
          name: z.string(),
        }),
      }),
      membership: z.object({
        id: z.string(),
        product: z.object({
          id: z.string(),
          name: z.string(),
        }),
      }),
    }),
  ),
  _count: z.object({
    memberships: z.number(),
    transactions: z.number(),
    bookings: z.number(),
  }),
});

export type MemberDetails = z.infer<typeof memberDetailsSchema>;
