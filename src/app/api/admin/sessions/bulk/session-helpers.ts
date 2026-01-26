import type { Prisma } from "@prisma/client";

interface Item {
  id: string;
  duration: number;
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
  }>;
}

interface SessionToCreate {
  itemId: string;
  teacherId: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  status: "SCHEDULED";
  notes: string | null;
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + durationMinutes;

  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;

  return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
}

export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

export function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function generateAutomaticSessions(
  items: Item[],
  start: Date,
  end: Date,
  calculateEndTimeFn: (startTime: string, duration: number) => string,
): SessionToCreate[] {
  const sessionsToCreate: SessionToCreate[] = [];
  const dates = getDatesInRange(start, end);

  for (const item of items) {
    if (item.schedules.length === 0) {
      continue; // Skip items without schedules
    }

    for (const date of dates) {
      const dayOfWeek = getDayOfWeek(date);
      const matchingSchedules = item.schedules.filter((schedule) => schedule.dayOfWeek === dayOfWeek);

      for (const schedule of matchingSchedules) {
        const endTime = calculateEndTimeFn(schedule.startTime, item.duration);
        sessionsToCreate.push({
          itemId: item.id,
          teacherId: null,
          date: new Date(date),
          startTime: schedule.startTime,
          endTime,
          status: "SCHEDULED",
          notes: null,
        });
      }
    }
  }

  return sessionsToCreate;
}

interface ManualSession {
  itemId: string;
  teacherId?: string;
  date: string;
  startTime: string;
  notes?: string;
}

export function generateManualSessions(
  manualSessions: ManualSession[],
  items: Item[],
  start: Date,
  end: Date,
  calculateEndTimeFn: (startTime: string, duration: number) => string,
): SessionToCreate[] {
  const sessionsToCreate: SessionToCreate[] = [];

  for (const session of manualSessions) {
    const item = items.find((i) => i.id === session.itemId);
    if (!item) continue;

    const sessionDate = new Date(session.date);
    if (sessionDate < start || sessionDate > end) {
      continue; // Skip sessions outside the date range
    }

    const endTime = calculateEndTimeFn(session.startTime, item.duration);
    sessionsToCreate.push({
      itemId: session.itemId,
      teacherId: session.teacherId || null,
      date: sessionDate,
      startTime: session.startTime,
      endTime,
      status: "SCHEDULED",
      notes: session.notes || null,
    });
  }

  return sessionsToCreate;
}
