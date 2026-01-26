import type { Prisma } from "@prisma/client";

interface RestoreQuotaParams {
  tx: Prisma.TransactionClient;
  booking: {
    membershipId: string;
  };
  productItem: {
    id: string;
    quotaType: string;
    quotaPoolId: string | null;
  };
}

export async function restoreQuota({ tx, booking, productItem }: RestoreQuotaParams) {
  if (productItem.quotaType === "INDIVIDUAL") {
    const quotaUsage = await tx.membershipQuotaUsage.findUnique({
      where: {
        membershipId_productItemId: {
          membershipId: booking.membershipId,
          productItemId: productItem.id,
        },
      },
    });

    if (quotaUsage && quotaUsage.usedCount > 0) {
      await tx.membershipQuotaUsage.update({
        where: {
          membershipId_productItemId: {
            membershipId: booking.membershipId,
            productItemId: productItem.id,
          },
        },
        data: {
          usedCount: {
            decrement: 1,
          },
        },
      });
    }
    return;
  }

  if (productItem.quotaType === "SHARED" && productItem.quotaPoolId) {
    const quotaUsage = await tx.membershipQuotaUsage.findUnique({
      where: {
        membershipId_quotaPoolId: {
          membershipId: booking.membershipId,
          quotaPoolId: productItem.quotaPoolId,
        },
      },
    });

    if (quotaUsage && quotaUsage.usedCount > 0) {
      await tx.membershipQuotaUsage.update({
        where: {
          membershipId_quotaPoolId: {
            membershipId: booking.membershipId,
            quotaPoolId: productItem.quotaPoolId,
          },
        },
        data: {
          usedCount: {
            decrement: 1,
          },
        },
      });
    }
  }
}

interface CheckQuotaAvailabilityParams {
  productItem: {
    id: string;
    quotaType: string;
    quotaValue: number | null;
    quotaPoolId: string | null;
    quotaPool?: {
      totalQuota: number;
    } | null;
  };
  quotaUsage: Array<{
    productItemId: string | null;
    quotaPoolId: string | null;
    usedCount: number;
  }>;
}

export function checkQuotaAvailability({ productItem, quotaUsage }: CheckQuotaAvailabilityParams): boolean {
  if (productItem.quotaType === "INDIVIDUAL") {
    const usage = quotaUsage.find((usage) => usage.productItemId === productItem.id);
    const usedCount = usage?.usedCount || 0;
    const quotaValue = productItem.quotaValue || 0;
    return usedCount < quotaValue;
  }

  if (productItem.quotaType === "SHARED" && productItem.quotaPoolId) {
    const usage = quotaUsage.find((usage) => usage.quotaPoolId === productItem.quotaPoolId);
    const usedCount = usage?.usedCount || 0;
    const totalQuota = productItem.quotaPool?.totalQuota || 0;
    return usedCount < totalQuota;
  }

  // FREE quota type always has quota
  return true;
}

interface DeductQuotaParams {
  tx: Prisma.TransactionClient;
  membershipId: string;
  productItem: {
    id: string;
    quotaType: string;
    quotaPoolId: string | null;
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
      create: {
        membershipId,
        productItemId: productItem.id,
        usedCount: 1,
      },
      update: {
        usedCount: {
          increment: 1,
        },
      },
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
      create: {
        membershipId,
        quotaPoolId: productItem.quotaPoolId,
        usedCount: 1,
      },
      update: {
        usedCount: {
          increment: 1,
        },
      },
    });
  }
}
