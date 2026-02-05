"use client";

import * as React from "react";

import Link from "next/link";

import { format, parseISO } from "date-fns";
import { ArrowRight, User, Users } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [filter, setFilter] = React.useState<string>("All");
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

  const classTypes = React.useMemo(() => {
    const names = new Set(sessions.map((s) => s.item.name));
    return Array.from(names).sort();
  }, [sessions]);

  const filteredSessions = React.useMemo(
    () => (filter === "All" ? sessions : sessions.filter((s) => s.item.name === filter)),
    [filter, sessions],
  );

  const groupedSessions = React.useMemo(() => {
    const acc: Record<string, MemberSession[]> = {};
    for (const session of filteredSessions) {
      const dateKey = session.date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(session);
    }
    return acc;
  }, [filteredSessions]);

  const sortedDates = React.useMemo(() => Object.keys(groupedSessions).sort(), [groupedSessions]);

  const getSessionsForDate = React.useCallback(
    (d: string): MemberSession[] => (Object.hasOwn(groupedSessions, d) ? groupedSessions[d] : []),
    [groupedSessions],
  );

  if (sessions.length === 0) return null;

  return (
    <section id="schedule" className="border-border bg-muted/20 border-t py-24 sm:py-32">
      <div className="relative container mx-auto px-4">
        {!hideTitle && (
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-foreground text-3xl font-black tracking-tighter uppercase italic sm:text-4xl md:text-5xl">
              Class Schedule
            </h2>
            <p className="text-muted-foreground mt-4">Book your spot. First come, first served.</p>
          </div>
        )}

        {/* Filter pills */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("All")}
            className={cn(
              "rounded-full px-6 py-2 text-sm font-bold tracking-wide uppercase transition-all",
              filter === "All"
                ? "bg-primary text-primary-foreground shadow-primary/20 shadow-lg"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground border",
            )}
          >
            All
          </button>
          {classTypes.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              className={cn(
                "rounded-full px-6 py-2 text-sm font-bold tracking-wide uppercase transition-all",
                filter === name
                  ? "bg-primary text-primary-foreground shadow-primary/20 shadow-lg"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground border",
              )}
            >
              {name}
            </button>
          ))}
        </div>

        {filteredSessions.length === 0 ? (
          <div className="border-border rounded-xl border border-dashed py-12 text-center">
            <p className="text-muted-foreground">No classes found for this filter.</p>
          </div>
        ) : (
          <div className={hideTitle ? "space-y-8" : "space-y-10"}>
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="mb-4 flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground flex flex-col items-center justify-center rounded-xl px-4 py-2 shadow-md">
                    <span className="text-xs font-bold uppercase">{format(parseISO(date), "MMM")}</span>
                    <span className="text-2xl font-black">{format(parseISO(date), "dd")}</span>
                  </div>
                  <h3 className="text-foreground text-xl font-bold">{format(parseISO(date), "EEEE")}</h3>
                  <div className="bg-border h-px flex-1" />
                </div>
                <div className="space-y-4">
                  {getSessionsForDate(date).map((session) => (
                    <Card
                      key={session.id}
                      className="group border-border bg-card/80 hover:border-primary/50 hover:shadow-primary/5 cursor-pointer overflow-hidden transition-all hover:shadow-lg"
                      onClick={() => handleCardClick(session)}
                    >
                      <CardContent className="p-0">
                        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                          <div className="flex min-w-0 flex-1 items-start gap-4">
                            <div
                              className="bg-primary/30 group-hover:bg-primary h-12 w-1 shrink-0 rounded-full transition-colors"
                              style={session.item.color ? { backgroundColor: session.item.color } : undefined}
                            />
                            <div>
                              <span className="text-foreground block text-2xl font-black">
                                {session.startTime} – {session.endTime}
                              </span>
                              <span className="text-muted-foreground text-sm font-bold uppercase">
                                {format(parseISO(session.date), "EEE")}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-foreground group-hover:text-primary text-xl font-bold transition-colors">
                                  {session.item.name}
                                </h3>
                                <Badge variant="secondary" className="text-xs font-semibold">
                                  {session.item.name}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-4 text-sm">
                                {session.teacher && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Coach {session.teacher.name ?? "TBA"}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {session.spotsLeft} spots left
                                </span>
                                {session.spotsLeft <= 3 && session.spotsLeft > 0 && (
                                  <span className="text-destructive text-xs font-medium">Almost full</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <Button
                              size="sm"
                              className="w-full md:w-auto"
                              onClick={(e) => handleJoinClick(e, session)}
                              disabled={session.spotsLeft === 0}
                            >
                              {session.spotsLeft === 0 ? "Full" : "Join Session"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!hideTitle && showViewFullSchedule && (
          <div className="mt-12 flex justify-center">
            <Button asChild size="lg" className="gap-2 font-bold tracking-wide uppercase">
              <Link href="/shop/schedule">
                View Full Schedule
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
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
