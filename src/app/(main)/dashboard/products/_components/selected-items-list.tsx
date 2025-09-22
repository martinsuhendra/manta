import * as React from "react";

import { AlertTriangle, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { Item } from "../../admin/items/_components/schema";

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

function ItemQuotaSettings({
  productItem,
  index,
  quotaPools,
  hasUsage,
  onItemUpdate,
}: {
  productItem: CreateProductItemForm;
  index: number;
  quotaPools: QuotaPool[];
  hasUsage: boolean;
  onItemUpdate: (index: number, updates: Partial<CreateProductItemForm>) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <Label className="mb-2">Quota Type</Label>
        <Select
          value={productItem.quotaType}
          onValueChange={(value: QuotaType) =>
            onItemUpdate(index, {
              quotaType: value,
              quotaPoolId: value === "SHARED" ? productItem.quotaPoolId : undefined,
            })
          }
          disabled={hasUsage}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INDIVIDUAL">Individual Quota</SelectItem>
            <SelectItem value="SHARED" disabled={quotaPools.length === 0}>
              Shared Quota {quotaPools.length === 0 && "(No pools available)"}
            </SelectItem>
            <SelectItem value="FREE">Free Item</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {productItem.quotaType === "INDIVIDUAL" && (
        <div>
          <Label className="mb-2">Quota Value</Label>
          <Input
            type="number"
            min="1"
            value={productItem.quotaValue || ""}
            onChange={(e) => onItemUpdate(index, { quotaValue: parseInt(e.target.value) || undefined })}
            placeholder="Enter quota"
            disabled={hasUsage}
          />
        </div>
      )}

      {productItem.quotaType === "SHARED" && (
        <div>
          <Label className="mb-2">Quota Pool</Label>
          <Select
            value={productItem.quotaPoolId || ""}
            onValueChange={(value) => onItemUpdate(index, { quotaPoolId: value || undefined })}
            disabled={hasUsage}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pool" />
            </SelectTrigger>
            <SelectContent>
              {quotaPools.map((pool) => (
                <SelectItem key={pool.id} value={pool.id}>
                  {pool.name} ({pool.totalQuota} quota)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
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
  const getItemDetails = (itemId: string) => {
    return availableItems.find((item) => item.id === itemId);
  };

  const getItemUsageInfo = (itemId: string) => {
    return existingProductItems.find((item) => item.itemId === itemId);
  };

  return (
    <div className="space-y-4">
      {productItems.map((productItem, index) => {
        const item = getItemDetails(productItem.itemId);
        const usageInfo = getItemUsageInfo(productItem.itemId);
        const hasUsage = usageInfo?.hasUsage || false;

        if (!item) return null;

        return (
          <div key={item.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {item.color && (
                  <div className="h-4 w-4 flex-shrink-0 rounded-full border" style={{ backgroundColor: item.color }} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-muted-foreground line-clamp-1 text-sm">{item.description}</div>
                  )}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onItemRemove(index)}
                disabled={hasUsage}
                title={hasUsage ? "Cannot remove item with active quota usage" : "Remove item"}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <UsageWarning hasUsage={hasUsage} />

            <Separator className="my-3" />

            <ItemQuotaSettings
              productItem={productItem}
              index={index}
              quotaPools={quotaPools}
              hasUsage={hasUsage}
              onItemUpdate={onItemUpdate}
            />
          </div>
        );
      })}

      {productItems.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          No items selected yet. Add items from the left panel.
        </div>
      )}
    </div>
  );
}
