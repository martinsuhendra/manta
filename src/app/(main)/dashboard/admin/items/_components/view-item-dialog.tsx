"use client";

import * as React from "react";

import Image from "next/image";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Clock, Loader2, Palette, Package, Sparkles, Users } from "lucide-react";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useIsMobile } from "@/hooks/use-mobile";

import { DAY_OF_WEEK_LABELS, Item } from "./schema";

interface ViewItemDialogProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TeacherOption {
  id: string;
  label: string;
}

type ExtendedItem = Item & {
  _count?: {
    teacherItems: number;
    schedules: number;
    classSessions: number;
  };
  teacherItems?: Array<{
    id: string;
    teacherProfitPercent: number;
    teacher: {
      id: string;
      name: string | null;
      email: string | null;
    };
  }>;
  schedules?: Array<{
    id?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
    teacherId?: string | null;
    teacher?: {
      id: string;
      name: string | null;
      email: string | null;
    } | null;
  }>;
};

type ItemSchedule = NonNullable<ExtendedItem["schedules"]>[number];
type ItemSchedules = NonNullable<ExtendedItem["schedules"]>;

interface ChangeScheduleTeacherPayload {
  schedule: ItemSchedule;
  teacherId: string | null;
}

const NO_DEFAULT_TEACHER = "__NO_DEFAULT_TEACHER__";
const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

function getScheduleKey(schedule: ItemSchedule): string {
  return schedule.id ?? `${schedule.dayOfWeek}-${schedule.startTime}-${schedule.endTime}`;
}

function groupSchedulesByDay(schedules: ItemSchedules): Map<number, ItemSchedules> {
  return schedules.reduce((acc, schedule) => {
    const daySchedules = acc.get(schedule.dayOfWeek) ?? [];
    daySchedules.push(schedule);
    acc.set(schedule.dayOfWeek, daySchedules);
    return acc;
  }, new Map<number, ItemSchedules>());
}

function ScheduleEmptyState({ message }: { message: string }) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">Weekly Schedule</span>
      <div className="bg-muted/50 rounded-lg border-2 border-dashed p-4 text-center">
        <Calendar className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

function toSchedulePayload(schedules: ItemSchedules) {
  return schedules.map((schedule) => ({
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    isActive: schedule.isActive,
    teacherId: schedule.teacherId ?? null,
  }));
}

function ItemImage({ item }: { item: Item }) {
  if (!item.image) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Item Image</h4>
      <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-lg border">
        <Image src={item.image} alt={item.name} fill className="object-cover" />
      </div>
    </div>
  );
}

function ItemDescription({ item }: { item: Item }) {
  if (!item.description) return null;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Description</span>
      <p className="text-muted-foreground text-sm">{item.description}</p>
    </div>
  );
}

function ItemBasicInfo({ item }: { item: Item }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            Duration
          </div>
          <p className="text-lg font-semibold">{item.duration} minutes</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Capacity
          </div>
          <p className="text-lg font-semibold">{item.capacity} participants</p>
        </div>
      </div>

      {item.color && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Palette className="h-4 w-4" />
            Color
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: item.color }} />
            <span className="font-medium">{item.color}</span>
          </div>
        </div>
      )}
    </>
  );
}

function ItemStatistics({ extendedItem }: { extendedItem: ExtendedItem }) {
  return (
    <div className="space-y-2">
      <span className="mb-3 text-sm font-medium">Statistics</span>
      <div className="mt-1 grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <div className="text-lg font-bold">{extendedItem._count?.teacherItems || 0}</div>
          <div className="text-muted-foreground text-xs">Teachers</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-lg font-bold">{extendedItem._count?.schedules || 0}</div>
          <div className="text-muted-foreground text-xs">Schedules</div>
        </div>
      </div>
    </div>
  );
}

