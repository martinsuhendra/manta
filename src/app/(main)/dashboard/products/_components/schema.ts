import { z } from "zod";

// Quota Type enum
export const quotaTypeSchema = z.enum(["INDIVIDUAL", "SHARED", "FREE"]);
export type QuotaType = z.infer<typeof quotaTypeSchema>;

// Quota Pool schema
export const quotaPoolSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  totalQuota: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type QuotaPool = z.infer<typeof quotaPoolSchema>;

// Product Item schema
export const productItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  itemId: z.string(),
  quotaType: quotaTypeSchema,
  quotaValue: z.number().nullable(),
  quotaPoolId: z.string().nullable(),
  isActive: z.boolean(),
  order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  item: z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      duration: z.number(),
      capacity: z.number(),
      color: z.string().nullable(),
      image: z.string().nullable(),
    })
    .optional(),
  quotaPool: quotaPoolSchema.optional(),
});

export type ProductItem = z.infer<typeof productItemSchema>;

// Membership Quota Usage schema
export const membershipQuotaUsageSchema = z.object({
  id: z.string(),
  membershipId: z.string(),
  productItemId: z.string().nullable(),
  quotaPoolId: z.string().nullable(),
  usedCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MembershipQuotaUsage = z.infer<typeof membershipQuotaUsageSchema>;

// Enhanced Product schema
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  validDays: z.number(),
  isActive: z.boolean(),
  features: z.array(z.string()),
  image: z.string().nullable(),
  paymentUrl: z.string().nullable(),
  whatIsIncluded: z.string().nullable(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z.object({
    memberships: z.number(),
    transactions: z.number(),
    productItems: z.number().optional(),
    quotaPools: z.number().optional(),
  }),
  productItems: z.array(productItemSchema).optional(),
  quotaPools: z.array(quotaPoolSchema).optional(),
});

export type Product = z.infer<typeof productSchema>;

// Form schemas for creating/updating
export const createQuotaPoolSchema = z.object({
  name: z.string().min(1, "Pool name is required"),
  description: z.string().optional(),
  totalQuota: z.number().min(1, "Total quota must be at least 1"),
  isActive: z.boolean().default(true),
});

export type CreateQuotaPoolForm = z.infer<typeof createQuotaPoolSchema>;

export const createProductItemSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quotaType: quotaTypeSchema,
  quotaValue: z.number().min(0).optional(),
  quotaPoolId: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().default(0),
});

export type CreateProductItemForm = z.infer<typeof createProductItemSchema>;

export const updateProductItemSchema = z.object({
  quotaType: quotaTypeSchema.optional(),
  quotaValue: z.number().min(0).nullable().optional(),
  quotaPoolId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
});

export type UpdateProductItemForm = z.infer<typeof updateProductItemSchema>;
