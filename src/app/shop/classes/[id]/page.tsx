import { Metadata } from "next";
import Link from "next/link";

import { addDays } from "date-fns";
import { ArrowLeft, Dumbbell, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_CONFIG } from "@/config/app-config";
import { prisma } from "@/lib/generated/prisma";

import { UpcomingSessions } from "../../_components/upcoming-sessions";

interface ClassDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ClassDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id, isActive: true },
    select: { name: true, description: true },
  });
  if (!item) return { title: "Class Not Found" };
  return {
    title: `${item.name} - ${APP_CONFIG.name}`,
    description: item.description ?? `Learn more about ${item.name} at ${APP_CONFIG.name}`,
  };
}

async function getClassById(id: string) {
  try {
    const item = await prisma.item.findUnique({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        capacity: true,
        color: true,
        image: true,
      },
    });
    return item;
  } catch {
    return null;
  }
}

async function getUpcomingSessionsForClass(itemId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextMonth = addDays(today, 30);

    const sessions = await prisma.classSession.findMany({
      where: {
        itemId,
        date: { gte: today, lte: nextMonth },
        status: "SCHEDULED",
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
  } catch {
    return [];
  }
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { id } = await params;
  const [item, sessions] = await Promise.all([getClassById(id), getUpcomingSessionsForClass(id)]);

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Class not found</h1>
          <p className="text-muted-foreground mt-2">
            The class you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild className="mt-6">
            <Link href="/shop">Back to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/shop#classes"
            className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to classes
          </Link>
          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            <div className="bg-muted aspect-video w-full max-w-md overflow-hidden rounded-xl md:aspect-square">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ backgroundColor: item.color || "hsl(var(--muted))" }}
                >
                  <Dumbbell className="h-24 w-24 opacity-20" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{item.name}</h1>
              <div className="text-muted-foreground mt-4 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Max {item.capacity} participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.duration} min</span>
                </div>
              </div>
              {item.description && <p className="text-muted-foreground mt-6 leading-relaxed">{item.description}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold">Upcoming sessions</h2>
        <p className="text-muted-foreground mt-1">Book a spot for this class.</p>
        <div className="mt-8">
          <UpcomingSessions sessions={sessions} hideTitle />
        </div>
      </div>
    </>
  );
}
