"use client";

import { useEffect, useMemo, useState } from "react";

import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

import { UserCombobox } from "@/app/(main)/dashboard/admin/memberships/_components/user-combobox";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useItems } from "@/hooks/use-items-query";
import { useCreatePrivateSession } from "@/hooks/use-sessions-mutation";
import { usePrivateSessionEligibility } from "@/hooks/use-sessions-query";
import { useTeachers, useUsers } from "@/hooks/use-users-query";
import { USER_ROLES } from "@/lib/types";
import { cn } from "@/lib/utils";

import { TIME_SLOTS } from "./schema";

interface PrivateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/* eslint-disable complexity */
export function PrivateSessionDialog({ open, onOpenChange, onSuccess }: PrivateSessionDialogProps) {
  const [itemId, setItemId] = useState("");
  const [teacherId, setTeacherId] = useState("none");
  const [memberId, setMemberId] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState("09:00");
  const [notes, setNotes] = useState("");

  const { data: authSession } = useSession();
  const { data: items = [], isLoading: isItemsLoading } = useItems();
  const { data: members = [], isLoading: isMembersLoading } = useUsers({ role: USER_ROLES.MEMBER });
  const { data: teachers = [], isLoading: isTeachersLoading } = useTeachers();
  const createPrivateSessionMutation = useCreatePrivateSession();
  const isTeacherUser = authSession?.user.role === USER_ROLES.TEACHER;
  const actorUserId = authSession ? authSession.user.id : null;

  const eligibilityQuery = usePrivateSessionEligibility({
    userId: memberId || undefined,
    itemId: itemId || undefined,
    enabled: open,
  });
  const memberships = eligibilityQuery.data?.memberships ?? [];

  const memberOptions = useMemo(
    () =>
      members.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
      })),
    [members],
  );

  useEffect(() => {
    if (!open) return;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    setDate(`${year}-${month}-${day}`);
    if (isTeacherUser && actorUserId) setTeacherId(actorUserId);
  }, [open, isTeacherUser, actorUserId]);

  useEffect(() => {
    setMembershipId("");
  }, [memberId, itemId]);

  const isSubmitDisabled =
    !itemId ||
    !memberId ||
    !membershipId ||
    !date ||
    !startTime ||
    createPrivateSessionMutation.isPending ||
    isItemsLoading ||
    isMembersLoading ||
    isTeachersLoading;

  const resetForm = () => {
    setItemId("");
    setTeacherId(isTeacherUser && actorUserId ? actorUserId : "none");
    setMemberId("");
    setMembershipId("");
    setStartTime("09:00");
    setNotes("");
  };

  const handleSubmit = () => {
    if (isSubmitDisabled) return;

    createPrivateSessionMutation.mutate(
      {
        userId: memberId,
        itemId,
        membershipId,
        teacherId: teacherId === "none" ? undefined : teacherId,
        date,
        startTime,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create Private Session</DialogTitle>
          <DialogDescription>Create an internal appointment visible only to the appointed member.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select value={teacherId} onValueChange={setTeacherId} disabled={isTeacherUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No teacher assigned</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name || teacher.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    {date ? format(new Date(`${date}T00:00:00`), "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date ? new Date(`${date}T00:00:00`) : undefined}
                    onSelect={(selectedDate) => {
                      if (!selectedDate) return;
                      const year = selectedDate.getFullYear();
                      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
                      const day = String(selectedDate.getDate()).padStart(2, "0");
                      setDate(`${year}-${month}-${day}`);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Member</Label>
            <UserCombobox
              users={memberOptions}
              value={memberId}
              onValueChange={setMemberId}
              placeholder={isMembersLoading ? "Loading members..." : "Select a member"}
            />
          </div>

          <div className="space-y-2">
            <Label>Eligible Products / Memberships</Label>
            {!memberId || !itemId ? (
              <Alert>
                <AlertDescription>Select a class and member to load eligible products.</AlertDescription>
              </Alert>
            ) : eligibilityQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Checking eligible memberships...</AlertDescription>
              </Alert>
            ) : memberships.length === 0 ? (
              <Alert>
                <AlertDescription>No eligible memberships found for this class and member.</AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="max-h-52 rounded-md border p-3">
                <RadioGroup value={membershipId} onValueChange={setMembershipId}>
                  <div className="space-y-2">
                    {memberships.map((membership) => (
                      <label
                        key={membership.id}
                        htmlFor={membership.id}
                        className={cn(
                          "hover:border-primary flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                          membershipId === membership.id && "border-primary bg-primary/5",
                        )}
                      >
                        <RadioGroupItem id={membership.id} value={membership.id} className="mt-1" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{membership.productName}</p>
                          <p className="text-muted-foreground text-xs">
                            Slots: {membership.slotsRequired} ·{" "}
                            {membership.remainingQuota === null
                              ? "Unlimited quota"
                              : `${membership.remainingQuota} quota left`}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Expires: {format(new Date(membership.expiredAt), "MMM d, yyyy")}
                          </p>
                        </div>
                        {membershipId === membership.id && <CheckCircle2 className="text-primary ml-auto h-4 w-4" />}
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </ScrollArea>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add session notes..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={createPrivateSessionMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {createPrivateSessionMutation.isPending ? "Creating..." : "Create Private Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
