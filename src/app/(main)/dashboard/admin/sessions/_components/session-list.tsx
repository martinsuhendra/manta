"use client";

import * as React from "react";

import { format, parseISO } from "date-fns";
import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions } from "@/hooks/use-sessions-query";

import { SessionFilter, Session } from "./schema";
import { SessionCard } from "./session-card";

interface SessionListProps {
  filters: SessionFilter;
  onEditSession?: (session: Session) => void;
}

export function SessionList({ filters, onEditSession }: SessionListProps) {
  const { data: sessions = [], isLoading, refetch } = useSessions(filters);

  const handleEdit = (session: Session) => {
    onEditSession?.(session);
  };

  // Group sessions by date
  const sessionsByDate = React.useMemo(() => {
    const grouped: Record<string, Session[]> = {};

    sessions.forEach((session) => {
      const dateKey = session.date.includes("T") ? session.date.split("T")[0] : session.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });

    // Sort each group by start time
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return grouped;
  }, [sessions]);

  // Sort dates
  const sortedDates = Object.keys(sessionsByDate).sort();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, groupIndex) => (
          <div key={groupIndex} className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, cardIndex) => (
                <Card key={cardIndex}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">No sessions found</h3>
          <p className="text-muted-foreground mb-4">
            {Object.keys(filters).length > 0
              ? "No sessions match your current filters."
              : "There are no sessions to display."}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {sessions.length} session{sessions.length !== 1 ? "s" : ""} across {sortedDates.length} date
          {sortedDates.length !== 1 ? "s" : ""}
        </p>
      </div>

      {sortedDates.map((dateKey) => {
        const dateSessions = sessionsByDate[dateKey];
        let formattedDate: string;

        try {
          formattedDate = format(parseISO(dateKey), "EEEE, MMMM d, yyyy");
        } catch {
          formattedDate = dateKey;
        }

        return (
          <div key={dateKey} className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{formattedDate}</h3>
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs font-medium">
                {dateSessions.length} session{dateSessions.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {dateSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  variant="compact"
                  showDate={false}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
