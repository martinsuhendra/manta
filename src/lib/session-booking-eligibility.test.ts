import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/generated/prisma", () => ({
  prisma: {
    membership: {
      findMany: findManyMock,
    },
  },
}));

import { resolveEligibleMembershipsForItem } from "./session-booking-eligibility";

describe("resolveEligibleMembershipsForItem", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("returns only memberships with remaining quota and matching class item", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "membership-1",
        userId: "user-1",
        expiredAt: new Date("2099-01-01T00:00:00.000Z"),
        product: {
          id: "product-1",
          name: "Unlimited Yoga",
          participantsPerPurchase: 1,
          productItems: [
            {
              id: "product-item-1",
              quotaType: "FREE",
              quotaValue: null,
              quotaPoolId: null,
              quotaPool: null,
            },
          ],
        },
        quotaUsage: [],
      },
      {
        id: "membership-2",
        userId: "user-1",
        expiredAt: new Date("2099-01-01T00:00:00.000Z"),
        product: {
          id: "product-2",
          name: "Limited Pilates",
          participantsPerPurchase: 1,
          productItems: [
            {
              id: "product-item-2",
              quotaType: "INDIVIDUAL",
              quotaValue: 3,
              quotaPoolId: null,
              quotaPool: null,
            },
          ],
        },
        quotaUsage: [
          {
            productItemId: "product-item-2",
            quotaPoolId: null,
            usedCount: 3,
          },
        ],
      },
    ]);

    const result = await resolveEligibleMembershipsForItem({
      userId: "user-1",
      itemId: "item-1",
      brandId: "brand-1",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "membership-1",
      userId: "user-1",
      productId: "product-1",
      productName: "Unlimited Yoga",
      slotsRequired: 1,
      remainingQuota: null,
    });
  });

  it("passes membership filters for active brand-scoped memberships", async () => {
    findManyMock.mockResolvedValue([]);

    await resolveEligibleMembershipsForItem({
      userId: "user-2",
      itemId: "item-2",
      brandId: "brand-9",
      asOf: new Date("2026-04-20T12:00:00.000Z"),
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-2",
          status: "ACTIVE",
          membershipBrands: { some: { brandId: "brand-9" } },
        }),
      }),
    );
  });
});
