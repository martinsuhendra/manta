"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { FreezeRequestWithRelations } from "@/hooks/use-admin-freeze-requests-query";

import { rejectFreezeSchema, type RejectFreezeForm } from "./freeze-requests-schema";

interface RejectFreezeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  freezeRequest: FreezeRequestWithRelations | null;
}

export function RejectFreezeDialog({ open, onOpenChange, freezeRequest }: RejectFreezeDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<RejectFreezeForm>({
    resolver: zodResolver(rejectFreezeSchema),
    defaultValues: {
      rejectionReason: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ rejectionReason: "" });
    }
  }, [open, form]);

  const rejectMutation = useMutation({
    mutationFn: async (data: RejectFreezeForm) => {
      const response = await fetch(`/api/admin/freeze-requests/${freezeRequest?.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to reject");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-freeze-requests"] });
      onOpenChange(false);
      toast.success("Freeze request rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: RejectFreezeForm) => {
    rejectMutation.mutate(data);
  };

  if (!freezeRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Freeze Request</DialogTitle>
          <DialogDescription>
            Reject {freezeRequest.membership.user.name}&apos;s freeze request for{" "}
            {freezeRequest.membership.product.name}. You may optionally provide a reason.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rejectionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rejection Reason (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Documentation required for medical freeze"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={rejectMutation.isPending}>
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
