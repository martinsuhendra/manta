/* eslint-disable react/no-array-index-key */
"use client";

import * as React from "react";
import { useState, useMemo } from "react";

import { format, addDays, startOfDay, startOfMonth, subDays } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { useSessions } from "@/hooks/use-sessions-query";

import { BulkAssignTeacherDialog } from "./bulk-assign-teacher-dialog";
import { SessionFilter, Session } from "./schema";
import { createSessionColumns } from "./session-columns";

interface SessionListProps {
  filters: SessionFilter;
  onEditSession?: (session: Session) => void;
}

const DATE_RANGE_DAYS = 30;

export function SessionList({ filters, onEditSession }: SessionListProps) {
  const [currentStartDate, setCurrentStartDate] = useState(() => startOfMonth(new Date()));
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

  // Calculate date range for fetching (30 days from start date)
  const dateRange = useMemo(() => {
    const start = startOfDay(currentStartDate);
    const end = startOfDay(addDays(start, DATE_RANGE_DAYS - 1));
    return { start, end };
  }, [currentStartDate]);

  // Merge date range with existing filters - use filter dates when provided, else default range
  const filtersWithDateRange = useMemo<SessionFilter>(() => {
    return {
      ...filters,
      startDate: filters.startDate ?? dateRange.start.toISOString().split("T")[0],
      endDate: filters.endDate ?? dateRange.end.toISOString().split("T")[0],
    };
  }, [filters, dateRange]);

  const { data: sessions = [], isLoading, refetch } = useSessions(filtersWithDateRange);

  const handlePreviousPeriod = () => {
    setCurrentStartDate((prev) => subDays(prev, DATE_RANGE_DAYS));
  };

  const handleNextPeriod = () => {
    setCurrentStartDate((prev) => addDays(prev, DATE_RANGE_DAYS));
  };

  const handleToday = () => {
    setCurrentStartDate(startOfDay(new Date()));
  };

  // Actions for the table columns
  const actions = React.useMemo(
    () => ({
      onEditSession: (session: Session) => {
        onEditSession?.(session);
      },
    }),
    [onEditSession],
  );

  const columns = React.useMemo(() => createSessionColumns(actions), [actions]);

  const table = useDataTableInstance({
    data: sessions,
    columns,
    getRowId: (row) => row.id,
    defaultPageSize: 30,
  });

  // Format date range for display (use actual range being fetched)
  const formattedDateRange = React.useMemo(() => {
    try {
      const start = filtersWithDateRange.startDate
        ? new Date(filtersWithDateRange.startDate + "T00:00:00")
        : dateRange.start;
      const end = filtersWithDateRange.endDate ? new Date(filtersWithDateRange.endDate + "T00:00:00") : dateRange.end;
      return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
    } catch {
      return "";
    }
  }, [filtersWithDateRange.startDate, filtersWithDateRange.endDate, dateRange]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-lg border">
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasSessions = sessions.length > 0;
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedSessionIds = selectedRows.map((row) => row.original.id);

  return (
    <div className="space-y-4">
      {hasSessions ? (
        <>
          {selectedSessionIds.length > 0 && (
            <div className="bg-muted/50 flex items-center gap-2 rounded-lg border px-4 py-2">
              <span className="text-muted-foreground text-sm">
                {selectedSessionIds.length} session{selectedSessionIds.length !== 1 ? "s" : ""} selected
              </span>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => setBulkAssignOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Teacher
              </Button>
            </div>
          )}
          <DataTable table={table} columns={columns} />
          <DataTablePagination table={table} />
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-medium">No sessions found</h3>
            <p className="text-muted-foreground mb-4">
              {Object.keys(filters).length > 0
                ? "No sessions match your current filters."
                : "There are no sessions to display for this date range."}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Date range navigation - change which 30-day window to view */}
      <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-sm">
          <span className="font-medium">{formattedDateRange}</span>
          <span className="ml-2">
            {hasSessions
              ? `${sessions.length} session${sessions.length !== 1 ? "s" : ""} in this period`
              : "No sessions in this date range"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousPeriod} disabled={isLoading}>
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous period</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday} disabled={isLoading}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextPeriod} disabled={isLoading}>
            <span className="hidden sm:inline">Next period</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <BulkAssignTeacherDialog
        open={bulkAssignOpen}
        onOpenChange={setBulkAssignOpen}
        sessionIds={selectedSessionIds}
        onSuccess={() => {
          refetch();
          table.resetRowSelection();
        }}
      />
    </div>
  );
}
