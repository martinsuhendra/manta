import * as React from "react";

import { AlertTriangle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";

import { Item } from "../../admin/items/_components/schema";

import { FormData } from "./hooks/use-form-validation";
import { ProductPreview } from "./product-card";
import { ProductFormFields } from "./product-form-fields";
import { ProductItemsTab } from "./product-items-tab";
import { Product, QuotaPool, CreateProductItemForm } from "./schema";
import { TabTriggerWithErrors } from "./tab-trigger-with-errors";

interface DialogContentProps {
  isEdit: boolean;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  hasAttemptedSubmit: boolean;
  hasBasicErrors: () => boolean;
  form: UseFormReturn<FormData>;
  mutation: { isPending: boolean };
  onSubmit: () => void;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  productItems: CreateProductItemForm[];
  setProductItems: React.Dispatch<React.SetStateAction<CreateProductItemForm[]>>;
  quotaPoolsWithUsage: QuotaPool[];
  setQuotaPools: React.Dispatch<React.SetStateAction<QuotaPool[]>>;
  existingProductItemsWithUsage: CreateProductItemForm[];
  items: Item[];
}

export function ProductDialogContent({
  isEdit,
  currentTab,
  setCurrentTab,
  hasAttemptedSubmit,
  hasBasicErrors,
  form,
  mutation,
  onSubmit,
  onOpenChange,
  product,
  productItems,
  setProductItems,
  quotaPoolsWithUsage,
  setQuotaPools,
  existingProductItemsWithUsage,
  items,
}: DialogContentProps) {
  return (
    <DialogContent className="flex h-[90vh] max-h-[90vh] w-[95vw] !max-w-[1200px] flex-col overflow-hidden">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the product details and item configuration."
            : "Create a new product and configure which items are included."}
        </DialogDescription>
      </DialogHeader>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabTriggerWithErrors value="basic" hasError={hasAttemptedSubmit && hasBasicErrors()}>
            Basic Info
          </TabTriggerWithErrors>
          <TabTriggerWithErrors value="items" hasError={false}>
            Items
          </TabTriggerWithErrors>
          <TabTriggerWithErrors value="review" hasError={false}>
            Review
          </TabTriggerWithErrors>
        </TabsList>

        <TabsContent value="basic" className="mt-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <div className="pr-2 pb-4">
              <ProductFormFields
                form={form}
                mutation={mutation}
                isEdit={isEdit}
                onSubmit={onSubmit}
                onCancel={() => onOpenChange(false)}
                hideButtons={true}
              />
            </div>
            <div className="flex flex-col">
              <ProductPreview
                name={form.watch("name")}
                description={form.watch("description")}
                price={form.watch("price") || 0}
                validDays={form.watch("validDays") || 30}
                image={form.watch("image")}
                paymentUrl={form.watch("paymentUrl")}
                whatIsIncluded={form.watch("whatIsIncluded")}
                isActive={form.watch("isActive")}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="items" className="mt-6 flex-1 overflow-y-auto">
          <div className="pr-2 pb-4">
            <ProductItemsTab
              productId={product?.id}
              productItems={productItems}
              setProductItems={setProductItems}
              quotaPools={quotaPoolsWithUsage}
              setQuotaPools={setQuotaPools}
              existingProductItems={existingProductItemsWithUsage}
            />
          </div>
        </TabsContent>

        <TabsContent value="review" className="mt-6 flex-1 overflow-y-auto pr-2 pb-4">
          <ReviewTab
            form={form}
            productItems={productItems}
            quotaPoolsWithUsage={quotaPoolsWithUsage}
            items={items}
            isEdit={isEdit}
            hasAttemptedSubmit={hasAttemptedSubmit}
            hasBasicErrors={hasBasicErrors}
            setCurrentTab={setCurrentTab}
          />
        </TabsContent>
      </Tabs>

      <DialogFooter className="flex flex-shrink-0 flex-col gap-3">
        {hasAttemptedSubmit && !form.formState.isValid && (
          <div className="text-destructive flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Please fix the errors above before submitting.</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={mutation.isPending} className="min-w-[120px]">
            {mutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="border-background h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                {isEdit ? "Updating..." : "Creating..."}
              </div>
            ) : isEdit ? (
              "Update Product"
            ) : (
              "Create Product"
            )}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

interface ReviewTabProps {
  form: UseFormReturn<FormData>;
  productItems: CreateProductItemForm[];
  quotaPoolsWithUsage: QuotaPool[];
  items: Item[];
  isEdit: boolean;
  hasAttemptedSubmit: boolean;
  hasBasicErrors: () => boolean;
  setCurrentTab: (tab: string) => void;
}

function ReviewTab({
  form,
  productItems,
  quotaPoolsWithUsage,
  items,
  isEdit,
  hasAttemptedSubmit,
  hasBasicErrors,
  setCurrentTab,
}: ReviewTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-medium">Review & Submit</h3>
        <p className="text-muted-foreground mb-6 text-sm">
          Review your product configuration before {isEdit ? "updating" : "creating"} it.
        </p>

        {hasAttemptedSubmit && !form.formState.isValid && (
          <div className="bg-destructive/10 border-destructive/20 mb-6 rounded-lg border p-4">
            <div className="text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Form has errors</span>
            </div>
            <ul className="text-destructive space-y-1 text-sm">
              {hasBasicErrors() && (
                <li>
                  •{" "}
                  <button type="button" onClick={() => setCurrentTab("basic")} className="underline hover:no-underline">
                    Fix errors in Basic Info tab
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-medium">Basic Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{form.watch("name") || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-medium">{formatPrice(form.watch("price") || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valid Days:</span>
              <span className="font-medium">{form.watch("validDays") || 0} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">{form.watch("isActive") ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-medium">Items ({productItems.length})</h4>
          <div className="space-y-3">
            {productItems.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                <p>No items configured yet.</p>
                <p className="mt-2">Go to the Items tab to add items to this product.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {productItems.map((productItem) => {
                  const item = items.find((i) => i.id === productItem.itemId);
                  if (!item) return null;

                  return (
                    <div key={productItem.itemId} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        {item.color && (
                          <div
                            className="h-4 w-4 flex-shrink-0 rounded-full border"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-muted-foreground text-sm">
                            {productItem.quotaType === "INDIVIDUAL" && productItem.quotaValue && (
                              <span>Individual quota: {productItem.quotaValue}</span>
                            )}
                            {productItem.quotaType === "SHARED" && productItem.quotaPoolId && (
                              <span>Shared quota pool</span>
                            )}
                            {productItem.quotaType === "FREE" && <span>Free item</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            productItem.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                          }`}
                        >
                          {productItem.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {quotaPoolsWithUsage.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h5 className="mb-2 text-sm font-medium">Quota Pools ({quotaPoolsWithUsage.length})</h5>
                <div className="space-y-2">
                  {quotaPoolsWithUsage.map((pool) => (
                    <div key={pool.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex-1">
                        <div className="font-medium">{pool.name}</div>
                        {pool.description && <div className="text-muted-foreground text-sm">{pool.description}</div>}
                        <div className="text-muted-foreground text-sm">Total Quota: {pool.totalQuota}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            pool.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                          }`}
                        >
                          {pool.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
