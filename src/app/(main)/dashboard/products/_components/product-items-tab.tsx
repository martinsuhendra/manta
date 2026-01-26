"use client";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Item } from "../../admin/items/_components/schema";

import { AddItemModal } from "./add-item-modal";
import { QuotaPoolSection } from "./quota-pool-section";
import { QuotaType, CreateQuotaPoolForm, CreateProductItemForm, QuotaPool } from "./schema";
import { SelectedItemsList } from "./selected-items-list";

interface ProductItemsTabProps {
  productId?: string;
  productItems: CreateProductItemForm[];
  setProductItems: React.Dispatch<React.SetStateAction<CreateProductItemForm[]>>;
  quotaPools: QuotaPool[];
  setQuotaPools: React.Dispatch<React.SetStateAction<QuotaPool[]>>;
  existingProductItems?: Array<CreateProductItemForm & { hasUsage?: boolean }>;
}

const useItems = () => {
  return useQuery<Item[]>({
    queryKey: ["items"],
    queryFn: async () => {
      const response = await fetch("/api/admin/items");
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
  });
};

export function ProductItemsTab({
  productId,
  productItems,
  setProductItems,
  quotaPools,
  setQuotaPools,
  existingProductItems = [],
}: ProductItemsTabProps) {
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const [isAddItemModalOpen, setIsAddItemModalOpen] = React.useState(false);

  const handleItemAdd = (item: Item, quotaType: QuotaType, quotaValue?: number, quotaPoolId?: string) => {
    const newProductItem: CreateProductItemForm = {
      itemId: item.id,
      quotaType,
      quotaValue,
      quotaPoolId,
      isActive: true,
      order: productItems.length,
    };
    setProductItems((prev) => [...prev, newProductItem]);
  };

  const handleItemUpdate = (index: number, updates: Partial<CreateProductItemForm>) => {
    setProductItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const handleItemRemove = (index: number) => {
    setProductItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePoolCreate = (pool: CreateQuotaPoolForm) => {
    const newPool: QuotaPool = {
      id: `temp-${Date.now()}`,
      productId: productId || "",
      ...pool,
      description: pool.description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setQuotaPools((prev) => [...prev, newPool]);
  };

  const handlePoolUpdate = (poolId: string, updates: Partial<CreateQuotaPoolForm>) => {
    setQuotaPools((prev) =>
      prev.map((pool) =>
        pool.id === poolId
          ? {
              ...pool,
              ...updates,
              description: updates.description || null,
              updatedAt: new Date().toISOString(),
            }
          : pool,
      ),
    );
  };

  const handlePoolDelete = (poolId: string) => {
    setQuotaPools((prev) => prev.filter((pool) => pool.id !== poolId));
    // Remove pool references from product items
    setProductItems((prev) =>
      prev.map((item) =>
        item.quotaPoolId === poolId ? { ...item, quotaPoolId: undefined, quotaType: "INDIVIDUAL" as QuotaType } : item,
      ),
    );
  };

  const selectedItemIds = productItems.map((pi) => pi.itemId);

  if (itemsLoading) {
    return <div className="flex h-64 items-center justify-center">Loading items...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add Item Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configure Items</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Add items to this product and configure how quota will be allocated for each item.
          </p>
        </div>
        <Button onClick={() => setIsAddItemModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Selected Items */}
      <Card>
        <CardHeader>
          <CardTitle>Selected Items ({productItems.length})</CardTitle>
          <CardDescription>
            Items added to this product, grouped by quota type. Click edit to configure quota settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SelectedItemsList
            productItems={productItems}
            availableItems={items}
            quotaPools={quotaPools}
            onItemUpdate={handleItemUpdate}
            onItemRemove={handleItemRemove}
            existingProductItems={existingProductItems}
          />
        </CardContent>
      </Card>

      {/* Quota Pools Section */}
      <div className="bg-card rounded-lg border p-6">
        <QuotaPoolSection
          quotaPools={quotaPools}
          productItems={productItems}
          availableItems={items}
          onPoolCreate={handlePoolCreate}
          onPoolUpdate={handlePoolUpdate}
          onPoolDelete={handlePoolDelete}
        />
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        open={isAddItemModalOpen}
        onOpenChange={setIsAddItemModalOpen}
        availableItems={items}
        selectedItemIds={selectedItemIds}
        quotaPools={quotaPools}
        onItemAdd={handleItemAdd}
        onPoolCreate={handlePoolCreate}
      />
    </div>
  );
}
