"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { Membership, updateMembershipSchema, UpdateMembershipForm } from "./schema";

interface EditMembershipDialogProps {
  membership: Membership | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMembershipDialog({ membership, open, onOpenChange }: EditMembershipDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<UpdateMembershipForm>({
    resolver: zodResolver(updateMembershipSchema),
  });

  React.useEffect(() => {
    if (membership && open) {
      form.reset({
        status: membership.status as "ACTIVE" | "EXPIRED" | "SUSPENDED",
        remainingQuota: membership.remainingQuota,
        expiredAt: format(new Date(membership.expiredAt), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      });
    }
  }, [membership, open, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateMembershipForm) => {
      if (!membership) throw new Error("No membership selected");

      const response = await fetch(`/api/admin/memberships/${membership.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update membership");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-memberships"] });
      onOpenChange(false);
      toast.success("Membership updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: UpdateMembershipForm) => {
    updateMutation.mutate(data);
  };

  if (!membership) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Membership</DialogTitle>
          <DialogDescription>
            Update membership details for {membership.user.name || membership.user.email}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">User</span>
                <div className="rounded-md border p-2 text-sm">
                  <div>{membership.user.name || "No Name"}</div>
                  <div className="text-muted-foreground">{membership.user.email}</div>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Product</span>
                <div className="rounded-md border p-2 text-sm">
                  <div>{membership.product.name}</div>
                  <div className="text-muted-foreground">${membership.product.price}</div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remainingQuota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remaining Quota</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max={membership.product.quota}
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
              name="expiredAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiration Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Membership"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
