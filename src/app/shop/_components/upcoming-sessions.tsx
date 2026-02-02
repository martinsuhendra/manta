"use client";

import { format } from "date-fns";
import { Calendar, Clock, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  item: {
    name: string;
    capacity: number;
    color: string | null;
  };
  teacher: {
    name: string | null;
  } | null;
  spotsLeft: number;
}

interface UpcomingSessionsProps {
  sessions: Session[];
}

export function UpcomingSessions({ sessions }: UpcomingSessionsProps) {
  if (sessions.length === 0) return null;

  return (
    <section className="bg-muted/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Upcoming Sessions</h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Join one of our scheduled classes. Sign up to book your spot!
          </p>
        </div>

        <ScrollArea className="mt-16 w-full rounded-md border whitespace-nowrap">
          <div className="flex w-max space-x-4 p-4">
            {sessions.map((session) => (
              <Card key={session.id} className="w-[300px] shrink-0">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                      {session.item.name}
                    </Badge>
                    <span className="text-muted-foreground text-xs font-medium">{session.spotsLeft} spots left</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="text-muted-foreground h-4 w-4" />
                      <span>{format(new Date(session.date), "EEE, MMM d")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="text-muted-foreground h-4 w-4" />
                      <span>
                        {session.startTime} - {session.endTime}
                      </span>
                    </div>
                    {session.teacher && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="text-muted-foreground h-4 w-4" />
                        <span>{session.teacher.name ?? "Coach"}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
