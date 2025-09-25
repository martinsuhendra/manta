"use client";

import * as React from "react";
import { useState } from "react";

import { format, startOfMonth, endOfMonth } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { useSessions } from "@/hooks/use-sessions-query";

import { CompactSessionCard } from "./compact-session-card";
import { Session, SessionFilter, SESSION_STATUS_COLORS } from "./schema";

interface SessionCalendarProps {
  filters: SessionFilter;
  onDateSelect: (date: Date, hasSessions?: boolean, sessions?: Session[]) => void;
  onSessionSelect: (session: Session) => void;
  onEditSession?: (session: Session) => void;
  refreshTrigger?: number;
}

export function SessionCalendar({ filters, onDateSelect, onSessionSelect, onEditSession }: SessionCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Prepare filters with date range for current month
  const calendarFilters = React.useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    return {
      ...filters,
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    };
  }, [currentMonth, filters]);

  const { data: sessions = [], isLoading } = useSessions(calendarFilters);

  // Group sessions by date
  const sessionsByDate = sessions.reduce(
    (acc, session) => {
      // Ensure date is in YYYY-MM-DD format for consistent grouping
      const dateKey = session.date.includes("T") ? session.date.split("T")[0] : session.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(session);
      return acc;
    },
    {} as Record<string, Session[]>,
  );

  // Get sessions for selected date
  const selectedDateSessions = selectedDate ? sessionsByDate[format(selectedDate, "yyyy-MM-dd")] || [] : [];

  const handleDateSelect = (date: Date | undefined) => {
    // Determine which date to use for selection
    let targetDate: Date | undefined = date;

    // If date is undefined (calendar trying to deselect) or same date clicked, keep current selection
    if (!date && selectedDate) {
      targetDate = selectedDate;
    } else if (date && selectedDate && format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")) {
      targetDate = selectedDate;
    }

    // Update state and notify parent
    if (targetDate) {
      setSelectedDate(targetDate);
      const dateKey = format(targetDate, "yyyy-MM-dd");
      const daySessions = sessionsByDate[dateKey] || [];
      onDateSelect(targetDate, daySessions.length > 0, daySessions);
    } else {
      setSelectedDate(undefined);
    }
  };

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
  };

  // Custom day content to show session indicators
  const renderDayContent = (day: any) => {
    const date = day.date || day;
    const dateKey = format(date, "yyyy-MM-dd");
    const daySessions = sessionsByDate[dateKey] || [];

    return (
      <div className="relative flex h-full w-full flex-col items-center justify-between p-1">
        <span className="text-sm font-medium">{format(date, "d")}</span>
        {daySessions.length > 0 && (
          <div className="flex justify-center gap-0.5">
            {daySessions.slice(0, 3).map((session) => (
              <div
                key={session.id}
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: session.item.color || SESSION_STATUS_COLORS[session.status],
                }}
                title={`${session.item.name} - ${session.startTime}`}
              />
            ))}
            {daySessions.length > 3 && (
              <div
                className="h-1.5 w-1.5 rounded-full bg-gray-400"
                title={`+${daySessions.length - 3} more sessions`}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <div className="sticky top-4">
          <Card className="border-none">
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={currentMonth}
                onMonthChange={handleMonthChange}
                className="w-full rounded-md border"
                classNames={{
                  day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-md m-0.5",
                  day_selected:
                    "bg-blue-500 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-md m-0.5",
                  day_today: "bg-accent text-accent-foreground rounded-md m-0.5 border border-primary/30",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                components={{
                  DayButton: ({ day, ...props }: { day: any; [key: string]: any }) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground m-0.5 h-12 w-full rounded-md p-0 font-normal"
                      {...props}
                    >
                      {renderDayContent(day)}
                    </Button>
                  ),
                }}
              />
              {isLoading && <div className="text-muted-foreground mt-4 text-center text-sm">Loading sessions...</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session Details for Selected Date */}
      <div className="flex h-[calc(100vh-12rem)] flex-col space-y-4">
        <div className="shrink-0">
          <h3 className="text-lg font-semibold">
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {selectedDateSessions.length} session{selectedDateSessions.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto">
          {selectedDateSessions.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground p-4 text-center">
                <p>No sessions on this date</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => selectedDate && onDateSelect(selectedDate)}
                >
                  Create Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            selectedDateSessions
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((session) => (
                <CompactSessionCard
                  key={session.id}
                  session={session}
                  onSessionSelect={onSessionSelect}
                  onEdit={onEditSession}
                />
              ))
          )}
        </div>
      </div>
    </div>
  );
}
