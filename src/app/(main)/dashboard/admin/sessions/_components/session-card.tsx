"use client";

import * as React from "react";
import { useState } from "react";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Edit, MoreHorizontal, Trash2, User, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateSession, useDeleteSession } from "@/hooks/use-sessions-mutation";

import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { Session, SESSION_STATUS_COLORS } from "./schema";

interface SessionCardProps {
  session: Session;
  variant?: "compact" | "detailed";
  showDate?: boolean;
  onEdit?: (session: Session) => void;
}

export function SessionCard({ session, variant = "compact", showDate = true, onEdit }: SessionCardProps) {
  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  const handleStatusUpdate = (sessionId: string, newStatus: "SCHEDULED" | "CANCELLED" | "COMPLETED") => {
    updateSessionMutation.mutate({ sessionId, data: { status: newStatus } });
  };

  const handleDeleteClick = (session: Session) => {
    setSessionToDelete(session);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (!sessionToDelete) return;

    deleteSessionMutation.mutate(sessionToDelete.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        setSessionToDelete(null);
      },
    });
  };

  const compactCard = (
    <Card
      className="group border-l-4 transition-all duration-200 hover:shadow-md"
      style={{ borderLeftColor: session.item.color || SESSION_STATUS_COLORS[session.status] }}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          {/* Main Content */}
          <div className="min-w-0 flex-1 space-y-2">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: session.item.color || SESSION_STATUS_COLORS[session.status] }}
                />
                <h3 className="truncate text-base font-semibold">{session.item.name}</h3>
              </div>
              <Badge
                variant="secondary"
                className="flex-shrink-0 px-2 py-0.5 text-sm"
                style={{
                  backgroundColor: `${SESSION_STATUS_COLORS[session.status]}20`,
                  color: SESSION_STATUS_COLORS[session.status],
                  border: `1px solid ${SESSION_STATUS_COLORS[session.status]}40`,
                }}
              >
                {session.status}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="text-muted-foreground flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {session.startTime}-{session.endTime}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>
                  {session._count?.bookings || 0}/{session.item.capacity}
                </span>
              </div>
              {showDate && (
                <div className="col-span-2 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{format(parseISO(session.date), "MMM d, yyyy")}</span>
                </div>
              )}
              <div className="col-span-2 flex items-center gap-1.5">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {session.teacher?.name || session.teacher?.email || "No teacher assigned"}
                </span>
              </div>
            </div>

            {/* Notes */}
            {session.notes && (
              <div className="muted-foreground bg-muted/30 border-muted rounded border-l-2 p-2 text-sm italic">
                {session.notes}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-muted h-7 w-7 p-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-sm">Session Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => onEdit?.(session)} className="cursor-pointer text-sm">
                  <Edit className="mr-2 h-3.5 w-3.5" />
                  Edit Session
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Status Updates */}
                {session.status !== "SCHEDULED" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate(session.id, "SCHEDULED")}
                    className="cursor-pointer text-xs"
                  >
                    Mark as Scheduled
                  </DropdownMenuItem>
                )}

                {session.status !== "CANCELLED" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate(session.id, "CANCELLED")}
                    className="cursor-pointer text-xs"
                  >
                    Cancel Session
                  </DropdownMenuItem>
                )}

                {session.status !== "COMPLETED" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate(session.id, "COMPLETED")}
                    className="cursor-pointer text-xs"
                  >
                    Mark as Completed
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive cursor-pointer text-xs"
                  onClick={() => handleDeleteClick(session)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const detailedCard = (
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
              <Badge
                variant="secondary"
                className="px-2 py-1 text-xs"
                style={{
                  backgroundColor: `${SESSION_STATUS_COLORS[session.status]}20`,
                  color: SESSION_STATUS_COLORS[session.status],
                  border: `1px solid ${SESSION_STATUS_COLORS[session.status]}40`,
                }}
              >
                {session.status}
              </Badge>
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

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0" />
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
          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="sm" onClick={() => onEdit?.(session)} className="h-8 w-8 p-0">
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(session)}
              className="text-destructive hover:text-destructive h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {variant === "compact" ? compactCard : detailedCard}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        session={sessionToDelete}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteSessionMutation.isPending}
      />
    </>
  );
}
