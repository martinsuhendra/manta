"use client";

import * as React from "react";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, User, Users as UsersIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

import { Session, SESSION_STATUS_COLORS } from "./schema";
import { SessionCardActions } from "./session-card-actions";

interface SessionCardDetailedProps {
  session: Session;
  onEdit?: (session: Session) => void;
  onAddParticipant: () => void;
  onViewParticipants: () => void;
  onStatusUpdate: (sessionId: string, status: "SCHEDULED" | "CANCELLED" | "COMPLETED") => void;
  onCancelClick: (session: Session) => void;
  onDeleteClick: (session: Session) => void;
  hasParticipants: boolean;
}

export function SessionCardDetailed({
  session,
  onEdit,
  onAddParticipant,
  onViewParticipants,
  onStatusUpdate,
  onCancelClick,
  onDeleteClick,
  hasParticipants,
}: SessionCardDetailedProps) {
  return (
    <Card
      className="group border-l-4 transition-all duration-200 hover:shadow-md"
      style={{ borderLeftColor: session.item.color || SESSION_STATUS_COLORS[session.status] }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: session.item.color || SESSION_STATUS_COLORS[session.status] }}
              />
              <h3 className="text-base font-semibold">{session.item.name}</h3>
              <StatusBadge
                variant="secondary"
                className="px-2 py-1 text-xs"
                style={{
                  backgroundColor: `${SESSION_STATUS_COLORS[session.status]}20`,
                  color: SESSION_STATUS_COLORS[session.status],
                  border: `1px solid ${SESSION_STATUS_COLORS[session.status]}40`,
                }}
              >
                {session.status}
              </StatusBadge>
            </div>

            {/* Details Grid */}
            <div className="text-muted-foreground grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>
                  {session.startTime} - {session.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {session.teacher?.name || session.teacher?.email || "No teacher assigned"}
                </span>
              </div>
              <div
                className="hover:text-primary flex cursor-pointer items-center gap-2 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewParticipants();
                }}
                title="View participants"
              >
                <UsersIcon className="h-4 w-4 flex-shrink-0" />
                <span>
                  {session._count?.bookings || 0}/{session.item.capacity}
                </span>
              </div>
            </div>

            {/* Notes */}
            {session.notes && (
              <div className="muted-foreground bg-muted/30 border-muted rounded border-l-2 p-3 text-sm italic">
                {session.notes}
              </div>
            )}
          </div>

          {/* Actions */}
          <SessionCardActions
            session={session}
            hasParticipants={hasParticipants}
            onEdit={onEdit}
            onAddParticipant={onAddParticipant}
            onViewParticipants={onViewParticipants}
            onStatusUpdate={onStatusUpdate}
            onCancelClick={onCancelClick}
            onDeleteClick={onDeleteClick}
          />
        </div>
      </CardContent>
    </Card>
  );
}
