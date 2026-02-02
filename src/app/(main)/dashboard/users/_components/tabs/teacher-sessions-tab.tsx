"use client";

import { format } from "date-fns";
import { Calendar, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TeacherSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  item: {
    id: string;
    name: string;
    duration: number;
    capacity: number;
    color: string | null;
  };
  _count: { bookings: number };
}

interface TeacherSessionsTabProps {
  sessions: TeacherSession[];
}

export function TeacherSessionsTab({ sessions }: TeacherSessionsTabProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
          <Calendar className="text-muted-foreground h-8 w-8" />
        </div>
        <div>
          <p className="font-medium">No upcoming sessions</p>
          <p className="text-muted-foreground text-sm">This teacher has no scheduled sessions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        {sessions.length} upcoming session{sessions.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-2">
        {sessions.map((session) => (
          <Card key={session.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn("h-2 w-2 rounded-full", session.item.color || "bg-primary")}
                  style={session.item.color ? { backgroundColor: session.item.color } : undefined}
                />
                <span className="font-medium">{session.item.name}</span>
              </div>
              <Badge variant={session.status === "SCHEDULED" ? "default" : "secondary"}>{session.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-1 py-0 pb-3">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                {format(new Date(session.date), "EEE, MMM d, yyyy")} · {session.startTime}–{session.endTime}
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                {session._count.bookings} / {session.item.capacity} booked
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
