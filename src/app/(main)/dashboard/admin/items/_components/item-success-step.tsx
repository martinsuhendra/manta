"use client";

import * as React from "react";

import { CheckCircle2, Clock, Users, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Item, DAY_OF_WEEK_LABELS } from "./schema";

interface ItemSuccessStepProps {
  item: Item;
  onClose: () => void;
}

export function ItemSuccessStep({ item, onClose }: ItemSuccessStepProps) {
  const scheduleGroups = React.useMemo(() => {
    if (!item.schedules || item.schedules.length === 0) return [];

    const groupedByTime = new Map<string, number[]>();
    item.schedules.forEach((schedule) => {
      const key = `${schedule.startTime}-${schedule.endTime}`;
      if (!groupedByTime.has(key)) {
        groupedByTime.set(key, []);
      }
      groupedByTime.get(key)!.push(schedule.dayOfWeek);
    });

    return Array.from(groupedByTime.entries()).map(([time, days]) => {
      const [startTime, endTime] = time.split("-");
      return { days: [...days].sort((a, b) => a - b), startTime, endTime };
    });
  }, [item.schedules]);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-12">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="mb-2 text-2xl font-semibold">Item Created Successfully!</h3>
      <p className="text-muted-foreground mb-8 max-w-md text-center text-sm">
        Your item has been created with all the configured settings and schedules.
      </p>

      {/* Summary Card */}
      <div className="bg-card w-full max-w-2xl space-y-6 rounded-lg border p-6">
        <div>
          <h4 className="mb-4 text-lg font-semibold">Item Summary</h4>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Name</span>
                <span className="font-medium">{item.name}</span>
              </div>
              {item.description && (
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground text-sm">Description</span>
                  <span className="max-w-[60%] text-right text-sm">{item.description}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Status</span>
                <span className={`font-medium ${item.isActive ? "text-green-600" : "text-muted-foreground"}`}>
                  {item.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-xs">Duration</p>
                    <p className="font-medium">{item.duration} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-xs">Capacity</p>
                    <p className="font-medium">{item.capacity} people</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedules Summary */}
            {scheduleGroups.length > 0 && (
              <div className="border-t pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm font-medium">Schedules</span>
                </div>
                <div className="space-y-2">
                  {scheduleGroups.map((group, index) => {
                    const daysText =
                      group.days.length === 7
                        ? "Everyday"
                        : group.days.map((day) => DAY_OF_WEEK_LABELS[day]).join(", ");
                    return (
                      <div key={index} className="bg-muted rounded-md p-3 text-sm">
                        <p className="font-medium">{daysText}</p>
                        <p className="text-muted-foreground text-xs">
                          {group.startTime} - {group.endTime}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(!item.schedules || item.schedules.length === 0) && (
              <div className="border-t pt-4">
                <p className="text-muted-foreground text-sm">No schedules configured</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button onClick={onClose} className="min-w-[120px]">
          Close
        </Button>
      </div>
    </div>
  );
}
