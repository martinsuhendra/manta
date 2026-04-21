import * as React from "react";

import { UseFormReturn } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAccessibleBrands } from "@/hooks/use-brands-query";
import type { BrandSummary } from "@/stores/brand/brand-store";

import { CreateItemForm, ITEM_COLORS } from "./schema";

const EMPTY_BRANDS: BrandSummary[] = [];

interface ItemDialogBasicTabProps {
  form: UseFormReturn<CreateItemForm>;
}

export function ItemDialogBasicTab({ form }: ItemDialogBasicTabProps) {
  const { data: brandsData, isPending: isBrandsLoading } = useAccessibleBrands();
  const brands = brandsData ?? EMPTY_BRANDS;

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="brandIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brands</FormLabel>
            {isBrandsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : brands.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No active brands available. Create a brand under Organization first.
              </p>
            ) : (
              <div className="border-input max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {brands.map((b) => {
                  const selected = field.value.includes(b.id);
                  return (
                    <label
                      key={b.id}
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1.5"
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) => {
                          const cur = field.value;
                          if (checked === true) {
                            field.onChange([...cur, b.id]);
                          } else {
                            field.onChange(cur.filter((id: string) => id !== b.id));
                          }
                        }}
                      />
                      <span className="text-sm">{b.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-muted-foreground text-sm">
              Pick every branch where this class is offered. Sessions are still created per store (use the brand
              switcher).
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter item name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ITEM_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: color.value }} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Enter item description" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter duration"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter capacity"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="image"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Image</FormLabel>
            <FormControl>
              <ImageUpload value={field.value || ""} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Active Status</FormLabel>
              <div className="text-muted-foreground text-sm">Enable or disable this item</div>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="isPublic"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Visible in Customer Dashboard</FormLabel>
              <div className="text-muted-foreground text-sm">Show or hide this class from customer-facing pages</div>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
