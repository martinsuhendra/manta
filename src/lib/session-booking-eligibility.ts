import { prisma } from "@/lib/generated/prisma";
import { calculateRemainingQuota } from "@/lib/quota-utils";

interface ResolveEligibleMembershipsParams {
  userId: string;
  itemId: string;
  brandId: string;
  asOf?: Date;
}

interface ProductItemForEligibility {
  id: string;
  quotaType: string;
  quotaValue: number | null;
  quotaPoolId: string | null;
  quotaPool: {
    totalQuota: number;
  } | null;
}

interface EligibleMembershipRecord {
  id: string;
  userId: string;
  expiredAt: Date;
  product: {
    id: string;
    name: string;
    participantsPerPurchase: number | null;
    productItems: ProductItemForEligibility[];
  };
  quotaUsage: Array<{
    productItemId: string | null;
    quotaPoolId: string | null;
    usedCount: number;
  }>;
}

export interface EligibleMembershipOption {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  expiredAt: Date;
  slotsRequired: number;
  remainingQuota: number | null;
  productItem: ProductItemForEligibility;
}

export async function resolveEligibleMembershipsForItem({
  userId,
  itemId,
  brandId,
  asOf,
}: ResolveEligibleMembershipsParams): Promise<EligibleMembershipOption[]> {
  const currentTime = asOf ?? new Date();

  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      status: "ACTIVE",
      expiredAt: { gt: currentTime },
      membershipBrands: {
        some: { brandId },
      },
    },
    select: {
      id: true,
      userId: true,
      expiredAt: true,
      product: {
        select: {
          id: true,
          name: true,
          participantsPerPurchase: true,
          productItems: {
            where: {
              itemId,
              isActive: true,
            },
            select: {
              id: true,
              quotaType: true,
              quotaValue: true,
              quotaPoolId: true,
              quotaPool: {
                select: {
                  totalQuota: true,
                },
              },
            },
          },
        },
      },
      quotaUsage: {
        select: {
          productItemId: true,
          quotaPoolId: true,
          usedCount: true,
        },
      },
    },
  });

  return memberships.flatMap((membership) =>
    mapMembershipToEligibleOption({
      membership,
      currentTime,
    }),
  );
}

function mapMembershipToEligibleOption({
  membership,
  currentTime,
}: {
  membership: EligibleMembershipRecord;
  currentTime: Date;
}): EligibleMembershipOption[] {
  if (membership.expiredAt <= currentTime) return [];

  if (membership.product.productItems.length === 0) return [];
  const productItem = membership.product.productItems[0];

  const remainingQuota = calculateRemainingQuota(productItem, membership.quotaUsage);
  if (remainingQuota <= 0) return [];

  return [
    {
      id: membership.id,
      userId: membership.userId,
      productId: membership.product.id,
      productName: membership.product.name,
      expiredAt: membership.expiredAt,
      slotsRequired: membership.product.participantsPerPurchase ?? 1,
      remainingQuota: remainingQuota === Infinity ? null : remainingQuota,
      productItem,
    },
  ];
}
