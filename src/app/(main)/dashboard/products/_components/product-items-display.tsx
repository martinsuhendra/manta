import * as React from "react";

import { Clock, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

import { Item } from "../../admin/items/_components/schema";

import { ProductItem, QuotaPool } from "./schema";

interface ProductItemsDisplayProps {
  productItems: ProductItem[];
  items: Item[];
  quotaPools: QuotaPool[];
}

function ProductItemCard({
  productItem,
  item,
  quotaPool,
}: {
  productItem: ProductItem;
  item: Item;
  quotaPool: QuotaPool | null | undefined;
}) {
  const getQuotaInfo = () => {
    switch (productItem.quotaType) {
      case "INDIVIDUAL":
        return `Individual quota: ${productItem.quotaValue}`;
      case "SHARED":
        return quotaPool ? `Shared quota pool: ${quotaPool.name}` : "Shared quota pool";
      case "FREE":
        return "Free item";
      default:
        return "Unknown quota type";
    }
  };

  return (
    <Card>
      <CardContent>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-medium">{item.name}</div>
            {item.description && <div className="text-muted-foreground line-clamp-1 text-sm">{item.description}</div>}
            <div className="text-muted-foreground mt-1 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.duration}min
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {item.capacity}
              </span>
            </div>
            <div className="text-muted-foreground mt-2 text-sm">{getQuotaInfo()}</div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant={productItem.isActive ? "success" : "secondary"}>
              {productItem.isActive ? "Active" : "Inactive"}
            </StatusBadge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductItemsDisplay({ productItems, items, quotaPools }: ProductItemsDisplayProps) {
  const getItemDetails = (itemId: string) => {
    return items.find((item) => item.id === itemId);
  };

  const getQuotaPoolDetails = (quotaPoolId: string) => {
    return quotaPools.find((pool) => pool.id === quotaPoolId);
  };

  if (productItems.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <p>No items configured for this product yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Product Items ({productItems.length})</h4>
      <div className="space-y-4">
        {productItems.map((productItem) => {
          const item = getItemDetails(productItem.itemId);
          const quotaPool = productItem.quotaPoolId ? getQuotaPoolDetails(productItem.quotaPoolId) : null;

          if (!item) return null;

          return <ProductItemCard key={productItem.id} productItem={productItem} item={item} quotaPool={quotaPool} />;
        })}
      </div>
    </div>
  );
}
