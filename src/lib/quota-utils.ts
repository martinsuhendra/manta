import type { Prisma } from "@prisma/client";

interface ProductItemForQuota {
  id: string;
  quotaType: string;
  quotaValue?: number | null;
  quotaPoolId?: string | null;
  quotaPool?: { totalQuota: number } | null;
}

interface QuotaUsageRecord {
  productItemId?: string | null;
  quotaPoolId?: string | null;
  usedCount: number;
}

export function calculateRemainingQuota(productItem: ProductItemForQuota, quotaUsage: QuotaUsageRecord[]): number {
  if (productItem.quotaType === "FREE") return Infinity;

  if (productItem.quotaType === "INDIVIDUAL") {
    const usage = quotaUsage.find((u) => u.productItemId === productItem.id);
    return (productItem.quotaValue ?? 0) - (usage?.usedCount ?? 0);
  }

  if (productItem.quotaType === "SHARED" && productItem.quotaPoolId) {
    const usage = quotaUsage.find((u) => u.quotaPoolId === productItem.quotaPoolId);
    return (productItem.quotaPool?.totalQuota ?? 0) - (usage?.usedCount ?? 0);
  }

  return Infinity;
}

export function checkQuotaAvailability(productItem: ProductItemForQuota, quotaUsage: QuotaUsageRecord[]): boolean {
  return calculateRemainingQuota(productItem, quotaUsage) > 0;
}

interface MembershipForQuota {
  product: {
    productItems: ProductItemForQuota[];
  };
  quotaUsage: QuotaUsageRecord[];
}

export function getMembershipRemainingQuota(membership: MembershipForQuota): number | null {
  const items = membership.product.productItems;
  if (items.length === 0) return null;

  let minRemaining: number | null = null;
  for (const item of items) {
    const remaining = calculateRemainingQuota(item, membership.quotaUsage);
    if (remaining === Infinity) return null;
    if (minRemaining === null || remaining < minRemaining) minRemaining = remaining;
  }
  return minRemaining;
}

// --- Transaction helpers (require Prisma tx client) ---

interface DeductQuotaParams {
  tx: Prisma.TransactionClient;
  membershipId: string;
  productItem: {
    id: string;
    quotaType: string;
    quotaPoolId?: string | null;
  };
}

export async function deductQuota({ tx, membershipId, productItem }: DeductQuotaParams) {
  if (productItem.quotaType === "INDIVIDUAL") {
    await tx.membershipQuotaUsage.upsert({
      where: {
        membershipId_productItemId: {
          membershipId,
          productItemId: productItem.id,
        },
      },
      create: { membershipId, productItemId: productItem.id, usedCount: 1 },
      update: { usedCount: { increment: 1 } },
    });
    return;
  }

  if (productItem.quotaType === "SHARED" && productItem.quotaPoolId) {
    await tx.membershipQuotaUsage.upsert({
      where: {
        membershipId_quotaPoolId: {
          membershipId,
          quotaPoolId: productItem.quotaPoolId,
        },
      },
      create: { membershipId, quotaPoolId: productItem.quotaPoolId, usedCount: 1 },
      update: { usedCount: { increment: 1 } },
    });
  }
}

interface RestoreQuotaParams {
  tx: Prisma.TransactionClient;
  membershipId: string;
  productItem: {
    id: string;
    quotaType: string;
    quotaPoolId?: string | null;
  };
}

export async function restoreQuota({ tx, membershipId, productItem }: RestoreQuotaParams) {
  if (productItem.quotaType === "INDIVIDUAL") {
    const usage = await tx.membershipQuotaUsage.findUnique({
      where: {
        membershipId_productItemId: {
          membershipId,
          productItemId: productItem.id,
        },
      },
    });
    if (usage && usage.usedCount > 0) {
      await tx.membershipQuotaUsage.update({
        where: {
          membershipId_productItemId: {
            membershipId,
            productItemId: productItem.id,
          },
        },
        data: { usedCount: { decrement: 1 } },
      });
    }
    return;
  }

  if (productItem.quotaType === "SHARED" && productItem.quotaPoolId) {
    const usage = await tx.membershipQuotaUsage.findUnique({
      where: {
        membershipId_quotaPoolId: {
          membershipId,
          quotaPoolId: productItem.quotaPoolId,
        },
      },
    });
    if (usage && usage.usedCount > 0) {
      await tx.membershipQuotaUsage.update({
        where: {
          membershipId_quotaPoolId: {
            membershipId,
            quotaPoolId: productItem.quotaPoolId,
          },
        },
        data: { usedCount: { decrement: 1 } },
      });
    }
  }
}
