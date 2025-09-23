"use client";

import * as React from "react";

import { format } from "date-fns";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Session } from "./schema";
import { SessionCard } from "./session-card";

interface DayDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | undefined;
  sessions: Session[];
  onCreateSession: () => void;
  onEditSession: (session: Session) => void;
  onRefresh?: () => void;
}

export function DayDetailsDialog({
  open,
  onOpenChange,
  date,
  sessions,
  onCreateSession,
  onEditSession,
  onRefresh,
}: DayDetailsDialogProps) {
  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Sessions on {format(date, "MMMM d, yyyy")}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No sessions scheduled for this day</p>
                <Button onClick={onCreateSession}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            sessions
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  variant="detailed"
                  showDate={false}
                  onEdit={onEditSession}
                  onRefresh={onRefresh}
                />
              ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
