import { useMemo } from "react";

import { QuotaPool, ProductItem } from "../schema";

export function useProductComputed({
  isEdit,
  existingProductItems,
  existingQuotaPools,
  quotaPools,
}: {
  isEdit: boolean;
  existingProductItems: ProductItem[];
  existingQuotaPools: QuotaPool[];
  quotaPools: QuotaPool[];
}) {
  const existingProductItemsWithUsage = useMemo(() => {
    if (!isEdit || !existingProductItems.length) return [];
    return existingProductItems.map((item: ProductItem) => ({
      itemId: item.itemId,
      quotaType: item.quotaType,
      quotaValue: item.quotaValue || undefined,
      quotaPoolId: item.quotaPoolId || undefined,
      isActive: item.isActive,
      order: item.order,
      hasUsage: Boolean(
        (item as ProductItem & { _count?: { membershipQuotaUsage: number } })._count?.membershipQuotaUsage,
      ),
    }));
  }, [isEdit, existingProductItems]);

  const quotaPoolsWithUsage = useMemo(() => {
    if (!isEdit || !existingQuotaPools.length) return quotaPools;
    return existingQuotaPools.map((pool: QuotaPool) => ({
      ...pool,
      _count: (pool as QuotaPool & { _count?: { membershipQuotaUsage: number } })._count || { membershipQuotaUsage: 0 },
    }));
  }, [isEdit, existingQuotaPools, quotaPools]);

  return {
    existingProductItemsWithUsage,
    quotaPoolsWithUsage,
  };
}
