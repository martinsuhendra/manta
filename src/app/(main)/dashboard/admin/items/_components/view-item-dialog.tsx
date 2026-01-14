"use client";

import * as React from "react";

import Image from "next/image";

import { format } from "date-fns";
import { Calendar, Clock, Users, User, Palette, Package, Percent } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/utils";

import { DAY_OF_WEEK_LABELS, Item } from "./schema";

interface ViewItemDialogProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
};

function ItemImage({ item }: { item: Item }) {
  if (!item.image) return null;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Item Image</span>
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

function ItemTeachers({ extendedItem }: { extendedItem: ExtendedItem }) {
  if (!extendedItem.teacherItems || extendedItem.teacherItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Assigned Teachers</span>
      <div className="space-y-2">
        {extendedItem.teacherItems.map((teacherItem) => {
          const teacherProfit = teacherItem.teacherProfitPercent || 60;
          const ownerProfit = 100 - teacherProfit;

          return (
            <div key={teacherItem.id} className="space-y-2 rounded border p-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{teacherItem.teacher.name || "No Name"}</div>
                  <div className="text-muted-foreground text-sm">{teacherItem.teacher.email}</div>
                </div>
              </div>
              <div className="bg-muted/50 flex items-center justify-between rounded p-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5" />
                  <span className="font-medium">Profit Split:</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span>
                    Teacher: <span className="font-semibold">{teacherProfit}%</span>
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span>
                    Owner: <span className="font-semibold">{ownerProfit}%</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemSchedules({ extendedItem }: { extendedItem: ExtendedItem }) {
  if (!extendedItem.schedules || extendedItem.schedules.length === 0) {
    return (
      <div className="space-y-3">
        <span className="text-sm font-medium">Weekly Schedule</span>
        <div className="bg-muted/50 rounded-lg border-2 border-dashed p-4 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
          <p className="text-muted-foreground text-sm">No schedules configured</p>
        </div>
      </div>
    );
  }

  const activeSchedules = extendedItem.schedules.filter((schedule) => schedule.isActive);

  if (activeSchedules.length === 0) {
    return (
      <div className="space-y-3">
        <span className="text-sm font-medium">Weekly Schedule</span>
        <div className="bg-muted/50 rounded-lg border-2 border-dashed p-4 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
          <p className="text-muted-foreground text-sm">No active schedules</p>
        </div>
      </div>
    );
  }

  // Group schedules by day of week
  const schedulesByDay = activeSchedules.reduce((acc, schedule) => {
    const day = schedule.dayOfWeek;
    const daySchedules = acc.get(day) || [];
    daySchedules.push(schedule);
    acc.set(day, daySchedules);
    return acc;
  }, new Map<number, typeof activeSchedules>());

  // Sort schedules within each day by start time
  schedulesByDay.forEach((daySchedules) => {
    daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Weekly Schedule</span>
        <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
          {activeSchedules.length} schedule{activeSchedules.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {Array.from({ length: 7 }, (_, dayIndex) => {
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
                        key={`${schedule.startTime}-${schedule.endTime}`}
                        className="bg-primary text-primary-foreground flex-shrink-0 rounded px-2.5 py-1 text-xs font-medium whitespace-nowrap"
                      >
                        {schedule.startTime} - {schedule.endTime}
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

  if (!item) return null;

  const extendedItem = item as ExtendedItem;

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
          <ItemSchedules extendedItem={extendedItem} />
          <ItemTeachers extendedItem={extendedItem} />
          <ItemTimestamps item={item} />
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
