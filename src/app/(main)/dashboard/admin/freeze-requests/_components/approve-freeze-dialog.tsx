"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FreezeRequestWithRelations } from "@/hooks/use-admin-freeze-requests-query";
import { FREEZE_PRESET_DAYS } from "@/lib/constants/freeze";

import { approveFreezeSchema, type ApproveFreezeForm } from "./freeze-requests-schema";

interface ApproveFreezeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  freezeRequest: FreezeRequestWithRelations | null;
}

type DurationMode = "preset" | "custom" | "date";

export function ApproveFreezeDialog({ open, onOpenChange, freezeRequest }: ApproveFreezeDialogProps) {
  const queryClient = useQueryClient();
  const [durationMode, setDurationMode] = React.useState<DurationMode>("preset");

  const form = useForm<ApproveFreezeForm>({
    resolver: zodResolver(approveFreezeSchema),
    defaultValues: {
      presetDays: 7,
      customDays: undefined,
      freezeEndDate: undefined,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        presetDays: 7,
        customDays: undefined,
        freezeEndDate: undefined,
      });
      setDurationMode("preset");
    }
  }, [open, form]);

  const approveMutation = useMutation({
    mutationFn: async (data: ApproveFreezeForm) => {
      const body: Record<string, unknown> = {};
      if (durationMode === "preset" && data.presetDays) {
        body.presetDays = data.presetDays;
      } else if (durationMode === "custom" && data.customDays) {
        body.customDays = data.customDays;
      } else if (durationMode === "date" && data.freezeEndDate) {
        body.freezeEndDate = new Date(data.freezeEndDate).toISOString();
      }

      const response = await fetch(`/api/admin/freeze-requests/${freezeRequest?.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to approve");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-freeze-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-memberships"] });
      onOpenChange(false);
      toast.success("Freeze request approved");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: ApproveFreezeForm) => {
    approveMutation.mutate(data);
  };

  if (!freezeRequest) return null;

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Freeze Request</DialogTitle>
          <DialogDescription>
            Set the freeze duration for {freezeRequest.membership.user.name}&apos;s membership (
            {freezeRequest.membership.product.name}).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Duration</FormLabel>
              <Select value={durationMode} onValueChange={(v) => setDurationMode(v as DurationMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preset">Preset (7, 14, 30 days)</SelectItem>
                  <SelectItem value="custom">Custom days</SelectItem>
                  <SelectItem value="date">Specific end date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {durationMode === "preset" && (
              <FormField
                control={form.control}
                name="presetDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preset Days</FormLabel>
                    <Select value={String(field.value ?? 7)} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select days" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREEZE_PRESET_DAYS.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {d} days
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {durationMode === "custom" && (
              <FormField
                control={form.control}
                name="customDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 21"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {durationMode === "date" && (
              <FormField
                control={form.control}
                name="freezeEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Freeze End Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" min={format(minDate, "yyyy-MM-dd'T'HH:mm")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={approveMutation.isPending}>
                {approveMutation.isPending ? "Approving..." : "Approve"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
