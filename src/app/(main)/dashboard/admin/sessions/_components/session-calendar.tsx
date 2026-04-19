"use client";

import * as React from "react";
import { useState } from "react";

import { addDays, format, subDays } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSessions } from "@/hooks/use-sessions-query";
import { cn } from "@/lib/utils";

import { Session, SessionFilter } from "./schema";
import { SessionDayTimetable } from "./session-day-timetable";

export interface DateSelectMeta {
  /** When true, parent only syncs date (no create dialog). */
  silent?: boolean;
  /** When opening the create dialog from the timetable, prefill start time (`HH:mm`). */
  defaultStartTime?: string;
}

interface SessionCalendarProps {
  filters: SessionFilter;
  onDateSelect: (date: Date, hasSessions?: boolean, sessions?: Session[], meta?: DateSelectMeta) => void;
  onSessionSelect: (session: Session) => void;
  onEditSession?: (session: Session) => void;
  /** Reserved for future cache invalidation; timetable uses `useSessions` query key from filters + day. */
  refreshTrigger?: number;
}

export function SessionCalendar({
  filters,
  onDateSelect,
  onSessionSelect,
  onEditSession,
  refreshTrigger,
}: SessionCalendarProps) {
  void refreshTrigger;
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const dayKey = format(selectedDate, "yyyy-MM-dd");

  const calendarFilters = React.useMemo<SessionFilter>(() => {
    return {
      ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
      ...(filters.itemId ? { itemId: filters.itemId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      startDate: dayKey,
      endDate: dayKey,
    };
  }, [dayKey, filters.teacherId, filters.itemId, filters.status]);

  const { data: sessions = [], isLoading } = useSessions(calendarFilters);

  const commitDateToParent = React.useCallback(
    (date: Date) => {
      setSelectedDate(date);
      onDateSelect(date, true, [], { silent: true });
    },
    [onDateSelect],
  );

  React.useEffect(() => {
    onDateSelect(selectedDate, true, [], { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial parent date sync
  }, []);

  const handlePrevDay = () => {
    commitDateToParent(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    commitDateToParent(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    commitDateToParent(new Date());
  };

  const handlePopoverSelect = (date: Date | undefined) => {
    if (!date) return;
    commitDateToParent(date);
  };

  const handleCreateForDay = (defaultStartTime?: string) => {
    onDateSelect(selectedDate, false, [], { defaultStartTime });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="icon" onClick={handlePrevDay} aria-label="Previous day">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className={cn("min-w-[200px] justify-start text-left font-normal")}>
              <CalendarIcon className="text-muted-foreground mr-2 h-4 w-4" />
              {format(selectedDate, "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={selectedDate} onSelect={handlePopoverSelect} initialFocus />
          </PopoverContent>
        </Popover>
        <Button type="button" variant="outline" size="icon" onClick={handleNextDay} aria-label="Next day">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>
      </div>

      <SessionDayTimetable
        selectedDate={selectedDate}
        sessions={sessions}
        isLoading={isLoading}
        onSessionSelect={onSessionSelect}
        onEditSession={onEditSession}
        onCreateForDay={handleCreateForDay}
      />
    </div>
  );
}
