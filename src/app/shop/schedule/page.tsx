import { Suspense } from "react";

import { Metadata } from "next";

import { addDays, startOfDay } from "date-fns";

import { APP_CONFIG } from "@/config/app-config";
import { prisma } from "@/lib/generated/prisma";

import { ScheduleFilters } from "../_components/schedule-filters";
import { UpcomingSessions } from "../_components/upcoming-sessions";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Full Schedule`,
  description: "View our upcoming class schedule.",
};

async function getClasses() {
  try {
    const items = await prisma.item.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    return items;
  } catch {
    return [];
  }
}

async function getFullSchedule(start?: string, end?: string, itemId?: string) {
  try {
    const today = startOfDay(new Date());
    const defaultEnd = addDays(today, 30);

    const startDate = start ? new Date(start) : today;
    const endDate = end ? new Date(end) : defaultEnd;

    const sessions = await prisma.classSession.findMany({
      where: {
        date: {
          gte: startDate < today ? today : startDate,
          lte: endDate,
        },
        status: "SCHEDULED",
        ...(itemId && itemId !== "all" ? { itemId } : {}),
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            duration: true,
            capacity: true,
            color: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          where: { status: { not: "CANCELLED" } },
          select: { id: true },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return sessions.map((session) => ({
      id: session.id,
      itemId: session.itemId,
      teacherId: session.teacherId,
      date: session.date.toISOString().split("T")[0],
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      notes: session.notes,
      item: session.item,
      teacher: session.teacher,
      spotsLeft: Math.max(0, session.item.capacity - session.bookings.length),
      capacity: session.item.capacity,
    }));
  } catch (error) {
    console.error("Failed to fetch full schedule:", error);
    return [];
  }
}

interface SchedulePageProps {
  searchParams: Promise<{ start?: string; end?: string; item?: string }>;
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const params = await searchParams;
  const start = typeof params.start === "string" ? params.start : undefined;
  const end = typeof params.end === "string" ? params.end : undefined;
  const itemId = typeof params.item === "string" ? params.item : undefined;

  const [sessions, classes] = await Promise.all([getFullSchedule(start, end, itemId), getClasses()]);

  return (
    <>
      <Suspense
        fallback={
          <div className="border-b border-slate-200 bg-white px-6 py-6 dark:border-slate-800 dark:bg-slate-900" />
        }
      >
        <ScheduleFilters items={classes} />
      </Suspense>
      <UpcomingSessions sessions={sessions} showViewFullSchedule={false} todayOnly={false} />
    </>
  );
}