function AssignDefaultTeacherDialog({
  open,
  onOpenChange,
  schedules,
  teacherOptions,
  onChangeTeacher,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedules: ItemSchedules;
  teacherOptions: TeacherOption[];
  onChangeTeacher: (payload: ChangeScheduleTeacherPayload) => void;
  isSaving: boolean;
}) {
  const activeSchedules = React.useMemo(
    () =>
      schedules
        .filter((schedule) => schedule.isActive)
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)),
    [schedules],
  );
  const schedulesByDay = React.useMemo(() => groupSchedulesByDay(activeSchedules), [activeSchedules]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[95vh] sm:max-w-2xl sm:rounded-lg">
        <DialogHeader className="border-b px-4 py-3 pr-10 sm:px-6 sm:py-4">
          <DialogTitle>Assign Default Teachers</DialogTitle>
          <DialogDescription>Set a default teacher for each schedule slot.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {WEEK_DAYS.map((dayIndex) => {
            const daySchedules = schedulesByDay.get(dayIndex) ?? [];
            if (daySchedules.length === 0) return null;

            return (
              <div key={dayIndex} className="space-y-2">
                <p className="text-sm font-semibold">{DAY_OF_WEEK_LABELS.at(dayIndex) ?? `Day ${dayIndex}`}</p>
                <div className="space-y-2">
                  {daySchedules.map((schedule) => (
                    <div
                      key={getScheduleKey(schedule)}
                      className="bg-muted/40 grid grid-cols-[minmax(0,1fr)_220px] items-center gap-3 rounded-md border p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-xs">
                          {schedule.startTime} - {schedule.endTime}
                        </p>
                      </div>
                      <Select
                        value={schedule.teacherId ?? NO_DEFAULT_TEACHER}
                        onValueChange={(value) =>
                          onChangeTeacher({
                            schedule,
                            teacherId: value === NO_DEFAULT_TEACHER ? null : value,
                          })
                        }
                        disabled={teacherOptions.length === 0 || isSaving}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Default teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_DEFAULT_TEACHER}>No default teacher</SelectItem>
                          {teacherOptions.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter className="border-t px-4 py-3 sm:px-6 sm:py-4">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemSchedules({
  schedules,
  onOpenAssignDialog,
}: {
  schedules: ItemSchedules;
  onOpenAssignDialog: () => void;
}) {
  if (schedules.length === 0) return <ScheduleEmptyState message="No schedules configured" />;

  const activeSchedules = schedules.filter((schedule) => schedule.isActive);

  if (activeSchedules.length === 0) return <ScheduleEmptyState message="No active schedules" />;

  const schedulesByDay = groupSchedulesByDay(activeSchedules);
  schedulesByDay.forEach((daySchedules) => {
    daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Weekly Schedule</span>
      </div>

      <button
        type="button"
        onClick={onOpenAssignDialog}
        className="bg-primary/5 hover:bg-primary/10 border-primary/20 flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors"
      >
        <div className="bg-primary/15 text-primary rounded-md p-2">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Assign Default Teacher</p>
          <p className="text-muted-foreground text-xs">Set default teachers for each schedule slot</p>
        </div>
      </button>

      <div className="grid grid-cols-1 gap-2">
        {WEEK_DAYS.map((dayIndex) => {
          const daySchedules = schedulesByDay.get(dayIndex) ?? [];
          const hasSchedules = daySchedules.length > 0;

          return (
            <div
              key={dayIndex}
              className={`rounded-lg border p-3 transition-colors ${
                hasSchedules ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-muted"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-shrink-0 items-center gap-2">
                  <Calendar className={`h-4 w-4 ${hasSchedules ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${hasSchedules ? "text-foreground" : "text-muted-foreground"}`}>
                    {DAY_OF_WEEK_LABELS.at(dayIndex) ?? `Day ${dayIndex}`}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-wrap justify-end gap-1.5">
                  {hasSchedules ? (
                    daySchedules.map((schedule) => (
                      <span
                        key={getScheduleKey(schedule)}
                        className="bg-primary text-primary-foreground flex-shrink-0 rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap"
                      >
                        {schedule.startTime} - {schedule.endTime}
                        {schedule.teacher ? ` • ${schedule.teacher.name || schedule.teacher.email || "Teacher"}` : ""}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemTimestamps({ item }: { item: Item }) {
  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Created</span>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(item.createdAt), "MMM dd, yyyy")}
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Last Updated</span>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(item.updatedAt), "MMM dd, yyyy")}
        </div>
      </div>
    </div>
  );
}

export function ViewItemDialog({ item, open, onOpenChange }: ViewItemDialogProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const extendedItem = item as ExtendedItem | null;
  const [isAssignTeacherDialogOpen, setIsAssignTeacherDialogOpen] = React.useState(false);
  const [schedules, setSchedules] = React.useState<ItemSchedules>(extendedItem?.schedules ?? []);
  const teacherById = React.useMemo(
    () =>
      new Map((extendedItem?.teacherItems ?? []).map((teacherItem) => [teacherItem.teacher.id, teacherItem.teacher])),
    [extendedItem?.teacherItems],
  );
  const teacherOptions = React.useMemo(
    () =>
      extendedItem?.teacherItems?.map((teacherItem) => ({
        id: teacherItem.teacher.id,
        label: teacherItem.teacher.name || teacherItem.teacher.email || "Unnamed teacher",
      })) ?? [],
    [extendedItem?.teacherItems],
  );

  React.useEffect(() => {
    setSchedules(extendedItem?.schedules ?? []);
  }, [extendedItem?.schedules, extendedItem?.id, open]);

  const updateSchedulesMutation = useMutation({
    mutationFn: async (nextSchedules: ItemSchedules) => {
      if (!extendedItem?.id) throw new Error("Item is required");

      const response = await fetch(`/api/admin/items/${extendedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules: toSchedulePayload(nextSchedules) }),
      });
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || "Failed to update default teachers");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });
    },
  });

  const handleChangeScheduleTeacher = React.useCallback(
    ({ schedule, teacherId }: ChangeScheduleTeacherPayload) => {
      const previousSchedules = schedules;
      const nextSchedules = schedules.map((current) => {
        const isMatch =
          (current.id && schedule.id && current.id === schedule.id) ||
          (current.dayOfWeek === schedule.dayOfWeek &&
            current.startTime === schedule.startTime &&
            current.endTime === schedule.endTime);
        if (!isMatch) return current;
        return {
          ...current,
          teacherId,
          teacher: teacherId == null ? null : (teacherById.get(teacherId) ?? null),
        };
      });

      setSchedules(nextSchedules);
      updateSchedulesMutation.mutate(nextSchedules, {
        onError: (error) => {
          setSchedules(previousSchedules);
          toast.error(error.message);
        },
        onSuccess: () => {
          toast.success("Default teacher updated");
        },
      });
    },
    [schedules, teacherById, updateSchedulesMutation],
  );

  if (!item || !extendedItem) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? "bottom" : "right"}>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle className="flex items-center gap-2">
            {item.color && <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: item.color }} />}
            <Package className="h-5 w-5" />
            {item.name}
          </DrawerTitle>
          <DrawerDescription>Item details and configuration</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <ItemImage item={item} />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <StatusBadge variant={item.isActive ? "success" : "secondary"}>
              {item.isActive ? "Active" : "Inactive"}
            </StatusBadge>
          </div>

          <ItemDescription item={item} />
          <ItemBasicInfo item={item} />
          <ItemStatistics extendedItem={extendedItem} />
          <ItemSchedules schedules={schedules} onOpenAssignDialog={() => setIsAssignTeacherDialogOpen(true)} />
          <ItemTimestamps item={item} />
        </div>
        <AssignDefaultTeacherDialog
          open={isAssignTeacherDialogOpen}
          onOpenChange={setIsAssignTeacherDialogOpen}
          schedules={schedules}
          teacherOptions={teacherOptions}
          onChangeTeacher={handleChangeScheduleTeacher}
          isSaving={updateSchedulesMutation.isPending}
        />

        <DrawerFooter>
          {updateSchedulesMutation.isPending && (
            <div className="text-muted-foreground flex items-center gap-2 px-4 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving default teacher...
            </div>
          )}
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
