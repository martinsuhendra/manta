"use client";

import * as React from "react";
import { useState } from "react";

import { Filter, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
              <Badge variant="secondary" className="ml-2 flex h-5 w-5 items-center justify-center rounded-full p-0">
                {activeFilterCount}
              </Badge>
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
        <div className="flex flex-wrap items-center gap-1">
          {filters.startDate && (
            <Badge variant="secondary" className="gap-1">
              From: {filters.startDate}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("startDate")} />
            </Badge>
          )}
          {filters.endDate && (
            <Badge variant="secondary" className="gap-1">
              To: {filters.endDate}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("endDate")} />
            </Badge>
          )}
          {filters.itemId && (
            <Badge variant="secondary" className="gap-1">
              {items.find((item) => item.id === filters.itemId)?.name || "Unknown Item"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("itemId")} />
            </Badge>
          )}
          {filters.teacherId && (
            <Badge variant="secondary" className="gap-1">
              {filters.teacherId === "unassigned"
                ? "Unassigned"
                : teachers.find((teacher) => teacher.id === filters.teacherId)?.name ||
                  teachers.find((teacher) => teacher.id === filters.teacherId)?.email ||
                  "Unknown Teacher"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("teacherId")} />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              {filters.status}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("status")} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
