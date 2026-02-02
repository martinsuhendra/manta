"use client";

import * as React from "react";
import { useState, useEffect } from "react";

import { User } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeachers } from "@/hooks/use-users-query";

interface BulkAssignTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionIds: string[];
  onSuccess?: () => void;
}

export function BulkAssignTeacherDialog({ open, onOpenChange, sessionIds, onSuccess }: BulkAssignTeacherDialogProps) {
  const [teacherId, setTeacherId] = useState<string>("unassigned");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: teachers = [], isLoading: isLoadingTeachers } = useTeachers();

  useEffect(() => {
    if (!open) {
      setTeacherId("unassigned");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (sessionIds.length === 0) {
      toast.error("No sessions selected");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/sessions/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionIds,
          teacherId: teacherId === "unassigned" ? null : teacherId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to assign teacher");
      }

      toast.success(`Teacher assigned to ${sessionIds.length} session(s)`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Assign Teacher</DialogTitle>
          <DialogDescription>
            Assign a teacher to {sessionIds.length} selected session{sessionIds.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="teacher">Teacher</Label>
            <Select value={teacherId} onValueChange={setTeacherId} disabled={isLoadingTeachers}>
              <SelectTrigger id="teacher">
                <User className="text-muted-foreground mr-2 h-4 w-4" />
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name || teacher.email || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Assigning..." : "Assign Teacher"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
