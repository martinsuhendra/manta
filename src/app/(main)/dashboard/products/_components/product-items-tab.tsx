"use client";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { Plus, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Item } from "../../admin/items/_components/schema";

import { ItemSelector } from "./item-selector";
import { QuotaPoolEditor } from "./quota-pool-editor";
import { QuotaPoolView } from "./quota-pool-view";
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

// Mock data for now - will be replaced with actual API calls
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

// Removed useQuotaPools hook - now using data passed from parent component

function QuotaPoolManager({
  quotaPools,
  onPoolCreate,
  onPoolUpdate,
  onPoolDelete,
}: {
  quotaPools: QuotaPool[];
  onPoolCreate: (pool: CreateQuotaPoolForm) => void;
  onPoolUpdate: (id: string, pool: Partial<CreateQuotaPoolForm>) => void;
  onPoolDelete: (id: string) => void;
}) {
  const [isCreating, setIsCreating] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [newPool, setNewPool] = React.useState<CreateQuotaPoolForm>({
    name: "",
    description: "",
    totalQuota: 10,
    isActive: true,
  });
  const [editingPool, setEditingPool] = React.useState<CreateQuotaPoolForm>({
    name: "",
    description: "",
    totalQuota: 10,
    isActive: true,
  });

  const handleCreate = () => {
    if (newPool.name.trim()) {
      onPoolCreate(newPool);
      setNewPool({
        name: "",
        description: "",
        totalQuota: 10,
        isActive: true,
      });
      setIsCreating(false);
    }
  };

  const handleEdit = (pool: QuotaPool) => {
    setEditingId(pool.id);
    setEditingPool({
      name: pool.name,
      description: pool.description || "",
      totalQuota: pool.totalQuota,
      isActive: pool.isActive,
    });
  };

  const handleSaveEdit = () => {
    if (editingId && editingPool.name.trim()) {
      onPoolUpdate(editingId, editingPool);
      setEditingId(null);
      setEditingPool({
        name: "",
        description: "",
        totalQuota: 10,
        isActive: true,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingPool({
      name: "",
      description: "",
      totalQuota: 10,
      isActive: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quota Pools
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsCreating(true)} disabled={isCreating}>
            <Plus className="mr-2 h-4 w-4" />
            Add Pool
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isCreating && (
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="pool-name" className="mb-2">
                    Pool Name
                  </Label>
                  <Input
                    id="pool-name"
                    placeholder="e.g., Group Classes"
                    value={newPool.name}
                    onChange={(e) => setNewPool((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="pool-description" className="mb-2">
                    Description (optional)
                  </Label>
                  <Input
                    id="pool-description"
                    placeholder="e.g., Shared quota for all group classes"
                    value={newPool.description}
                    onChange={(e) => setNewPool((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="pool-quota" className="mb-2">
                    Total Quota
                  </Label>
                  <Input
                    id="pool-quota"
                    type="number"
                    min="1"
                    value={newPool.totalQuota}
                    onChange={(e) => setNewPool((prev) => ({ ...prev, totalQuota: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleCreate}>
                      Create Pool
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsCreating(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {quotaPools.map((pool) => {
            const hasUsage = Boolean(
              (pool as QuotaPool & { _count?: { membershipQuotaUsage: number } })._count?.membershipQuotaUsage,
            );

            return (
              <div key={pool.id} className="rounded-lg border p-4">
                {editingId === pool.id ? (
                  <QuotaPoolEditor
                    pool={pool}
                    editingPool={editingPool}
                    setEditingPool={setEditingPool}
                    hasUsage={hasUsage}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <QuotaPoolView
                    pool={pool}
                    hasUsage={hasUsage}
                    onEdit={() => handleEdit(pool)}
                    onDelete={() => onPoolDelete(pool.id)}
                  />
                )}
              </div>
            );
          })}

          {quotaPools.length === 0 && !isCreating && (
            <div className="text-muted-foreground py-8 text-center">No quota pools created yet</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductItemsTab({
  productId,
  productItems,
  setProductItems,
  quotaPools,
  setQuotaPools,
  existingProductItems = [],
}: ProductItemsTabProps) {
  const { data: items = [], isLoading: itemsLoading } = useItems();

  const handleItemAdd = (item: Item) => {
    const newProductItem: CreateProductItemForm = {
      itemId: item.id,
      quotaType: "INDIVIDUAL",
      quotaValue: 1,
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
      description: pool.description || null, // Keep as null for the QuotaPool type
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
    <Tabs defaultValue="items" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="items">Items & Quotas</TabsTrigger>
        <TabsTrigger value="pools">Quota Pools</TabsTrigger>
      </TabsList>

      <TabsContent value="items" className="mt-6">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <ItemSelector selectedItems={selectedItemIds} onItemAdd={handleItemAdd} availableItems={items} />
          <Card>
            <CardHeader>
              <CardTitle>Selected Items ({productItems.length})</CardTitle>
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
        </div>
      </TabsContent>

      <TabsContent value="pools" className="mt-6">
        <div className="max-w-4xl">
          <QuotaPoolManager
            quotaPools={quotaPools}
            onPoolCreate={handlePoolCreate}
            onPoolUpdate={handlePoolUpdate}
            onPoolDelete={handlePoolDelete}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
