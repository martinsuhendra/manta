import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  validDays: z.number(),
  quota: z.number(),
  isActive: z.boolean(),
  features: z.array(z.string()),
  image: z.string().nullable(),
  paymentUrl: z.string().nullable(),
  whatIsIncluded: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z.object({
    memberships: z.number(),
  }),
});

export type Product = z.infer<typeof productSchema>;
