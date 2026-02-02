"use client";

import { format } from "date-fns";
import { Calendar, Clock, User, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
    <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-32 dark:bg-slate-950">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-4 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl filter" />
      <div className="absolute -right-4 bottom-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl filter" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Upcoming Sessions
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Join one of our scheduled classes. Sign up to book your spot!
          </p>
        </div>

        <ScrollArea className="mt-16 w-full pb-4 whitespace-nowrap">
          <div className="flex w-max space-x-6 px-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="group relative w-[320px] shrink-0 overflow-hidden border-slate-200 bg-white/50 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900/50"
              >
                {/* Top colored accent line */}
                <div
                  className="absolute top-0 left-0 h-1 w-full"
                  style={{ backgroundColor: session.item.color || "#3b82f6" }}
                />

                <CardContent className="flex h-full flex-col p-6">
                  {/* Date & Spots Badge Row */}
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        {format(new Date(session.date), "MMM")}
                      </span>
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        {format(new Date(session.date), "dd")}
                      </span>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        {format(new Date(session.date), "EEEE")}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-0 px-2.5 py-1 text-xs font-medium transition-colors",
                        session.spotsLeft <= 3
                          ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                      )}
                    >
                      {session.spotsLeft === 0 ? "Full" : `${session.spotsLeft} spots left`}
                    </Badge>
                  </div>

                  {/* Session Info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="line-clamp-1 text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {session.item.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                      {session.teacher && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="truncate">{session.teacher.name ?? "Coach"}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>Capacity: {session.item.capacity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Decorative faint background icon */}
                  <div className="pointer-events-none absolute -right-6 -bottom-6 opacity-[0.03] dark:opacity-[0.05]">
                    <Calendar className="h-32 w-32" />
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
