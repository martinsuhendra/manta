"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Item } from "./schema";

interface DeleteItemDialogProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteItemDialog({ item, open, onOpenChange }: DeleteItemDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/admin/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete item");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });
      onOpenChange(false);
      toast.success("Item deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    if (!item) return;
    deleteMutation.mutate(item.id);
  };

  if (!item) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            Delete Item
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-muted-foreground space-y-2 text-sm">
              <p>
                Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
              </p>
              <div className="bg-muted rounded-lg p-3 text-sm">
                <span className="block font-medium">This will also delete:</span>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  <li>All teacher assignments for this item</li>
                  <li>All recurring schedules</li>
                  <li>Product associations (items will be removed from products)</li>
                </ul>
              </div>
              <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-3 text-sm">
                <span className="text-destructive block font-medium">Note:</span>
                <span className="block">Items with existing class sessions or bookings cannot be deleted.</span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive hover:bg-destructive/90 text-white hover:text-white"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Item"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
