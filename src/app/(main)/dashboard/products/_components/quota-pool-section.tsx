/* eslint-disable max-lines */
"use client";

import * as React from "react";

import { Plus, Users, AlertTriangle, Edit2, X, Check, XIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";

import { Item } from "../../admin/items/_components/schema";

import { CreateQuotaPoolForm, QuotaPool, CreateProductItemForm } from "./schema";

interface QuotaPoolSectionProps {
  quotaPools: QuotaPool[];
  productItems: CreateProductItemForm[];
  availableItems: Item[];
  onPoolCreate: (pool: CreateQuotaPoolForm) => void;
  onPoolUpdate: (id: string, pool: Partial<CreateQuotaPoolForm>) => void;
  onPoolDelete: (id: string) => void;
}

function QuotaPoolCard({
  pool,
  productItems,
  availableItems,
  hasUsage,
  onEdit,
  onDelete,
  editingPool,
  setEditingPool,
  isEditing,
  onSave,
  onCancel,
}: {
  pool: QuotaPool;
  productItems: CreateProductItemForm[];
  availableItems: Item[];
  hasUsage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  editingPool: CreateQuotaPoolForm;
  setEditingPool: React.Dispatch<React.SetStateAction<CreateQuotaPoolForm>>;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const itemsUsingPool = productItems.filter((item) => item.quotaPoolId === pool.id);

  if (isEditing) {
    return (
      <Card className="border-primary/50 from-primary/5 bg-gradient-to-r to-transparent">
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold">Edit Quota Pool</h4>
              <div className="flex items-center gap-1">
                <Button type="button" size="sm" onClick={onSave} className="h-6 w-6 rounded-md p-0">
                  <Check className="h-3 w-3" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={onCancel} className="h-6 w-6 rounded-md p-0">
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {hasUsage && (
              <Alert className="py-1.5">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription className="text-[10px]">Active usage - quota settings protected</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div>
                <Label className="mb-1 text-[10px]">Pool Name</Label>
                <Input
                  value={editingPool.name}
                  onChange={(e) => setEditingPool((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Group Classes"
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 text-[10px]">Description (optional)</Label>
                <Input
                  value={editingPool.description}
                  onChange={(e) => setEditingPool((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Shared quota for all group classes"
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 text-[10px]">Total Quota</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingPool.totalQuota}
                  onChange={(e) => setEditingPool((prev) => ({ ...prev, totalQuota: parseInt(e.target.value) || 1 }))}
                  disabled={hasUsage}
                  className="h-7 text-xs"
                />
                <p className="text-muted-foreground mt-0.5 text-[10px]">Total uses available across all items</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:border-primary/20 from-primary/5 relative overflow-hidden bg-gradient-to-r to-transparent transition-all duration-200 hover:shadow-sm">
      <CardContent>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="text-foreground truncate text-sm leading-tight font-semibold">{pool.name}</h4>
                  <StatusBadge variant={pool.isActive ? "success" : "secondary"} className="px-1.5 py-0 text-xs">
                    {pool.isActive ? "Active" : "Inactive"}
                  </StatusBadge>
                </div>
                {pool.description && (
                  <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs leading-tight">{pool.description}</p>
                )}
              </div>
            </div>

            {/* Meta Info */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-foreground font-semibold">{pool.totalQuota}</span> quota
                </span>
                {itemsUsingPool.length > 0 && (
                  <>
                    <div className="bg-muted-foreground/40 h-0.5 w-0.5 rounded-full" />
                    <span className="flex items-center gap-1">
                      {itemsUsingPool.length} {itemsUsingPool.length === 1 ? "item" : "items"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Items using pool */}
            {itemsUsingPool.length > 0 && (
              <div className="bg-muted/30 mt-2 rounded-md px-2 py-1.5">
                <div className="text-muted-foreground mb-1 text-xs font-medium">Items:</div>
                <div className="flex flex-wrap gap-1">
                  {itemsUsingPool.map((productItem) => {
                    const item = availableItems.find((i) => i.id === productItem.itemId);
                    if (!item) return null;
                    return (
                      <span key={productItem.itemId} className="text-muted-foreground text-xs">
                        {item.name}
                        {itemsUsingPool.indexOf(productItem) < itemsUsingPool.length - 1 && ","}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {hasUsage && (
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Active usage - settings protected</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 opacity-100 transition-opacity duration-200">
            <div className="flex gap-0.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onEdit}
                disabled={hasUsage}
                className="hover:border-primary/50 h-6 w-6 rounded-md border p-0 transition-all duration-200"
                title={hasUsage ? "Cannot edit quota pool with active usage" : "Edit pool"}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onDelete}
                disabled={hasUsage}
                className="text-destructive hover:bg-destructive/10 hover:border-destructive/50 h-6 w-6 rounded-md border p-0 transition-all duration-200"
                title={hasUsage ? "Cannot delete quota pool with active usage" : "Delete pool"}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuotaPoolSection({
  quotaPools,
  productItems,
  availableItems,
  onPoolCreate,
  onPoolUpdate,
  onPoolDelete,
}: QuotaPoolSectionProps) {
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Quota Pools</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Create shared quota pools that multiple items can use. Members will share the total quota across all items
          assigned to the pool.
        </p>
      </div>

      <div className="space-y-4">
        {isCreating && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle>Create New Quota Pool</CardTitle>
              <CardDescription>Configure a shared quota pool that items can use</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pool-name">Pool Name</Label>
                <Input
                  id="pool-name"
                  placeholder="e.g., Group Classes"
                  value={newPool.name}
                  onChange={(e) => setNewPool((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="pool-description">Description (optional)</Label>
                <Input
                  id="pool-description"
                  placeholder="e.g., Shared quota for all group classes"
                  value={newPool.description}
                  onChange={(e) => setNewPool((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="pool-quota">Total Quota</Label>
                <Input
                  id="pool-quota"
                  type="number"
                  min="1"
                  value={newPool.totalQuota}
                  onChange={(e) => setNewPool((prev) => ({ ...prev, totalQuota: parseInt(e.target.value) || 1 }))}
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Total number of uses available across all items using this pool
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!newPool.name.trim()}>
                  Create Pool
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {quotaPools.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quotaPools.map((pool) => {
              const hasUsage = Boolean(
                (pool as QuotaPool & { _count?: { membershipQuotaUsage: number } })._count?.membershipQuotaUsage,
              );

              return (
                <QuotaPoolCard
                  key={pool.id}
                  pool={pool}
                  productItems={productItems}
                  availableItems={availableItems}
                  hasUsage={hasUsage}
                  onEdit={() => handleEdit(pool)}
                  onDelete={() => onPoolDelete(pool.id)}
                  editingPool={editingPool}
                  setEditingPool={setEditingPool}
                  isEditing={editingId === pool.id}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              );
            })}
          </div>
        )}

        {quotaPools.length === 0 && !isCreating && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="text-muted-foreground mb-3 h-12 w-12" />
              <p className="text-muted-foreground font-medium">No quota pools created yet</p>
              <p className="text-muted-foreground mt-1 text-center text-sm">
                Create a quota pool to share quota across multiple items
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {!isCreating && (
        <Button type="button" variant="outline" onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Quota Pool
        </Button>
      )}
    </div>
  );
}
