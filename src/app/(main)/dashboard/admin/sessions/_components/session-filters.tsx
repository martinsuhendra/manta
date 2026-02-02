/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import * as React from "react";
import { useState, useEffect } from "react";

import { format } from "date-fns";
import { CalendarIcon, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useItems } from "@/hooks/use-items-query";
import { useTeachers } from "@/hooks/use-users-query";
import { cn } from "@/lib/utils";

import { SessionFilter } from "./schema";

interface SessionFiltersProps {
  appliedFilters: SessionFilter;
  onFilterChange: (filters: SessionFilter) => void;
}

export function SessionFilters({ appliedFilters, onFilterChange }: SessionFiltersProps) {
  const [draftFilters, setDraftFilters] = useState<SessionFilter>(appliedFilters);
  const [isOpen, setIsOpen] = useState(false);

  const { data: items = [] } = useItems();
  const { data: teachers = [] } = useTeachers();

  useEffect(() => {
    if (isOpen) {
      setDraftFilters(appliedFilters);
    }
  }, [isOpen, appliedFilters]);

  const updateDraft = (key: keyof SessionFilter, value: string | undefined) => {
    const filterValue = value === "all" ? undefined : value;
    const newFilters = { ...draftFilters, [key]: filterValue || undefined };
    Object.keys(newFilters).forEach((k) => {
      if (newFilters[k as keyof SessionFilter] === undefined) {
        delete newFilters[k as keyof SessionFilter];
      }
    });
    setDraftFilters(newFilters);
  };

  const handleApply = () => {
    onFilterChange(draftFilters);
    setIsOpen(false);
  };

  const handleClearAll = () => {
    setDraftFilters({});
  };

  const activeFilterCount = Object.values(appliedFilters).filter((value) => value !== undefined && value !== "").length;

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <StatusBadge
                variant="secondary"
                className="ml-2 flex h-5 w-5 items-center justify-center rounded-full p-0"
              >
                {activeFilterCount}
              </StatusBadge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px]" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Sessions</h4>
              {Object.keys(draftFilters).length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !draftFilters.startDate && "text-muted-foreground",
                      )}
                    >
                      {draftFilters.startDate ? (
                        format(new Date(draftFilters.startDate + "T00:00:00"), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={draftFilters.startDate ? new Date(draftFilters.startDate + "T00:00:00") : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          updateDraft("startDate", `${year}-${month}-${day}`);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !draftFilters.endDate && "text-muted-foreground",
                      )}
                    >
                      {draftFilters.endDate ? (
                        format(new Date(draftFilters.endDate + "T00:00:00"), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={draftFilters.endDate ? new Date(draftFilters.endDate + "T00:00:00") : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          updateDraft("endDate", `${year}-${month}-${day}`);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Item Filter */}
            <div className="space-y-1">
              <Label className="text-xs">Class/Activity</Label>
              <Select value={draftFilters.itemId || "all"} onValueChange={(value) => updateDraft("itemId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher Filter */}
            <div className="space-y-1">
              <Label className="text-xs">Teacher</Label>
              <Select
                value={draftFilters.teacherId || "all"}
                onValueChange={(value) => updateDraft("teacherId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teachers</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name || teacher.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={draftFilters.status || "all"} onValueChange={(value) => updateDraft("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleApply}>
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
