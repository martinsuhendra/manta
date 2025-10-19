"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ItemDialogBasicTab } from "./item-dialog-basic-tab";
import { ItemDialogSchedulesTab } from "./item-dialog-schedules-tab";
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
    errors.name ||
    errors.description ||
    errors.duration ||
    errors.capacity ||
    errors.price ||
    errors.color ||
    errors.image ||
    errors.isActive
  );
  const scheduleErrors = !!errors.schedules;

  return {
    basic: basicErrors,
    schedules: scheduleErrors,
  };
}

export function ItemDialog({ open, onOpenChange, item }: ItemDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!item;

  const form = useForm<CreateItemForm>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: 60,
      capacity: 10,
      price: 0,
      color: "#3B82F6",
      image: "",
      isActive: true,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });
      toast.success("Item created successfully");
      onOpenChange(false);
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

  // Reset form when dialog opens/closes or item changes
  React.useEffect(() => {
    if (open) {
      if (isEditMode) {
        form.reset({
          name: item.name,
          description: item.description || "",
          duration: item.duration,
          capacity: item.capacity,
          price: item.price ?? 0,
          color: item.color || "#3B82F6",
          image: item.image || "",
          isActive: item.isActive,
          schedules: item.schedules || [],
        });
      } else {
        form.reset({
          name: "",
          description: "",
          duration: 60,
          capacity: 10,
          price: 0,
          color: "#3B82F6",
          image: "",
          isActive: true,
          schedules: [],
        });
      }
    }
  }, [open, isEditMode, item, form]);

  const onSubmit = async (data: CreateItemForm) => {
    if (isEditMode) {
      await updateItemMutation.mutateAsync(data);
    } else {
      await createItemMutation.mutateAsync(data);
    }
  };

  const tabErrors = getTabErrors(form.formState.errors);
  const isLoading = createItemMutation.isPending || updateItemMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Item" : "Create New Item"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the item details below." : "Fill in the details to create a new item."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
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
                <ItemDialogSchedulesTab form={form} />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : isEditMode ? "Update Item" : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
