"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Stepper } from "@/components/ui/stepper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccessibleBrands } from "@/hooks/use-brands-query";
import { cn } from "@/lib/utils";
import type { BrandSummary } from "@/stores/brand/brand-store";

import { ItemDialogBasicTab } from "./item-dialog-basic-tab";
import { ItemDialogSchedulesTab } from "./item-dialog-schedules-tab";
import { ItemSuccessStep } from "./item-success-step";
import { createItemSchema, CreateItemForm, Item } from "./schema";

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
}

interface TabErrors {
  basic: boolean;
  schedules: boolean;
}

function getTabErrors(errors: Record<string, unknown>): TabErrors {
  const basicErrors = !!(
    errors.brandIds ||
    errors.name ||
    errors.description ||
    errors.duration ||
    errors.capacity ||
    errors.color ||
    errors.image ||
    errors.isActive ||
    errors.isPublic
  );
  const scheduleErrors = !!errors.schedules;

  return {
    basic: basicErrors,
    schedules: scheduleErrors,
  };
}

const STEPS = [
  { id: "basic", label: "Basic Info", description: "Item details" },
  { id: "schedules", label: "Schedules", description: "Time availability" },
  { id: "success", label: "Success", description: "Completed" },
];

/** Stable fallback — `= []` in useQuery destructuring is a new array every render and breaks useEffect deps. */
const EMPTY_ACCESSIBLE_BRANDS: BrandSummary[] = [];

