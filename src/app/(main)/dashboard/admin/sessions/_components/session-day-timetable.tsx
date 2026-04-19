"use client";

import * as React from "react";

import { format, isSameDay } from "date-fns";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { CompactSessionCard } from "./compact-session-card";
import type { Session } from "./schema";
import { buildTimetableLayout, minutesToPx } from "./session-timetable-utils";

const MINUTES_PER_DAY = 24 * 60;
const PX_PER_HOUR = 80;
const PX_PER_MINUTE = PX_PER_HOUR / 60;
const MIN_EVENT_HEIGHT_PX = 40;
const GAP_PX = 2;

export interface SessionDayTimetableProps {
  selectedDate: Date;
  sessions: Session[];
  isLoading: boolean;
  onSessionSelect: (session: Session) => void;
  onEditSession?: (session: Session) => void;
  onCreateForDay: () => void;
}

function useNowTick(isToday: boolean) {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    if (!isToday) return;

    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [isToday]);

  return now;
}

export function SessionDayTimetable({
  selectedDate,
  sessions,
  isLoading,
  onSessionSelect,
  onEditSession,
  onCreateForDay,
}: SessionDayTimetableProps) {
  const today = new Date();
  const isToday = isSameDay(selectedDate, today);
  const now = useNowTick(isToday);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const laneHeightPx = minutesToPx(MINUTES_PER_DAY, PX_PER_MINUTE);

  const layout = React.useMemo(() => buildTimetableLayout(sessions), [sessions]);

  const sortedSessions = React.useMemo(
    () => [...sessions].sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [sessions],
  );

  const nowLineTop = isToday ? minutesToPx(nowMinutes, PX_PER_MINUTE) : null;

  if (isLoading) {
    return (
      <Card className="border-none">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[520px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          {sortedSessions.length} session{sortedSessions.length !== 1 ? "s" : ""} on{" "}
          <span className="text-foreground font-medium">{format(selectedDate, "EEEE, MMM d, yyyy")}</span>
        </span>
      </div>

      {/* Mobile: stacked list */}
      <div className="space-y-3 md:hidden">
        {sortedSessions.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground p-6 text-center text-sm">
              <p>No sessions on this day.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={onCreateForDay}>
                Create session
              </Button>
            </CardContent>
          </Card>
        ) : (
          sortedSessions.map((session) => (
            <CompactSessionCard
              key={session.id}
              session={session}
              onSessionSelect={onSessionSelect}
              onEdit={onEditSession}
            />
          ))
        )}
      </div>

      {/* Desktop: time grid */}

      <div className="border-border max-h-[calc(100vh-14rem)] overflow-auto rounded-md border">
        <div className="flex min-w-0">
          {/* Time rail */}
          <div
            className="border-border bg-muted/30 text-muted-foreground sticky left-0 z-10 w-14 shrink-0 border-r text-xs"
            style={{ height: laneHeightPx }}
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="border-border/60 box-border flex justify-end border-b pt-0.5 pr-2"
                style={{ height: PX_PER_HOUR }}
              >
                {format(new Date(2000, 0, 1, hour, 0), "h a")}
              </div>
            ))}
          </div>

          {/* Lane */}
          <div className="relative min-w-0 flex-1" style={{ height: laneHeightPx }}>
            <button
              type="button"
              className="absolute inset-0 z-0 cursor-default bg-transparent"
              aria-label="Day schedule background"
              onClick={onCreateForDay}
            />

            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="border-border/60 pointer-events-none absolute right-0 left-0 box-border border-b"
                style={{ top: hour * PX_PER_HOUR, height: PX_PER_HOUR }}
              />
            ))}

            {isToday && nowLineTop !== null && nowLineTop >= 0 && nowLineTop <= laneHeightPx ? (
              <div
                className="pointer-events-none absolute right-0 left-0 z-20"
                style={{ top: nowLineTop }}
                role="presentation"
              >
                <div className="bg-primary/80 h-px w-full" />
                <div className="bg-primary absolute -top-1 left-0 size-2 rounded-full" />
              </div>
            ) : null}

            {layout.map((ev) => {
              const top = minutesToPx(ev.startMin, PX_PER_MINUTE);
              const rawHeight = minutesToPx(ev.endMin - ev.startMin, PX_PER_MINUTE);
              const height = Math.max(MIN_EVENT_HEIGHT_PX, rawHeight - GAP_PX);
              const widthPct = 100 / ev.columnCount;
              const leftPct = (ev.column / ev.columnCount) * 100;

              return (
                <div
                  key={ev.session.id}
                  className="absolute z-10 px-0.5"
                  style={{
                    top: top + GAP_PX / 2,
                    height,
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                  }}
                >
                  <div
                    className={cn(
                      "group flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border shadow-sm transition-all",
                      "hover:ring-ring hover:shadow-md hover:ring-1",
                    )}
                    style={{
                      backgroundColor: `${ev.color}15`,
                      borderColor: `${ev.color}30`,
                      borderLeftWidth: "4px",
                      borderLeftColor: ev.color,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSessionSelect(ev.session);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onSessionSelect(ev.session);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex min-h-0 flex-1 flex-col p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-foreground/90 line-clamp-2 text-left text-sm font-semibold">
                          {ev.session.item.name}
                        </p>
                        {onEditSession ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="hover:bg-background/50 h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSession(ev.session);
                            }}
                            aria-label="Edit session"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        ) : null}
                      </div>
                      <div className="mt-auto pt-1">
                        <p className="text-foreground/70 text-xs font-medium">
                          {ev.session.startTime} – {ev.session.endTime}
                        </p>
                        <p className="text-foreground/60 line-clamp-1 text-xs">
                          {ev.session.teacher?.name || ev.session.teacher?.email || "Unassigned"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
