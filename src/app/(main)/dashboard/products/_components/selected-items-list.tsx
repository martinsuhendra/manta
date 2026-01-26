"use client";

import * as React from "react";

import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Item } from "../../admin/items/_components/schema";

import { ItemCard } from "./item-card";
import { QuotaType, CreateProductItemForm, QuotaPool } from "./schema";

interface SelectedItemsListProps {
  productItems: CreateProductItemForm[];
  availableItems: Item[];
  quotaPools: QuotaPool[];
  onItemUpdate: (index: number, updates: Partial<CreateProductItemForm>) => void;
  onItemRemove: (index: number) => void;
  existingProductItems?: Array<CreateProductItemForm & { hasUsage?: boolean }>;
}

function UsageWarning({ hasUsage }: { hasUsage: boolean }) {
  if (!hasUsage) return null;

  return (
    <Alert className="mt-3">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        This item has active quota usage. Quota settings cannot be modified to protect existing memberships.
      </AlertDescription>
    </Alert>
  );
}

function QuotaEditDialog({
  productItem,
  index,
  item,
  quotaPools,
  hasUsage,
  onItemUpdate,
  open,
  onOpenChange,
}: {
  productItem: CreateProductItemForm;
  index: number;
  item: Item;
  quotaPools: QuotaPool[];
  hasUsage: boolean;
  onItemUpdate: (index: number, updates: Partial<CreateProductItemForm>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [localQuotaType, setLocalQuotaType] = React.useState<QuotaType>(productItem.quotaType);
  const [localQuotaValue, setLocalQuotaValue] = React.useState<string>(productItem.quotaValue?.toString() || "");
  const [localQuotaPoolId, setLocalQuotaPoolId] = React.useState<string>(productItem.quotaPoolId || "");

  React.useEffect(() => {
    setLocalQuotaType(productItem.quotaType);
    setLocalQuotaValue(productItem.quotaValue?.toString() || "");
    setLocalQuotaPoolId(productItem.quotaPoolId || "");
  }, [productItem]);

  const handleSave = () => {
    const updates: Partial<CreateProductItemForm> = {
      quotaType: localQuotaType,
    };

    if (localQuotaType === "INDIVIDUAL") {
      updates.quotaValue = parseInt(localQuotaValue) || undefined;
      updates.quotaPoolId = undefined;
    } else if (localQuotaType === "SHARED") {
      updates.quotaPoolId = localQuotaPoolId || undefined;
      updates.quotaValue = undefined;
    } else {
      updates.quotaValue = undefined;
      updates.quotaPoolId = undefined;
    }

    onItemUpdate(index, updates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Quota for {item.name}</DialogTitle>
          <DialogDescription>Set how quota will be allocated for this item.</DialogDescription>
        </DialogHeader>

        <UsageWarning hasUsage={hasUsage} />

        <div className="space-y-4 py-4">
          <div>
            <Label className="mb-2">Quota Type</Label>
            <Select
              value={localQuotaType}
              onValueChange={(value: QuotaType) => setLocalQuotaType(value)}
              disabled={hasUsage}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Individual Quota</SelectItem>
                <SelectItem value="SHARED" disabled={quotaPools.length === 0}>
                  Shared Quota Pool {quotaPools.length === 0 && "(No pools available)"}
                </SelectItem>
                <SelectItem value="FREE">Free Item</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {localQuotaType === "INDIVIDUAL" && (
            <div>
              <Label className="mb-2">Quota Value</Label>
              <Input
                type="number"
                min="1"
                value={localQuotaValue}
                onChange={(e) => setLocalQuotaValue(e.target.value)}
                placeholder="Enter number of uses"
                disabled={hasUsage}
              />
              <p className="text-muted-foreground mt-1 text-xs">Number of times this item can be used per membership</p>
            </div>
          )}

          {localQuotaType === "SHARED" && (
            <div>
              <Label className="mb-2">Quota Pool</Label>
              <Select
                value={localQuotaPoolId}
                onValueChange={setLocalQuotaPoolId}
                disabled={hasUsage || quotaPools.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pool" />
                </SelectTrigger>
                <SelectContent>
                  {quotaPools.map((pool) => (
                    <SelectItem key={pool.id} value={pool.id}>
                      {pool.name} ({pool.totalQuota} quota)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {quotaPools.length === 0 && (
                <p className="text-muted-foreground mt-1 text-xs">Create a quota pool first to use shared quota</p>
              )}
            </div>
          )}

          {localQuotaType === "FREE" && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-sm">
                This item will have unlimited access with no quota tracking.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={hasUsage || (localQuotaType === "INDIVIDUAL" && !localQuotaValue)}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuotaTypeGroup({
  quotaType,
  items,
  availableItems,
  quotaPools,
  existingProductItems,
  onItemUpdate,
  onItemRemove,
}: {
  quotaType: QuotaType;
  items: Array<{ productItem: CreateProductItemForm; index: number }>;
  availableItems: Item[];
  quotaPools: QuotaPool[];
  existingProductItems?: Array<CreateProductItemForm & { hasUsage?: boolean }>;
  onItemUpdate: (index: number, updates: Partial<CreateProductItemForm>) => void;
  onItemRemove: (index: number) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  const getQuotaTypeLabel = (type: QuotaType) => {
    const labels: Record<QuotaType, string> = {
      INDIVIDUAL: "Individual Quota",
      SHARED: "Shared Quota Pool",
      FREE: "Free Items",
    };
    return labels[type];
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="bg-muted/30 hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{getQuotaTypeLabel(quotaType)}</span>
          <span className="text-muted-foreground text-sm">
            ({items.length} {items.length === 1 ? "item" : "items"})
          </span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map(({ productItem, index }) => {
            const item = availableItems.find((i) => i.id === productItem.itemId);
            const usageInfo = existingProductItems?.find((item) => item.itemId === productItem.itemId);
            const hasUsage = usageInfo?.hasUsage || false;

            if (!item) return null;

            const quotaPool = productItem.quotaPoolId
              ? quotaPools.find((p) => p.id === productItem.quotaPoolId)
              : undefined;

            return (
              <div key={productItem.itemId}>
                <ItemCard
                  item={item}
                  quotaType={productItem.quotaType}
                  quotaValue={productItem.quotaValue}
                  quotaPoolName={quotaPool?.name}
                  onEdit={() => setEditingIndex(index)}
                  onRemove={() => onItemRemove(index)}
                  variant="selected"
                  disabled={hasUsage}
                />
                {editingIndex === index && (
                  <QuotaEditDialog
                    productItem={productItem}
                    index={index}
                    item={item}
                    quotaPools={quotaPools}
                    hasUsage={hasUsage}
                    onItemUpdate={onItemUpdate}
                    open={editingIndex === index}
                    onOpenChange={(open) => !open && setEditingIndex(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SelectedItemsList({
  productItems,
  availableItems,
  quotaPools,
  onItemUpdate,
  onItemRemove,
  existingProductItems = [],
}: SelectedItemsListProps) {
  // Group items by quota type
  const groupedItems = React.useMemo(() => {
    const groups: Record<QuotaType, Array<{ productItem: CreateProductItemForm; index: number }>> = {
      INDIVIDUAL: [],
      SHARED: [],
      FREE: [],
    };

    productItems.forEach((productItem, index) => {
      const quotaType = productItem.quotaType;
      groups[quotaType].push({ productItem, index });
    });

    return groups;
  }, [productItems]);

  if (productItems.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
        <p className="font-medium">No items selected yet</p>
        <p className="mt-2 text-sm">Select a quota type and add items from the left panel to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(["INDIVIDUAL", "SHARED", "FREE"] as QuotaType[]).map((quotaType) => {
        if (groupedItems[quotaType].length === 0) return null;

        return (
          <QuotaTypeGroup
            key={quotaType}
            quotaType={quotaType}
            items={groupedItems[quotaType]}
            availableItems={availableItems}
            quotaPools={quotaPools}
            existingProductItems={existingProductItems}
            onItemUpdate={onItemUpdate}
            onItemRemove={onItemRemove}
          />
        );
      })}
    </div>
  );
}
