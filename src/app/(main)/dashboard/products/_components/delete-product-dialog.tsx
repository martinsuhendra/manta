"use client";

import * as React from "react";

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
import { Button } from "@/components/ui/button";
import { useDeleteProduct, useUpdateProduct } from "@/hooks/use-products-mutation";

import { Product } from "./schema";

interface DeleteProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProductDialog({ product, open, onOpenChange }: DeleteProductDialogProps) {
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  const handleDelete = async () => {
    if (!product) return;
    try {
      await deleteProduct.mutateAsync(product.id);
      onOpenChange(false);
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleDeactivate = async () => {
    if (!product) return;
    try {
      await updateProduct.mutateAsync({ id: product.id, data: { isActive: false } });
      onOpenChange(false);
    } catch {
      // Error handled by mutation hook
    }
  };

  if (!product) return null;

  const hasTransactions = (product._count.transactions ?? 0) > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{product.name}&quot;?
            {hasTransactions && (
              <>
                <br />
                <br />
                <span className="text-destructive font-medium">
                  Warning: This product has {product._count.transactions} transaction(s). Products with existing
                  transactions cannot be deleted.
                </span>
                <br />
                <br />
                <span className="text-muted-foreground">
                  Instead, you can deactivate this product to hide it from the shop while preserving transaction
                  history.
                </span>
              </>
            )}
            {!hasTransactions && (
              <>
                <br />
                <br />
                This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="border-t" />
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {hasTransactions ? (
            <Button
              onClick={handleDeactivate}
              disabled={updateProduct.isPending || !product.isActive}
              variant="outline"
            >
              {updateProduct.isPending ? "Deactivating..." : "Deactivate Product"}
            </Button>
          ) : (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
              className="bg-destructive hover:bg-destructive/90 text-white hover:text-white"
            >
              {deleteProduct.isPending ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
