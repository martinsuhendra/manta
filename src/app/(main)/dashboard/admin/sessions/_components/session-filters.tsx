"use client";

import * as React from "react";
import { useState } from "react";

import { Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useItems } from "@/hooks/use-items-query";
import { useTeachers } from "@/hooks/use-users-query";

import { SessionFilter } from "./schema";

interface SessionFiltersProps {
  onFilterChange: (filters: SessionFilter) => void;
}

export function SessionFilters({ onFilterChange }: SessionFiltersProps) {
  const [filters, setFilters] = useState<SessionFilter>({});
  const [isOpen, setIsOpen] = useState(false);

  const { data: items = [] } = useItems();
  const { data: teachers = [] } = useTeachers();

  const updateFilter = (key: keyof SessionFilter, value: string | undefined) => {
    // Convert "all" values to undefined (no filter)
    const filterValue = value === "all" ? undefined : value;

    const newFilters = {
      ...filters,
      [key]: filterValue || undefined,
    };

    // Remove undefined values
    Object.keys(newFilters).forEach((k) => {
      if (newFilters[k as keyof SessionFilter] === undefined) {
        delete newFilters[k as keyof SessionFilter];
      }
    });

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const clearFilter = (key: keyof SessionFilter) => {
    updateFilter(key, undefined);
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).filter((value) => value !== undefined && value !== "").length;

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
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Sessions</h4>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="start-date" className="text-xs">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => updateFilter("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="end-date" className="text-xs">
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => updateFilter("endDate", e.target.value)}
                />
              </div>
            </div>

            {/* Item Filter */}
            <div className="space-y-1">
              <Label className="text-xs">Class/Activity</Label>
              <Select value={filters.itemId || "all"} onValueChange={(value) => updateFilter("itemId", value)}>
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
              <Select value={filters.teacherId || "all"} onValueChange={(value) => updateFilter("teacherId", value)}>
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
              <Select value={filters.status || "all"} onValueChange={(value) => updateFilter("status", value)}>
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
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.startDate && (
            <div className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-full px-3 py-1 text-sm">
              <span>From: {filters.startDate}</span>
              <button
                type="button"
                className="hover:bg-secondary/80 flex h-4 w-4 items-center justify-center rounded-full transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearFilter("startDate");
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.endDate && (
            <div className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-full px-3 py-1 text-sm">
              <span>To: {filters.endDate}</span>
              <button
                type="button"
                className="hover:bg-secondary/80 flex h-4 w-4 items-center justify-center rounded-full transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearFilter("endDate");
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.itemId && (
            <div className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-full px-3 py-1 text-sm">
              <span>{items.find((item) => item.id === filters.itemId)?.name || "Unknown Item"}</span>
              <button
                type="button"
                className="hover:bg-secondary/80 flex h-4 w-4 items-center justify-center rounded-full transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearFilter("itemId");
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.teacherId && (
            <div className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-full px-3 py-1 text-sm">
              <span>
                {filters.teacherId === "unassigned"
                  ? "Unassigned"
                  : teachers.find((teacher) => teacher.id === filters.teacherId)?.name ||
                    teachers.find((teacher) => teacher.id === filters.teacherId)?.email ||
                    "Unknown Teacher"}
              </span>
              <button
                type="button"
                className="hover:bg-secondary/80 flex h-4 w-4 items-center justify-center rounded-full transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearFilter("teacherId");
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {filters.status && (
            <div className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-full px-3 py-1 text-sm">
              <span>{filters.status}</span>
              <button
                type="button"
                className="hover:bg-secondary/80 flex h-4 w-4 items-center justify-center rounded-full transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearFilter("status");
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
