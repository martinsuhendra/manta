import { type Session, SESSION_STATUS_COLORS } from "./schema";

/** Minutes from midnight for "HH:mm" or "H:mm" */
export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function clampToDayBounds(startMinutes: number, endMinutes: number): { start: number; end: number } {
  const dayStart = 0;
  const dayEnd = 24 * 60;
  const start = Math.max(dayStart, Math.min(dayEnd, startMinutes));
  let end = Math.max(dayStart, Math.min(dayEnd, endMinutes));
  if (end <= start) {
    end = Math.min(dayEnd, start + 15);
  }
  return { start, end };
}

export function sessionToDayBounds(session: Session): { start: number; end: number } {
  const start = timeStringToMinutes(session.startTime);
  let end = timeStringToMinutes(session.endTime);
  if (end <= start) {
    end = start + Math.max(15, session.item.duration || 60);
  }
  return clampToDayBounds(start, end);
}

export function minutesToPx(minutes: number, pixelsPerMinute: number): number {
  return minutes * pixelsPerMinute;
}

/** Midnight offset → `HH:mm` for session form / API */
export function minutesToTimeString(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60) % 24;
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface TimetableLayoutEvent {
  session: Session;
  startMin: number;
  endMin: number;
  column: number;
  columnCount: number;
  color: string;
}

function sessionAccentColor(session: Session): string {
  return session.item.color || SESSION_STATUS_COLORS[session.status];
}

/**
 * Greedy column assignment + per-event columnCount among all overlapping intervals.
 * Lane position/size (% of day column) is applied in `SessionDayTimetable` via `getOverlapLaneStyle`.
 */
export function buildTimetableLayout(sessions: Session[]): TimetableLayoutEvent[] {
  const withBounds = sessions.map((session) => {
    const { start, end } = sessionToDayBounds(session);
    return { session, startMin: start, endMin: end };
  });

  const sorted = [...withBounds].sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return b.endMin - a.endMin;
  });

  const columns: number[] = [];

  const assigned = sorted.map((e) => {
    const reuseIdx = columns.findIndex((lastEnd) => lastEnd <= e.startMin);
    if (reuseIdx !== -1) {
      // reuseIdx comes from findIndex on this array — bounded index
      // eslint-disable-next-line security/detect-object-injection -- index from findIndex on `columns`
      columns[reuseIdx] = e.endMin;
      return { ...e, column: reuseIdx };
    }
    const col = columns.length;
    columns.push(e.endMin);
    return { ...e, column: col };
  });

  return assigned.map((e) => {
    const overlapping = assigned.filter((o) => o.startMin < e.endMin && o.endMin > e.startMin);
    const columnCount = Math.max(1, ...overlapping.map((o) => o.column + 1));
    return {
      session: e.session,
      startMin: e.startMin,
      endMin: e.endMin,
      column: e.column,
      columnCount,
      color: sessionAccentColor(e.session),
    };
  });
}
