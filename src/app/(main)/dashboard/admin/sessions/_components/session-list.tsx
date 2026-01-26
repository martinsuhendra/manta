/* eslint-disable react/no-array-index-key */
"use client";

import * as React from "react";
import { useState, useMemo } from "react";

import { format, addDays, startOfDay, subDays } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { useSessions } from "@/hooks/use-sessions-query";

import { SessionFilter, Session } from "./schema";
import { createSessionColumns } from "./session-columns";

interface SessionListProps {
  filters: SessionFilter;
  onEditSession?: (session: Session) => void;
}

const DAYS_PER_PAGE = 30;

export function SessionList({ filters, onEditSession }: SessionListProps) {
  const [currentStartDate, setCurrentStartDate] = useState(() => startOfDay(new Date()));

  // Calculate date range for current page (30 days from start date)
  const dateRange = useMemo(() => {
    const start = startOfDay(currentStartDate);
    const end = startOfDay(addDays(start, DAYS_PER_PAGE - 1));
    return { start, end };
  }, [currentStartDate]);

  // Merge date range with existing filters
  const filtersWithDateRange = useMemo<SessionFilter>(() => {
    return {
      ...filters,
      startDate: dateRange.start.toISOString().split("T")[0],
      endDate: dateRange.end.toISOString().split("T")[0],
    };
  }, [filters, dateRange]);

  const { data: sessions = [], isLoading, refetch } = useSessions(filtersWithDateRange);

  const handlePreviousPage = () => {
    setCurrentStartDate((prev) => subDays(prev, DAYS_PER_PAGE));
  };

  const handleNextPage = () => {
    setCurrentStartDate((prev) => addDays(prev, DAYS_PER_PAGE));
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
    defaultPageSize: 50,
  });

  // Format date range for display
  const formattedDateRange = React.useMemo(() => {
    try {
      const startFormatted = format(dateRange.start, "MMM d, yyyy");
      const endFormatted = format(dateRange.end, "MMM d, yyyy");
      return `${startFormatted} - ${endFormatted}`;
    } catch {
      return "";
    }
  }, [dateRange]);

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

  return (
    <div className="space-y-4">
      {hasSessions ? (
        <DataTable table={table} columns={columns} />
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

      {/* Custom Date Range Pagination - Always visible */}
      <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-sm">
          <span className="font-medium">{formattedDateRange}</span>
          <span className="ml-2">
            {hasSessions
              ? `Showing ${table.getFilteredRowModel().rows.length} session${table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}`
              : "No sessions in this date range"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={isLoading}>
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday} disabled={isLoading}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={isLoading}>
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