/* eslint-disable complexity */
export function ItemDialog({ open, onOpenChange, item }: ItemDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!item;
  const scheduleSourceKey = isEditMode && item ? item.id : "create";
  const [currentStep, setCurrentStep] = React.useState(1);
  const [createdItem, setCreatedItem] = React.useState<Item | null>(null);
  const { data: brandsQueryData } = useAccessibleBrands();
  const accessibleBrands = brandsQueryData ?? EMPTY_ACCESSIBLE_BRANDS;

  const form = useForm<CreateItemForm>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      brandIds: [],
      name: "",
      description: "",
      duration: 60,
      capacity: 10,
      color: "#3B82F6",
      image: "",
      isActive: true,
      isPublic: true,
      schedules: [],
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: CreateItemForm) => {
      const response = await fetch("/api/admin/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create item");
      }

      return response.json();
    },
    onSuccess: (data: Item) => {
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });
      setCreatedItem(data);
      setCurrentStep(3);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: CreateItemForm) => {
      if (!item?.id) throw new Error("Item ID is required for update");

      const response = await fetch(`/api/admin/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update item");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });
      toast.success("Item updated successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Reset form and step when dialog opens/closes or item changes.
  React.useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setCreatedItem(null);
      if (item) {
        const ids =
          item.brandIds && item.brandIds.length > 0 ? item.brandIds : (item.itemBrands?.map((ib) => ib.brandId) ?? []);
        form.reset({
          brandIds: ids,
          name: item.name,
          description: item.description || "",
          duration: item.duration,
          capacity: item.capacity,
          color: item.color || "#3B82F6",
          image: item.image || "",
          isActive: item.isActive,
          isPublic: item.isPublic,
          schedules: item.schedules || [],
        });
      } else {
        const defaultBrandIds = accessibleBrands.length === 0 ? [] : [accessibleBrands[0].id];
        form.reset({
          brandIds: defaultBrandIds,
          name: "",
          description: "",
          duration: 60,
          capacity: 10,
          color: "#3B82F6",
          image: "",
          isActive: true,
          isPublic: true,
          schedules: [],
        });
      }
    }
  }, [open, isEditMode, item, accessibleBrands, form]);

  const onSubmit = async (data: CreateItemForm) => {
    // Ensure all numeric fields are converted to numbers
    const transformedData: CreateItemForm = {
      ...data,
      duration: Number(data.duration),
      capacity: Number(data.capacity),
      schedules: data.schedules.map((schedule) => ({
        ...schedule,
        dayOfWeek: Number(schedule.dayOfWeek),
      })),
    };

    if (isEditMode) {
      await updateItemMutation.mutateAsync(transformedData);
    } else {
      await createItemMutation.mutateAsync(transformedData);
    }
  };

  const tabErrors = getTabErrors(form.formState.errors);
  const isLoading = createItemMutation.isPending || updateItemMutation.isPending;

  // Validation helpers
  const validateBasicStep = async () => {
    const fields = [
      "brandIds",
      "name",
      "description",
      "duration",
      "capacity",
      "color",
      "image",
      "isActive",
      "isPublic",
    ] as const;
    const result = await form.trigger(fields);
    return result;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await validateBasicStep();
      if (isValid) {
        setCurrentStep(2);
      } else {
        toast.error("Please fix the errors in Basic Info before proceeding");
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!isEditMode && currentStep === 1) {
      const isValid = await validateBasicStep();
      if (isValid) {
        setCurrentStep(2);
        return;
      }

      toast.error("Please fix the errors in Basic Info before proceeding");
      return;
    }

    const isValid = await form.trigger();
    if (isValid) {
      await onSubmit(form.getValues());
    } else {
      if (currentStep === 1) {
        toast.error("Please fix the errors in Basic Info");
      } else {
        toast.error("Please fix the errors in Schedules");
      }
    }
  };

  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen && currentStep === 3) {
      setCurrentStep(1);
      setCreatedItem(null);
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden p-0 sm:max-w-[90vw] lg:max-w-5xl">
        {(!isEditMode && currentStep !== 3) || isEditMode ? (
          <DialogHeader className="bg-background sticky top-0 z-10 border-b px-6 pt-6 pr-12 pb-4">
            <DialogTitle>{isEditMode ? "Edit Class" : "Create New Class"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update the class details below." : "Fill in the details to create a new class."}
            </DialogDescription>
          </DialogHeader>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {!isEditMode && currentStep === 3 && createdItem ? (
            <ItemSuccessStep item={createdItem} onClose={() => onOpenChange(false)} />
          ) : (
            <div className="flex-1 overflow-y-auto">
              <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6 px-6 py-4">
                  {isEditMode ? (
                    <Tabs defaultValue="basic">
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="basic" className="relative">
                          Basic Info
                          {tabErrors.basic && <AlertTriangle className="text-destructive ml-2 h-4 w-4" />}
                        </TabsTrigger>
                        <TabsTrigger value="schedules" className="relative">
                          Schedules
                          {tabErrors.schedules && <AlertTriangle className="text-destructive ml-2 h-4 w-4" />}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic">
                        <ItemDialogBasicTab form={form} />
                      </TabsContent>

                      <TabsContent value="schedules">
                        <ItemDialogSchedulesTab form={form} dialogOpen={open} scheduleSourceKey={scheduleSourceKey} />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <>
                      <Stepper
                        steps={STEPS}
                        currentStep={currentStep}
                        completedSteps={currentStep === 3 ? [1, 2, 3] : currentStep > 1 ? [1, 2] : []}
                        className="mb-6"
                      />

                      {/*
                        Keep both steps mounted so ItemDialogSchedulesTab local state (e.g. start times before any day is picked)
                        survives Basic → Schedules → Previous. Hidden via CSS instead of unmounting.
                      */}
                      <div
                        className={cn("min-h-[400px]", currentStep !== 1 && "hidden")}
                        aria-hidden={currentStep !== 1}
                      >
                        <ItemDialogBasicTab form={form} />
                      </div>
                      <div
                        className={cn("min-h-[400px]", currentStep !== 2 && "hidden")}
                        aria-hidden={currentStep !== 2}
                      >
                        <ItemDialogSchedulesTab form={form} dialogOpen={open} scheduleSourceKey={scheduleSourceKey} />
                      </div>
                    </>
                  )}
                </form>
              </Form>
            </div>
          )}
        </div>

        {currentStep !== 3 && (
          <DialogFooter className="bg-background sticky bottom-0 z-10 border-t px-6 py-4">
            {!isEditMode && currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            <div className="flex flex-1 justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              {!isEditMode && currentStep < 2 ? (
                <Button type="button" onClick={handleNext} disabled={isLoading}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Saving..." : isEditMode ? "Update Item" : "Create Item"}
                  {!isLoading && !isEditMode && currentStep === 2 && <Check className="ml-2 h-4 w-4" />}
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
