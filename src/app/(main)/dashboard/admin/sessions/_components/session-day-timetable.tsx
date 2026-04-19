"use client";

import * as React from "react";

import { format, isSameDay } from "date-fns";
import { Clock, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

import { CompactSessionCard } from "./compact-session-card";
import { SESSION_STATUS_COLORS, SESSION_STATUS_LABELS, type Session } from "./schema";
import { buildTimetableLayout, minutesToPx, minutesToTimeString } from "./session-timetable-utils";
import { TimetableSessionEventMenu } from "./timetable-session-event-menu";

const MINUTES_PER_DAY = 24 * 60;
/** Taller hour rows (~30% more than 80px) so labels and session blocks read easier. */
const PX_PER_HOUR = 104;
const PX_PER_MINUTE = PX_PER_HOUR / 60;
const MIN_EVENT_HEIGHT_PX = 52;
/** Tiny gap only when multiple blocks stack; keep 0 so 1h blocks match the hour row (PX_PER_HOUR). */
const GAP_PX = 0;
/** Snap hover preview to 15-minute steps (matches session scheduling). */
const HOVER_SNAP_MINUTES = 15;
/** Hour index (0–23) to align to the top of the scroll viewport when opening / changing day. */
const INITIAL_SCROLL_HOUR = 5;
/** Side-by-side sessions: target width (% of lane). Shrinks only if overlaps cannot fit. */
const OVERLAP_CARD_WIDTH_TARGET_PCT = 30;
/** Horizontal gap between overlapping cards as % of lane (keeps columns visually tight). */
const OVERLAP_COLUMN_GAP_PCT = 0.5;

function getOverlapLaneStyle(column: number, columnCount: number): { widthPct: number; leftPct: number } {
  if (columnCount <= 1) return { widthPct: 100, leftPct: 0 };

  const gapTotal = OVERLAP_COLUMN_GAP_PCT * (columnCount - 1);
  const widthIfTarget = OVERLAP_CARD_WIDTH_TARGET_PCT * columnCount + gapTotal;
  const widthPct = widthIfTarget <= 100 ? OVERLAP_CARD_WIDTH_TARGET_PCT : (100 - gapTotal) / columnCount;
  const leftPct = column * (widthPct + OVERLAP_COLUMN_GAP_PCT);
  return { widthPct, leftPct: Math.min(leftPct, Math.max(0, 100 - widthPct)) };
}

function snapMinutesToStep(totalMinutes: number, step: number): number {
  return Math.round(totalMinutes / step) * step;
}

export interface SessionDayTimetableProps {
  selectedDate: Date;
  sessions: Session[];
  isLoading: boolean;
  onSessionSelect: (session: Session) => void;
  onEditSession?: (session: Session) => void;
  /** Pass snapped hover time as `HH:mm` when creating from the grid; omit for default (e.g. header create). */
  onCreateForDay: (defaultStartTime?: string) => void;
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

  const laneRef = React.useRef<HTMLDivElement>(null);
  const dayGridScrollRef = React.useRef<HTMLDivElement>(null);
  const [hoverTopPx, setHoverTopPx] = React.useState<number | null>(null);
  const [hoverMinutes, setHoverMinutes] = React.useState<number | null>(null);

  const selectedDayKey = format(selectedDate, "yyyy-MM-dd");

  React.useLayoutEffect(() => {
    if (isLoading) return;
    const el = dayGridScrollRef.current;
    if (!el) return;
    el.scrollTop = INITIAL_SCROLL_HOUR * PX_PER_HOUR;
  }, [isLoading, selectedDayKey]);

  const handleLaneMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target;
    if (target instanceof Element && target.closest("[data-timetable-session-event]")) {
      setHoverTopPx(null);
      setHoverMinutes(null);
      return;
    }

    const el = laneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (y < 0 || y > rect.height) {
      setHoverTopPx(null);
      setHoverMinutes(null);
      return;
    }
    const rawMinutes = y / PX_PER_MINUTE;
    const maxSnapped = Math.floor((MINUTES_PER_DAY - 1) / HOVER_SNAP_MINUTES) * HOVER_SNAP_MINUTES;
    const snapped = Math.min(
      snapMinutesToStep(Math.max(0, Math.min(MINUTES_PER_DAY - 1, rawMinutes)), HOVER_SNAP_MINUTES),
      maxSnapped,
    );
    setHoverMinutes(snapped);
    setHoverTopPx(minutesToPx(snapped, PX_PER_MINUTE));
  }, []);

  const handleLaneMouseLeave = React.useCallback(() => {
    setHoverTopPx(null);
    setHoverMinutes(null);
  }, []);

  if (isLoading) {
    return (
      <Card className="border-none">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
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
              <Button variant="outline" size="sm" className="mt-3" onClick={() => onCreateForDay()}>
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

      <div ref={dayGridScrollRef} className="border-border max-h-[calc(100vh-14rem)] overflow-auto rounded-md border">
        <div className="flex min-w-0">
          {/* Time rail */}
          <div
            className="border-border bg-muted/30 text-muted-foreground sticky left-0 z-10 w-16 shrink-0 border-r text-xs"
            style={{ height: laneHeightPx }}
          >
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

          {/* Lane */}
          <div
            ref={laneRef}
            className="relative min-w-0 flex-1"
            style={{ height: laneHeightPx }}
            onMouseMove={handleLaneMouseMove}
            onMouseLeave={handleLaneMouseLeave}
          >
            <button
              type="button"
              className="absolute inset-0 z-0 cursor-crosshair bg-transparent"
              aria-label="Day schedule background — hover to preview time, click to create session"
              onClick={() => onCreateForDay(hoverMinutes !== null ? minutesToTimeString(hoverMinutes) : undefined)}
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

            {hoverTopPx !== null && hoverMinutes !== null ? (
              <>
                {/* Dashed time preview only on empty grid (hidden while pointer is over a session card). */}
                <div
                  className="pointer-events-none absolute right-0 left-0 z-[15] -translate-y-1/2"
                  style={{ top: hoverTopPx }}
                  role="presentation"
                >
                  <div className="border-primary/70 h-0 w-full border-t-2 border-dashed" />
                </div>
                <div
                  className="bg-background/95 text-primary border-primary/35 pointer-events-none absolute top-0 right-2 z-[16] -translate-y-1/2 rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums shadow-sm"
                  style={{ top: hoverTopPx }}
                  aria-hidden
                >
                  {format(new Date(2000, 0, 1, Math.floor(hoverMinutes / 60) % 24, hoverMinutes % 60), "h:mm a")}
                </div>
              </>
            ) : null}

            {layout.map((ev) => {
              const top = minutesToPx(ev.startMin, PX_PER_MINUTE);
              const rawHeight = minutesToPx(ev.endMin - ev.startMin, PX_PER_MINUTE);
              const height = Math.max(MIN_EVENT_HEIGHT_PX, rawHeight - GAP_PX);
              const { widthPct, leftPct } = getOverlapLaneStyle(ev.column, ev.columnCount);
              const participantCount = ev.session.totalParticipantSlots ?? ev.session._count?.bookings ?? 0;

              return (
                <div
                  key={ev.session.id}
                  data-timetable-session-event
                  className="absolute z-10 box-border px-1 transition-[z-index,box-shadow] hover:z-40"
                  style={{
                    top,
                    height,
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                  }}
                >
                  <div
                    className={cn(
                      "group flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border shadow-sm transition-all",
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
                    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3.5 py-3.5 [scrollbar-width:thin]">
                      <div className="flex shrink-0 items-start justify-between gap-3">
                        <p className="text-foreground line-clamp-2 min-w-0 flex-1 text-left text-base leading-snug font-semibold">
                          {ev.session.item.name}
                        </p>
                        <StatusBadge
                          variant="secondary"
                          className="shrink-0 px-2 py-0.5 text-[10px] leading-none font-medium"
                          style={{
                            backgroundColor: `${SESSION_STATUS_COLORS[ev.session.status]}15`,
                            color: SESSION_STATUS_COLORS[ev.session.status],
                            border: `1px solid ${SESSION_STATUS_COLORS[ev.session.status]}30`,
                          }}
                        >
                          {SESSION_STATUS_LABELS[ev.session.status]}
                        </StatusBadge>
                      </div>
                      <div className="mt-auto flex shrink-0 items-end justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="text-foreground/75 flex items-center gap-2 text-xs font-medium tabular-nums">
                            <Clock className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                            <span>
                              {ev.session.startTime} – {ev.session.endTime}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-start gap-2">
                              <User className="text-primary mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                              <span className="text-foreground line-clamp-2 text-sm leading-snug font-semibold">
                                {ev.session.teacher?.name || ev.session.teacher?.email || "Unassigned"}
                              </span>
                            </div>
                            <div className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs font-semibold">
                              <Users className="h-3.5 w-3.5" aria-hidden />
                              <span>
                                {participantCount} participant{participantCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div
                          data-timetable-session-menu
                          className="flex shrink-0 flex-col items-end"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TimetableSessionEventMenu
                            session={ev.session}
                            onEdit={onEditSession}
                            triggerClassName="opacity-100"
                          />
                        </div>
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
