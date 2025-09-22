"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
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

import { Membership } from "./schema";

interface DeleteMembershipDialogProps {
  membership: Membership | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteMembershipDialog({ membership, open, onOpenChange }: DeleteMembershipDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!membership) throw new Error("No membership selected");

      const response = await fetch(`/api/admin/memberships/${membership.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete membership");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-memberships"] });
      onOpenChange(false);
      toast.success("Membership deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (!membership) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="text-destructive h-5 w-5" />
            Delete Membership
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the membership for{" "}
            <span className="font-semibold">{membership.user.name || membership.user.email}</span>? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-muted/50 my-4 rounded-md border p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">User:</span>
              <span>{membership.user.name || membership.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Product:</span>
              <span>{membership.product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className="capitalize">{membership.status.toLowerCase()}</span>
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Membership"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
