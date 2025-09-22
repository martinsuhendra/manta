import * as React from "react";

import { Package } from "lucide-react";

import { DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Item } from "../../admin/items/_components/schema";

import { BasicInfoTab } from "./basic-info-tab";
import { ProductItemsDisplayTab } from "./product-items-display-tab";
import { QuotaPoolsTab } from "./quota-pools-tab";
import { Product, ProductItem, QuotaPool } from "./schema";

interface ViewProductDrawerContentProps {
  product: Product;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  productItems: ProductItem[];
  quotaPools: QuotaPool[];
  items: Item[];
  isLoading: boolean;
}

export function ViewProductDrawerContent({
  product,
  currentTab,
  setCurrentTab,
  productItems,
  quotaPools,
  items,
  isLoading,
}: ViewProductDrawerContentProps) {
  return (
    <DrawerContent className="max-w-4xl">
      <DrawerHeader className="flex-shrink-0">
        <DrawerTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {product.name}
        </DrawerTitle>
        <DrawerDescription>Comprehensive product details, items, and quota configuration</DrawerDescription>
      </DrawerHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="pools">Quota Pools</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6 flex-1 overflow-y-auto">
            <BasicInfoTab product={product} />
          </TabsContent>

          <TabsContent value="items" className="mt-6 flex-1 overflow-y-auto">
            <ProductItemsDisplayTab
              productItems={productItems}
              quotaPools={quotaPools}
              items={items}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="pools" className="mt-6 flex-1 overflow-y-auto">
            <QuotaPoolsTab quotaPools={quotaPools} />
          </TabsContent>
        </Tabs>
      </div>

      <DrawerFooter className="flex-shrink-0">
        <div className="text-muted-foreground text-sm">
          Last updated: {new Date(product.updatedAt).toLocaleDateString()}
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
