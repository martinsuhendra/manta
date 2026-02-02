"use client";

import * as React from "react";

import Link from "next/link";

import { format, parseISO } from "date-fns";
import { ArrowRight, Calendar, Clock, User, Users } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { MemberSession } from "@/hooks/use-member-sessions";
import { cn } from "@/lib/utils";

import { BookingModal } from "../book/_components/booking-modal";

import { SessionDetailsDialog } from "./session-details-dialog";

interface UpcomingSessionsProps {
  sessions: MemberSession[];
  hideTitle?: boolean;
  showViewFullSchedule?: boolean;
}

export function UpcomingSessions({ sessions, hideTitle, showViewFullSchedule = true }: UpcomingSessionsProps) {
  const { data: authSession } = useSession();
  const [selectedSession, setSelectedSession] = React.useState<MemberSession | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);
  const [showBooking, setShowBooking] = React.useState(false);

  const isMember = authSession?.user?.role === "MEMBER";

  const handleCardClick = (session: MemberSession) => {
    setSelectedSession(session);
    setShowDetails(true);
  };

  const handleJoinClick = (e: React.MouseEvent, session: MemberSession) => {
    e.stopPropagation();
    setSelectedSession(session);
    if (isMember) {
      setShowBooking(true);
    } else {
      setShowDetails(true);
    }
  };

  const handleJoinFromDetails = (session: MemberSession) => {
    setSelectedSession(session);
    setShowDetails(false);
    setShowBooking(true);
  };

  if (sessions.length === 0) return null;

  // Group sessions by date
  const groupedSessions = sessions.reduce(
    (acc, session) => {
      const dateKey = session.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(session);
      return acc;
    },
    {} as Record<string, MemberSession[]>,
  );

  const sortedDates = Object.keys(groupedSessions).sort();

  return (
    <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-32 dark:bg-slate-950">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-4 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl filter" />
      <div className="absolute -right-4 bottom-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl filter" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {!hideTitle && (
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Upcoming Sessions
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Join one of our scheduled classes. Sign up to book your spot!
            </p>
          </div>
        )}

        <div className={hideTitle ? "space-y-12" : "mt-16 space-y-12"}>
          {sortedDates.map((date) => (
            <div key={date} className="relative">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex flex-col items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-white shadow-lg">
                  <span className="text-xs font-bold uppercase">{format(parseISO(date), "MMM")}</span>
                  <span className="text-2xl font-bold">{format(parseISO(date), "dd")}</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {format(parseISO(date), "EEEE")}
                </h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>

              <ScrollArea className="w-full pb-4 whitespace-nowrap">
                <div className="flex w-max space-x-6 px-1">
                  {groupedSessions[date].map((session) => (
                    <Card
                      key={session.id}
                      className="group relative w-[320px] shrink-0 cursor-pointer overflow-hidden border-slate-200 bg-white/50 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900/50"
                      onClick={() => handleCardClick(session)}
                    >
                      {/* Top colored accent line */}
                      <div
                        className="absolute top-0 left-0 h-1 w-full"
                        style={{ backgroundColor: session.item.color || "#3b82f6" }}
                      />

                      <CardContent className="flex h-full flex-col p-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <h3 className="line-clamp-1 text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                              {session.item.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 border-0 px-2.5 py-1 text-xs font-medium transition-colors",
                                session.spotsLeft <= 3
                                  ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                  : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                              )}
                            >
                              {session.spotsLeft === 0 ? "Full" : `${session.spotsLeft} left`}
                            </Badge>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span>
                              {session.startTime} - {session.endTime}
                            </span>
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

                          <Button
                            size="sm"
                            className="mt-4 w-full"
                            onClick={(e) => handleJoinClick(e, session)}
                            disabled={session.spotsLeft === 0}
                          >
                            Join Session
                          </Button>
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
          ))}
        </div>

        {!hideTitle && showViewFullSchedule && (
          <div className="mt-12 flex justify-center">
            <Link href="/shop/schedule">
              <Button size="lg" className="gap-2">
                View Full Schedule
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      <SessionDetailsDialog
        session={selectedSession}
        open={showDetails}
        onOpenChange={setShowDetails}
        onJoinSession={handleJoinFromDetails}
      />

      {isMember && (
        <BookingModal session={showBooking ? selectedSession : null} open={showBooking} onOpenChange={setShowBooking} />
      )}
    </section>
  );
}
