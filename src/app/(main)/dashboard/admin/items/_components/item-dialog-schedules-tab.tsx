/* eslint-disable @typescript-eslint/no-unnecessary-condition, security/detect-object-injection, react/no-array-index-key, max-lines */
import * as React from "react";

import { Plus, X } from "lucide-react";
import { UseFormReturn, useFieldArray } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeachers } from "@/hooks/use-users-query";

import { CreateItemForm, DAY_OF_WEEK_LABELS, TIME_SLOTS } from "./schema";

// Constants
const DEFAULT_START_TIME = "09:00";
const DEFAULT_DURATION = 60;
const MINUTES_PER_DAY = 24 * 60;
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const NO_DEFAULT_TEACHER = "__NO_DEFAULT_TEACHER__";

// Types
interface ItemDialogSchedulesTabProps {
  form: UseFormReturn<CreateItemForm>;
  /** When false, local schedule UI resets so the next open re-syncs from the form. */
  dialogOpen: boolean;
  /** Bump when the edited item (or create vs edit) changes so we re-read `schedules` after parent `reset`. */
  scheduleSourceKey: string;
}

interface ScheduleGroup {
  days: number[];
  startTime: string;
  teacherId: string | null;
}

interface Schedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  teacherId?: string | null;
}

// Helper functions
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Map API / DB strings (e.g. `09:30:00`, `9:30`) to `HH:mm` on the same 15-min grid as `TIME_SLOTS` so Radix Select values match. */
function normalizeTimeToSlot(time: string): string {
  if (!time || typeof time !== "string") return DEFAULT_START_TIME;
  const segments = time.trim().split(":");
  const h = Number.parseInt(segments[0] ?? "0", 10);
  const m = Number.parseInt(segments[1] ?? "0", 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return DEFAULT_START_TIME;
  let total = h * 60 + m;
  total = Math.max(0, Math.min(total, MINUTES_PER_DAY - 1));
  const snapped = Math.floor(total / 15) * 15;
  return minutesToTime(snapped);
}

function normalizeScheduleTimes(schedule: Schedule): Schedule {
  return {
    ...schedule,
    startTime: normalizeTimeToSlot(schedule.startTime),
    endTime: normalizeTimeToSlot(schedule.endTime),
  };
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function calculateEndTime(startTime: string, duration: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + duration;
  return endMinutes < MINUTES_PER_DAY ? minutesToTime(endMinutes) : "23:59";
}

/** When duration grows (or changes), keep a start time that still fits in the day (same rules as TIME_SLOTS filter). */
function clampStartTimeForDuration(startTime: string, duration: number): string {
  const durationToUse = duration > 0 ? duration : DEFAULT_DURATION;
  if (timeToMinutes(startTime) + durationToUse < MINUTES_PER_DAY) return startTime;

  const validSlots = TIME_SLOTS.filter((t) => timeToMinutes(t) + durationToUse < MINUTES_PER_DAY);
  if (validSlots.length === 0) return DEFAULT_START_TIME;

  const startMinutes = timeToMinutes(startTime);
  let best = validSlots[0];
  for (const slot of validSlots) {
    if (timeToMinutes(slot) <= startMinutes) best = slot;
    else break;
  }
  return best;
}

function convertSchedulesToGroups(schedules: Schedule[]): ScheduleGroup[] {
  if (!schedules || schedules.length === 0) return [];

  const groupedByTime = new Map<string, ScheduleGroup>();

  schedules.forEach((schedule) => {
    const normalized = normalizeScheduleTimes(schedule);
    const key = `${normalized.startTime}|${normalized.teacherId ?? ""}`;
    if (!groupedByTime.has(key)) {
      groupedByTime.set(key, {
        days: [],
        startTime: normalized.startTime,
        teacherId: normalized.teacherId ?? null,
      });
    }
    groupedByTime.get(key)!.days.push(normalized.dayOfWeek);
  });

  return Array.from(groupedByTime.values()).map((group) => ({
    ...group,
    days: [...group.days].sort((a, b) => a - b),
  }));
}

function convertGroupsToSchedules(groups: ScheduleGroup[], duration: number): Schedule[] {
  const schedules: Schedule[] = [];
  const durationToUse = duration > 0 ? duration : DEFAULT_DURATION;

  groups.forEach((group) => {
    group.days.forEach((dayIndex) => {
      const startMinutes = timeToMinutes(group.startTime);
      const endMinutes = startMinutes + durationToUse;

      if (endMinutes < MINUTES_PER_DAY) {
        schedules.push({
          dayOfWeek: dayIndex,
          teacherId: group.teacherId,
          startTime: group.startTime,
          endTime: minutesToTime(endMinutes),
          isActive: true,
        });
      }
    });
  });

  return schedules;
}

function checkTimeOverlap(currentStart: number, currentEnd: number, otherStart: number, otherEnd: number): boolean {
  return (
    (currentStart >= otherStart && currentStart < otherEnd) ||
    (currentEnd > otherStart && currentEnd <= otherEnd) ||
    (currentStart <= otherStart && currentEnd >= otherEnd)
  );
}

// Sub-components
interface DayCheckboxProps {
  groupIndex: number;
  dayIndex: number;
  day: string;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}

const DayCheckbox = React.memo(({ groupIndex, dayIndex, day, isSelected, isDisabled, onToggle }: DayCheckboxProps) => (
  <div
    className={`hover:bg-accent flex items-center space-x-2 rounded-md p-2 transition-colors ${
      isDisabled ? "opacity-50" : ""
    }`}
  >
    <Checkbox
      id={`day-${groupIndex}-${dayIndex}`}
      checked={isSelected}
      disabled={isDisabled}
      onCheckedChange={onToggle}
    />
    <label
      htmlFor={`day-${groupIndex}-${dayIndex}`}
      className="flex-1 cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {day}
    </label>
  </div>
));

DayCheckbox.displayName = "DayCheckbox";

interface TimeGroupProps {
  group: ScheduleGroup;
  groupIndex: number;
  duration: number;
  scheduleGroups: ScheduleGroup[];
  teacherOptions: Array<{ id: string; label: string }>;
  onRemove: () => void;
  onToggleDay: (dayIndex: number) => void;
  onToggleEveryday: (checked: boolean) => void;
  onStartTimeChange: (startTime: string) => void;
  onTeacherChange: (teacherId: string | null) => void;
}

const TimeGroup = React.memo(
  ({
    group,
    groupIndex,
    duration,
    scheduleGroups,
    teacherOptions,
    onRemove,
    onToggleDay,
    onToggleEveryday,
    onStartTimeChange,
    onTeacherChange,
  }: TimeGroupProps) => {
    const isEveryday = group.days.length === 7;
    const durationToUse = duration > 0 ? duration : DEFAULT_DURATION;
    const calculatedEndTime = calculateEndTime(group.startTime, durationToUse);
    const currentStart = timeToMinutes(group.startTime);
    const currentEnd = currentStart + durationToUse;

    const hasTimeOverlap = React.useCallback(
      (dayIndex: number): boolean => {
        return scheduleGroups.some((otherGroup, otherIndex) => {
          if (otherIndex === groupIndex) return false;
          if (!otherGroup.days.includes(dayIndex)) return false;

          const otherStart = timeToMinutes(otherGroup.startTime);
          const otherEnd = otherStart + durationToUse;

          return checkTimeOverlap(currentStart, currentEnd, otherStart, otherEnd);
        });
      },
      [scheduleGroups, groupIndex, currentStart, currentEnd, durationToUse],
    );

    const availableTimeSlots = React.useMemo(
      () =>
        TIME_SLOTS.filter((time) => {
          const timeMinutes = timeToMinutes(time);
          return timeMinutes + durationToUse < MINUTES_PER_DAY;
        }),
      [durationToUse],
    );

    const selectedDaysText = React.useMemo(() => {
      if (isEveryday) return "Everyday";
      return group.days.map((dayIndex) => DAY_OF_WEEK_LABELS[dayIndex]).join(", ");
    }, [isEveryday, group.days]);
    const selectedTeacherLabel = React.useMemo(() => {
      if (!group.teacherId) return "No default";
      return teacherOptions.find((teacher) => teacher.id === group.teacherId)?.label ?? "Unknown teacher";
    }, [group.teacherId, teacherOptions]);

    return (
      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-medium">Time Group {groupIndex + 1}</h5>
          {scheduleGroups.length > 1 && (
            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Day Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Days</label>
            <div className="space-y-3">
              {/* Everyday Option */}
              <div className="hover:bg-accent mt-1 flex items-center space-x-2 rounded-md p-2 transition-colors">
                <Checkbox
                  id={`everyday-${groupIndex}`}
                  checked={isEveryday}
                  onCheckedChange={(checked) => onToggleEveryday(checked === true)}
                />
                <label
                  htmlFor={`everyday-${groupIndex}`}
                  className="flex-1 cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Everyday
                </label>
              </div>

              {/* Individual Days */}
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                {DAY_OF_WEEK_LABELS.map((day, dayIndex) => {
                  const isSelected = group.days.includes(dayIndex);
                  const hasOverlap = hasTimeOverlap(dayIndex);

                  return (
                    <DayCheckbox
                      key={dayIndex}
                      groupIndex={groupIndex}
                      dayIndex={dayIndex}
                      day={day}
                      isSelected={isSelected}
                      isDisabled={hasOverlap && !isSelected}
                      onToggle={() => onToggleDay(dayIndex)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Start Time Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Time</label>
            <Select value={group.startTime} onValueChange={onStartTimeChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {availableTimeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {group.startTime && (
              <p className="text-muted-foreground text-xs">
                End time: {calculatedEndTime} ({durationToUse} min)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Default Teacher</label>
            <Select
              value={group.teacherId ?? NO_DEFAULT_TEACHER}
              onValueChange={(value) => onTeacherChange(value === NO_DEFAULT_TEACHER ? null : value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a default teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DEFAULT_TEACHER}>No default</SelectItem>
                {teacherOptions.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview */}
        {group.days.length > 0 && (
          <div className="bg-muted rounded-md p-2">
            <p className="text-muted-foreground text-xs">
              {selectedDaysText} at {group.startTime} - {calculatedEndTime} ({selectedTeacherLabel})
            </p>
          </div>
        )}
      </div>
    );
  },
);

TimeGroup.displayName = "TimeGroup";

// Main component
export function ItemDialogSchedulesTab({ form, dialogOpen, scheduleSourceKey }: ItemDialogSchedulesTabProps) {
  const { data: teachers = [] } = useTeachers();
  const { replace } = useFieldArray({
    control: form.control,
    name: "schedules",
  });
  const teacherOptions = React.useMemo(
    () =>
      teachers.map((teacher) => ({
        id: teacher.id,
        label: teacher.name || teacher.email || "Unnamed teacher",
      })),
    [teachers],
  );

  const duration = form.watch("duration");
  const [scheduleGroups, setScheduleGroups] = React.useState<ScheduleGroup[]>([
    { days: [], startTime: DEFAULT_START_TIME, teacherId: null },
  ]);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Parent `form.reset` runs in the same commit as this mount; child `useEffect` can run before reset.
  // Defer read so we sync from the form after schedules are populated. Re-run when dialog/item source changes.
  React.useEffect(() => {
    if (!dialogOpen) {
      setIsInitialized(false);
      setScheduleGroups([{ days: [], startTime: DEFAULT_START_TIME, teacherId: null }]);
      return;
    }

    queueMicrotask(() => {
      const existingSchedules = (form.getValues("schedules") ?? []) as Schedule[];
      const normalized = existingSchedules.map(normalizeScheduleTimes);
      const groups = convertSchedulesToGroups(normalized);

      if (groups.length > 0) setScheduleGroups(groups);
      else setScheduleGroups([{ days: [], startTime: DEFAULT_START_TIME, teacherId: null }]);

      setIsInitialized(true);
    });
  }, [dialogOpen, scheduleSourceKey, form]);

  // Clamp start times to fit duration, then sync to form (single pass avoids stale form when duration changes on step 1)
  React.useEffect(() => {
    if (!isInitialized) return;

    const durationToUse = duration > 0 ? duration : DEFAULT_DURATION;
    const nextGroups = scheduleGroups.map((group) => {
      const clamped = clampStartTimeForDuration(group.startTime, durationToUse);
      return clamped === group.startTime ? group : { ...group, startTime: clamped };
    });
    const groupsMatch =
      nextGroups.length === scheduleGroups.length &&
      nextGroups.every(
        (g, i) =>
          g.startTime === scheduleGroups[i].startTime &&
          g.teacherId === scheduleGroups[i].teacherId &&
          g.days.length === scheduleGroups[i].days.length &&
          g.days.every((d, j) => d === scheduleGroups[i].days[j]),
      );

    replace(convertGroupsToSchedules(nextGroups, duration));
    if (!groupsMatch) setScheduleGroups(nextGroups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleGroups, duration, isInitialized]);

  // Handlers
  const handleAddGroup = React.useCallback(() => {
    setScheduleGroups((prev) => [...prev, { days: [], startTime: DEFAULT_START_TIME, teacherId: null }]);
  }, []);

  const handleRemoveGroup = React.useCallback((index: number) => {
    setScheduleGroups((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleToggleDay = React.useCallback((groupIndex: number, dayIndex: number) => {
    setScheduleGroups((prev) => {
      const newGroups = [...prev];
      const group = { ...newGroups[groupIndex] };

      if (group.days.includes(dayIndex)) {
        group.days = group.days.filter((d) => d !== dayIndex);
      } else {
        group.days = [...group.days, dayIndex].sort((a, b) => a - b);
      }

      newGroups[groupIndex] = group;
      return newGroups;
    });
  }, []);

  const handleToggleEveryday = React.useCallback((groupIndex: number, checked: boolean) => {
    setScheduleGroups((prev) => {
      const newGroups = [...prev];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        days: checked ? [...ALL_DAYS] : [],
      };
      return newGroups;
    });
  }, []);

  const handleStartTimeChange = React.useCallback((groupIndex: number, startTime: string) => {
    setScheduleGroups((prev) => {
      const newGroups = [...prev];
      newGroups[groupIndex] = { ...newGroups[groupIndex], startTime };
      return newGroups;
    });
  }, []);

  const handleTeacherChange = React.useCallback((groupIndex: number, teacherId: string | null) => {
    setScheduleGroups((prev) => {
      const newGroups = [...prev];
      newGroups[groupIndex] = { ...newGroups[groupIndex], teacherId };
      return newGroups;
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Schedules</h3>
          <p className="text-muted-foreground text-sm">Define when this item is available</p>
        </div>
      </div>

      <div className="space-y-4">
        {scheduleGroups.map((group, groupIndex) => (
          <TimeGroup
            key={groupIndex}
            group={group}
            groupIndex={groupIndex}
            duration={duration}
            scheduleGroups={scheduleGroups}
            teacherOptions={teacherOptions}
            onRemove={() => handleRemoveGroup(groupIndex)}
            onToggleDay={(dayIndex) => handleToggleDay(groupIndex, dayIndex)}
            onToggleEveryday={(checked) => handleToggleEveryday(groupIndex, checked)}
            onStartTimeChange={(startTime) => handleStartTimeChange(groupIndex, startTime)}
            onTeacherChange={(teacherId) => handleTeacherChange(groupIndex, teacherId)}
          />
        ))}

        <Button type="button" variant="outline" onClick={handleAddGroup} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Another Time Group
        </Button>
      </div>

      {scheduleGroups.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          <p>No schedules defined</p>
          <p className="text-sm">Add a time group to get started</p>
        </div>
      )}
    </div>
  );
}
