"use client";

import { Edit2, Trash2, UserPlus, Users as UsersIcon, MoreHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Session } from "./schema";

interface CompactSessionCardActionsProps {
  session: Session;
  hasParticipants: boolean;
  onEdit?: (session: Session) => void;
  onAddParticipant: () => void;
  onViewParticipants: () => void;
  onStatusUpdate: (sessionId: string, status: "SCHEDULED" | "CANCELLED" | "COMPLETED") => void;
  onCancelClick: (session: Session) => void;
  onDeleteClick: (session: Session) => void;
}

export function CompactSessionCardActions({
  session,
  hasParticipants,
  onEdit,
  onAddParticipant,
  onViewParticipants,
  onStatusUpdate,
  onCancelClick,
  onDeleteClick,
}: CompactSessionCardActionsProps) {
  return (
    <div className="flex items-center justify-end pt-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()} className="h-8">
            <MoreHorizontal className="mr-1 h-3.5 w-3.5" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-sm">Session Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {onEdit && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(session);
              }}
              className="cursor-pointer text-sm"
            >
              <Edit2 className="mr-2 h-3.5 w-3.5" />
              Edit Session
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onAddParticipant();
            }}
            className="cursor-pointer text-sm"
          >
            <UserPlus className="mr-2 h-3.5 w-3.5" />
            Add Participant
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onViewParticipants();
            }}
            className="cursor-pointer text-sm"
          >
            <UsersIcon className="mr-2 h-3.5 w-3.5" />
            View Participants
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Status Updates */}
          {session.status !== "SCHEDULED" && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(session.id, "SCHEDULED");
              }}
              className="cursor-pointer text-sm"
            >
              Mark as Scheduled
            </DropdownMenuItem>
          )}

          {session.status !== "CANCELLED" && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(session.id, "CANCELLED");
              }}
              className="cursor-pointer text-sm"
            >
              Cancel Session
            </DropdownMenuItem>
          )}

          {session.status !== "COMPLETED" && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(session.id, "COMPLETED");
              }}
              className="cursor-pointer text-sm"
            >
              Mark as Completed
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Cancel or Delete based on participants */}
          {hasParticipants ? (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onCancelClick(session);
              }}
              className="cursor-pointer text-sm"
              disabled={session.status === "CANCELLED"}
            >
              <X className="mr-2 h-3.5 w-3.5" />
              Cancel Session
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(session);
              }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete Session
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
