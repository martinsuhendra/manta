/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import * as React from "react";
import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useItems } from "@/hooks/use-items-query";
import { useCreateSession, useUpdateSession } from "@/hooks/use-sessions-mutation";
import { useTeachers } from "@/hooks/use-users-query";
import { cn } from "@/lib/utils";

import { CreateSessionForm, createSessionSchema, Session, TIME_SLOTS } from "./schema";

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  editingSession?: Session | null;
  onSuccess?: () => void;
}

/* eslint-disable-next-line complexity */
export function SessionDialog({ open, onOpenChange, selectedDate, editingSession, onSuccess }: SessionDialogProps) {
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const createSessionMutation = useCreateSession();
  const updateSessionMutation = useUpdateSession();

  const isEditMode = !!editingSession;

  const form = useForm<CreateSessionForm>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      itemId: editingSession?.itemId || "",
      teacherId: editingSession?.teacherId || "none",
      date: (() => {
        if (editingSession) {
          // Use the editing session's date
          const sessionDate = new Date(editingSession.date);
          const year = sessionDate.getFullYear();
          const month = String(sessionDate.getMonth() + 1).padStart(2, "0");
          const day = String(sessionDate.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
        const dateToUse = selectedDate || new Date();
        const year = dateToUse.getFullYear();
        const month = String(dateToUse.getMonth() + 1).padStart(2, "0");
        const day = String(dateToUse.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      })(),
      startTime: editingSession?.startTime || "09:00",
      status: editingSession?.status || "SCHEDULED",
      notes: editingSession?.notes || "",
    },
  });

  // Update form when selectedDate changes or dialog opens
  useEffect(() => {
    if (open) {
      if (editingSession) {
        // Populate form with editing session data
        const sessionDate = new Date(editingSession.date);
        const year = sessionDate.getFullYear();
        const month = String(sessionDate.getMonth() + 1).padStart(2, "0");
        const day = String(sessionDate.getDate()).padStart(2, "0");
        const localDateString = `${year}-${month}-${day}`;

        form.setValue("itemId", editingSession.itemId || "");
        form.setValue("teacherId", editingSession.teacherId || "none");
        form.setValue("date", localDateString);
        form.setValue("startTime", editingSession.startTime || "09:00");
        form.setValue("status", editingSession.status || "SCHEDULED");
        form.setValue("notes", editingSession.notes || "");
      } else {
        // Reset form for create mode
        const dateToUse = selectedDate || new Date();
        const year = dateToUse.getFullYear();
        const month = String(dateToUse.getMonth() + 1).padStart(2, "0");
        const day = String(dateToUse.getDate()).padStart(2, "0");
        const localDateString = `${year}-${month}-${day}`;

        form.setValue("date", localDateString);
        form.setValue("itemId", "");
        form.setValue("teacherId", "none");
        form.setValue("startTime", "09:00");
        form.setValue("status", "SCHEDULED");
        form.setValue("notes", "");
      }
    }
  }, [selectedDate, open, form, editingSession]);

  const onSubmit = (data: CreateSessionForm) => {
    // Convert "none" teacherId to undefined
    const submitData = {
      ...data,
      teacherId: data.teacherId === "none" ? undefined : data.teacherId,
    };

    if (isEditMode && editingSession) {
      // Update existing session
      updateSessionMutation.mutate(
        {
          sessionId: editingSession.id,
          data: submitData,
        },
        {
          onSuccess: () => {
            form.reset();
            onSuccess?.();
          },
        },
      );
    } else {
      // Create new session
      createSessionMutation.mutate(submitData, {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Session" : "Create New Session"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class/Activity</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class or activity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.duration} min)
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
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No teacher assigned</SelectItem>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name || teacher.email}
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
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(new Date(field.value + "T00:00:00"), "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, "0");
                            const day = String(date.getDate()).padStart(2, "0");
                            field.onChange(`${year}-${month}-${day}`);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any notes or special instructions..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createSessionMutation.isPending || updateSessionMutation.isPending || itemsLoading || teachersLoading
                }
                className="flex-1"
              >
                {createSessionMutation.isPending || updateSessionMutation.isPending
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update Session"
                    : "Create Session"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
