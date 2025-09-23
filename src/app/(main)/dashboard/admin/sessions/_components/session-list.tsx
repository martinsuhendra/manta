"use client";

import * as React from "react";

import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions } from "@/hooks/use-sessions-query";

import { SessionFilter, Session } from "./schema";
import { SessionCard } from "./session-card";

interface SessionListProps {
  filters: SessionFilter;
}

export function SessionList({ filters }: SessionListProps) {
  const { data: sessions = [], isLoading, refetch } = useSessions(filters);

  const handleEdit = (session: Session) => {
    // TODO: Implement edit session functionality
    console.log("Edit session:", session);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            variant="compact"
            showDate={true}
            onEdit={handleEdit}
            onRefresh={refetch}
          />
        ))}
      </div>
    </div>
  );
}
