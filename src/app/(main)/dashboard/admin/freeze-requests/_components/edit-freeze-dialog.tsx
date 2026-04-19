"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, CalendarIcon, UserRound } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FreezeRequestWithRelations } from "@/hooks/use-admin-freeze-requests-query";
import { FREEZE_REASON_LABELS, FREEZE_REQUEST_STATUS, FREEZE_REQUEST_STATUS_LABELS } from "@/lib/constants/freeze";
import { cn } from "@/lib/utils";

import { EditFreezeForm, editFreezeSchema } from "./freeze-requests-schema";

interface EditFreezeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  freezeRequest: FreezeRequestWithRelations | null;
}

function formatDateTimeLocal(value: string | null) {
  if (!value) return "";
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

function DateInputWithCalendar({
  value,
  onChange,
  placeholder,
}: {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const selectedDate = value ? new Date(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {selectedDate ? format(selectedDate, "MMM dd, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function EditFreezeDialog({ open, onOpenChange, freezeRequest }: EditFreezeDialogProps) {
  const queryClient = useQueryClient();
  const form = useForm<EditFreezeForm>({
    resolver: zodResolver(editFreezeSchema),
    defaultValues: {
      reason: "PERSONAL",
      reasonDetails: "",
      status: FREEZE_REQUEST_STATUS.PENDING_APPROVAL,
      freezeStartDate: "",
      freezeEndDate: "",
      membershipExpiredAt: "",
    },
  });

  React.useEffect(() => {
    if (!open || !freezeRequest) return;
    form.reset({
      reason: freezeRequest.reason as EditFreezeForm["reason"],
      reasonDetails: freezeRequest.reasonDetails ?? "",
      status: freezeRequest.status as EditFreezeForm["status"],
      freezeStartDate: formatDateTimeLocal(freezeRequest.freezeStartDate),
      freezeEndDate: formatDateTimeLocal(freezeRequest.freezeEndDate),
      membershipExpiredAt: formatDateTimeLocal(freezeRequest.membership.expiredAt),
    });
  }, [open, freezeRequest, form]);

  const editMutation = useMutation({
    mutationFn: async (values: EditFreezeForm) => {
      const response = await fetch(`/api/admin/freeze-requests/${freezeRequest?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: values.reason,
          reasonDetails: values.reasonDetails?.trim() ? values.reasonDetails : null,
          status: values.status,
          freezeStartDate: values.freezeStartDate?.trim() ? new Date(values.freezeStartDate).toISOString() : null,
          freezeEndDate: values.freezeEndDate?.trim() ? new Date(values.freezeEndDate).toISOString() : null,
          membershipExpiredAt: values.membershipExpiredAt?.trim()
            ? new Date(values.membershipExpiredAt).toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update freeze request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-freeze-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-memberships"] });
      onOpenChange(false);
      toast.success("Freeze request updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(values: EditFreezeForm) {
    editMutation.mutate(values);
  }

  if (!freezeRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[95vh] sm:max-w-2xl sm:rounded-lg">
        <DialogHeader className="space-y-4 border-b px-4 py-3 pr-10 sm:px-6 sm:py-4">
          <div className="space-y-1">
            <DialogTitle className="text-base sm:text-lg">Edit Freeze Request</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update freeze request details and period settings.
            </DialogDescription>
          </div>

          <div className="from-primary/5 via-background to-primary/10 border-border rounded-xl border bg-gradient-to-br p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">
                <UserRound className="h-3.5 w-3.5" />
                {freezeRequest.membership.user.name ?? "Unknown member"}
              </span>
              <span className="bg-primary/10 text-primary inline-flex rounded-full px-2.5 py-1 text-xs font-medium">
                {freezeRequest.membership.product.name}
              </span>
            </div>

            <div className="bg-background mt-3 rounded-lg border p-3">
              <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
                <CalendarDays className="h-3.5 w-3.5" />
                Membership Period
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="rounded-md border p-2">
                  <p className="text-muted-foreground text-[11px] uppercase">Start</p>
                  <p className="text-sm font-medium">
                    {format(new Date(freezeRequest.membership.joinDate), "EEE, MMM dd yyyy")}
                  </p>
                </div>
                <div className="text-muted-foreground hidden text-center text-xs sm:block">to</div>
                <div className="rounded-md border p-2">
                  <p className="text-muted-foreground text-[11px] uppercase">End</p>
                  <p className="text-sm font-medium">
                    {format(new Date(freezeRequest.membership.expiredAt), "EEE, MMM dd yyyy")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:space-y-6 sm:px-6 sm:py-5">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FREEZE_REASON_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reasonDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason Details</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        className="min-h-[90px]"
                        placeholder="Additional details for this request"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FREEZE_REQUEST_STATUS_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="freezeStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Freeze Start Date</FormLabel>
                      <FormControl>
                        <DateInputWithCalendar
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select freeze start date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="freezeEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Freeze End Date</FormLabel>
                      <FormControl>
                        <DateInputWithCalendar
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select freeze end date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="membershipExpiredAt"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Membership End Date</FormLabel>
                      <FormControl>
                        <DateInputWithCalendar
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select membership end date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex-col-reverse gap-2 border-t px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={editMutation.isPending}>
                {editMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
