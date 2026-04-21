"use client";

import * as React from "react";

import { eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from "date-fns";
import { Clock, User, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

import { SESSION_STATUS_COLORS, SESSION_STATUS_LABELS, type Session } from "./schema";
import { buildTimetableLayout, minutesToPx, minutesToTimeString } from "./session-timetable-utils";

const MINUTES_PER_DAY = 24 * 60;
const PX_PER_HOUR = 104;
const PX_PER_MINUTE = PX_PER_HOUR / 60;
const MIN_EVENT_HEIGHT_PX = 52;
const GAP_PX = 0;
const HOVER_SNAP_MINUTES = 15;
const INITIAL_SCROLL_HOUR = 5;
const WEEK_STARTS_ON = 1;
const DAY_HEADER_HEIGHT_PX = 52;
const TIME_GUTTER_ALIGNMENT_OFFSET_PX = 1;

interface SessionWeekTimetableProps {
  selectedDate: Date;
  sessions: Session[];
  isLoading: boolean;
  onSessionSelect: (session: Session) => void;
  onCreateForDay: (date: Date, defaultStartTime?: string) => void;
  readOnly?: boolean;
}

function snapMinutesToStep(totalMinutes: number, step: number): number {
  return Math.round(totalMinutes / step) * step;
}

function groupSessionsByDayKey(sessions: Session[]) {
  return sessions.reduce<Record<string, Session[]>>((acc, session) => {
    const dayKey = format(new Date(session.date), "yyyy-MM-dd");
    const current = acc[dayKey] ?? [];
    current.push(session);
    acc[dayKey] = current;
    return acc;
  }, {});
}

function formatHoverTime(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  return format(new Date(2000, 0, 1, hour, minute), "h:mm a");
}

export function SessionWeekTimetable({
  selectedDate,
  sessions,
  isLoading,
  onSessionSelect,
  onCreateForDay,
  readOnly = false,
}: SessionWeekTimetableProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: WEEK_STARTS_ON });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: WEEK_STARTS_ON });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const laneHeightPx = minutesToPx(MINUTES_PER_DAY, PX_PER_MINUTE);
  const dayGridScrollRef = React.useRef<HTMLDivElement>(null);
  const [hoverByDay, setHoverByDay] = React.useState<Record<string, number | null>>({});

  const sessionsByDayKey = React.useMemo(() => groupSessionsByDayKey(sessions), [sessions]);

  React.useLayoutEffect(() => {
    if (isLoading) return;
    const el = dayGridScrollRef.current;
    if (!el) return;
    el.scrollTop = INITIAL_SCROLL_HOUR * PX_PER_HOUR;
  }, [isLoading, format(weekStart, "yyyy-MM-dd")]);

  const summaryLabel = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;

  if (isLoading) {
    return (
      <Card className="border-none">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-[680px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} in{" "}
          <span className="text-foreground font-medium">{summaryLabel}</span>
        </span>
      </div>

      <div ref={dayGridScrollRef} className="border-border max-h-[calc(100vh-14rem)] overflow-auto rounded-md border">
        <div className="flex min-w-[980px]">
          <div
            className="border-border bg-muted/30 text-muted-foreground sticky left-0 z-30 w-16 shrink-0 border-r text-xs"
            style={{ height: laneHeightPx + DAY_HEADER_HEIGHT_PX + TIME_GUTTER_ALIGNMENT_OFFSET_PX }}
          >
            <div
              className="border-border/70 bg-background sticky top-0 z-20 border-b"
              style={{ height: DAY_HEADER_HEIGHT_PX + TIME_GUTTER_ALIGNMENT_OFFSET_PX }}
            />
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="border-border/60 box-border flex items-start justify-end border-b py-1 pr-2"
                style={{ height: PX_PER_HOUR }}
              >
                {format(new Date(2000, 0, 1, hour, 0), "h a")}
              </div>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="bg-background sticky top-0 z-20 grid grid-cols-7 border-b">
              {days.map((day) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={format(day, "yyyy-MM-dd")}
                    className="border-border/70 border-r px-2 py-2 text-center last:border-r-0"
                  >
                    <p className="text-muted-foreground text-xs font-medium">{format(day, "EEE")}</p>
                    <p className={cn("text-sm font-semibold", isToday && "text-primary")}>{format(day, "d")}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const daySessions = sessionsByDayKey[dayKey] ?? [];
                const layout = buildTimetableLayout(daySessions);
                const hoverMinutes = hoverByDay[dayKey] ?? null;
                const hoverTop = hoverMinutes === null ? null : minutesToPx(hoverMinutes, PX_PER_MINUTE);
                const hoverLabel = hoverMinutes === null ? null : formatHoverTime(hoverMinutes);

                return (
                  <div
                    key={dayKey}
                    className="border-border/70 relative border-r last:border-r-0"
                    style={{ height: laneHeightPx }}
                    onMouseMove={
                      readOnly
                        ? undefined
                        : (event) => {
                            const rect = event.currentTarget.getBoundingClientRect();
                            const y = event.clientY - rect.top;
                            if (y < 0 || y > rect.height) return setHoverByDay((prev) => ({ ...prev, [dayKey]: null }));
                            const rawMinutes = y / PX_PER_MINUTE;
                            const maxSnapped =
                              Math.floor((MINUTES_PER_DAY - 1) / HOVER_SNAP_MINUTES) * HOVER_SNAP_MINUTES;
                            const snapped = Math.min(
                              snapMinutesToStep(
                                Math.max(0, Math.min(MINUTES_PER_DAY - 1, rawMinutes)),
                                HOVER_SNAP_MINUTES,
                              ),
                              maxSnapped,
                            );
                            setHoverByDay((prev) => ({ ...prev, [dayKey]: snapped }));
                          }
                    }
                    onMouseLeave={readOnly ? undefined : () => setHoverByDay((prev) => ({ ...prev, [dayKey]: null }))}
                  >
                    {!readOnly && (
                      <button
                        type="button"
                        className="absolute inset-0 z-0 cursor-crosshair bg-transparent"
                        aria-label={`Create session on ${format(day, "EEEE")}`}
                        onClick={() =>
                          onCreateForDay(day, hoverMinutes !== null ? minutesToTimeString(hoverMinutes) : undefined)
                        }
                      />
                    )}

                    {Array.from({ length: 24 }, (_, hour) => (
                      <div
                        key={hour}
                        className="border-border/60 pointer-events-none absolute right-0 left-0 box-border border-b"
                        style={{ top: hour * PX_PER_HOUR, height: PX_PER_HOUR }}
                      />
                    ))}

                    {!readOnly && hoverTop !== null && hoverLabel ? (
                      <>
                        <div
                          className="border-primary/70 pointer-events-none absolute right-0 left-0 z-[15] -translate-y-1/2 border-t-2 border-dashed"
                          style={{ top: hoverTop }}
                          role="presentation"
                        />
                        <div
                          className="bg-background/95 text-primary border-primary/35 pointer-events-none absolute top-0 right-2 z-[16] -translate-y-1/2 rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums shadow-sm"
                          style={{ top: hoverTop }}
                          aria-hidden
                        >
                          {hoverLabel}
                        </div>
                      </>
                    ) : null}

                    {layout.map((eventLayout) => {
                      const top = minutesToPx(eventLayout.startMin, PX_PER_MINUTE);
                      const rawHeight = minutesToPx(eventLayout.endMin - eventLayout.startMin, PX_PER_MINUTE);
                      const height = Math.max(MIN_EVENT_HEIGHT_PX, rawHeight - GAP_PX);
                      const widthPct = eventLayout.columnCount <= 1 ? 100 : 96 / eventLayout.columnCount;
                      const leftPct = eventLayout.columnCount <= 1 ? 0 : eventLayout.column * widthPct;
                      const participantCount =
                        eventLayout.session.totalParticipantSlots ?? eventLayout.session._count?.bookings ?? 0;

                      return (
                        <div
                          key={eventLayout.session.id}
                          className="absolute z-10 box-border px-0.5 transition-[z-index,box-shadow] hover:z-40"
                          style={{ top, height, left: `${leftPct}%`, width: `${widthPct}%` }}
                        >
                          <button
                            type="button"
                            className="group flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border p-2 text-left shadow-sm transition-all hover:shadow-md"
                            style={{
                              backgroundColor: `${eventLayout.color}15`,
                              borderColor: `${eventLayout.color}30`,
                              borderLeftWidth: "4px",
                              borderLeftColor: eventLayout.color,
                            }}
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              onSessionSelect(eventLayout.session);
                            }}
                          >
                            <p className="text-foreground line-clamp-2 text-xs leading-snug font-semibold">
                              {eventLayout.session.item.name}
                            </p>
                            <div className="text-foreground/75 mt-1 flex items-center gap-1 text-[11px] tabular-nums">
                              <Clock className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                              <span>
                                {eventLayout.session.startTime} - {eventLayout.session.endTime}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[11px]">
                              <User className="text-primary h-3.5 w-3.5 shrink-0" />
                              <span className="line-clamp-1">{eventLayout.session.teacher?.name || "Unassigned"}</span>
                            </div>
                            <div className="text-muted-foreground mt-auto flex items-center justify-between gap-1 pt-1 text-[10px]">
                              <StatusBadge variant="secondary" className="px-1.5 py-0 text-[10px] leading-none">
                                {SESSION_STATUS_LABELS[eventLayout.session.status]}
                              </StatusBadge>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {participantCount}
                              </span>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
