import * as React from "react";

import { Package } from "lucide-react";

import { Item } from "../../admin/items/_components/schema";

import { ProductItemsDisplay } from "./product-items-display";
import { ProductItem, QuotaPool } from "./schema";

interface ProductItemsDisplayTabProps {
  productItems: ProductItem[];
  quotaPools: QuotaPool[];
  items: Item[];
  isLoading: boolean;
}

export function ProductItemsDisplayTab({ productItems, quotaPools, items, isLoading }: ProductItemsDisplayTabProps) {
  if (isLoading) {
    return <div className="flex h-64 items-center justify-center">Loading items...</div>;
  }

  if (productItems.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <Package className="mx-auto h-12 w-12 opacity-50" />
        <p className="mt-2">No items configured for this product yet.</p>
      </div>
    );
  }

  return <ProductItemsDisplay productItems={productItems} items={items} quotaPools={quotaPools} />;
}
