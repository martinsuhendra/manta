"use client";

import { useState } from "react";

import { Edit2, MoreHorizontal, Trash2, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { suppressPointerAfterDialogClose } from "@/hooks/use-dialog-close-pointer-guard";
import { useDeleteSession, useUpdateSession } from "@/hooks/use-sessions-mutation";
import { cn } from "@/lib/utils";

import { CancelSessionDialog } from "./cancel-session-dialog";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { ParticipantsDialog } from "./participants-dialog";
import type { Session } from "./schema";
import { armBlockOpenEditAfterSessionDialog } from "./session-open-edit-guard";

interface TimetableSessionEventMenuProps {
  session: Session;
  onEdit?: (session: Session) => void;
  /** Extra classes for the trigger (e.g. show on group-hover in timetable cards). */
  triggerClassName?: string;
  readOnly?: boolean;
}

export function TimetableSessionEventMenu({
  session,
  onEdit,
  triggerClassName,
  readOnly = false,
}: TimetableSessionEventMenuProps) {
  const deleteSessionMutation = useDeleteSession();
  const updateSessionMutation = useUpdateSession();

  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);

  const totalSlots = session.totalParticipantSlots ?? session._count?.bookings ?? 0;
  const hasParticipants = totalSlots > 0;

  const handleDeleteConfirm = () => {
    if (!sessionToDelete) return;
    const id = sessionToDelete.id;
    deleteSessionMutation.mutate(id, {
      onSuccess: () => {
        armBlockOpenEditAfterSessionDialog(id);
        suppressPointerAfterDialogClose();
        setShowDeleteDialog(false);
        setSessionToDelete(null);
      },
    });
  };

  const handleCancelConfirm = () => {
    if (!sessionToCancel) return;
    const cancelId = sessionToCancel.id;
    updateSessionMutation.mutate(
      { sessionId: cancelId, data: { status: "CANCELLED" } },
      {
        onSuccess: () => {
          armBlockOpenEditAfterSessionDialog(cancelId);
          suppressPointerAfterDialogClose();
          setShowCancelDialog(false);
          setSessionToCancel(null);
        },
      },
    );
  };

  return (
    <>
      <DropdownMenu modal>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "hover:bg-background/50 h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
              triggerClassName,
            )}
            aria-label="Session actions"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuLabel className="text-xs font-normal">Session</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {!readOnly && onEdit ? (
            <DropdownMenuItem
              className="cursor-pointer text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(session);
              }}
            >
              <Edit2 className="mr-2 h-3.5 w-3.5" />
              Edit session
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuItem
            className="cursor-pointer text-sm"
            onClick={(e) => {
              e.stopPropagation();
              setParticipantsOpen(true);
            }}
          >
            <Users className="mr-2 h-3.5 w-3.5" />
            {readOnly ? "View participants" : "View & edit participants"}
          </DropdownMenuItem>

          {!readOnly && (
            <>
              <DropdownMenuSeparator />

              {hasParticipants ? (
                <DropdownMenuItem
                  className="cursor-pointer text-sm"
                  disabled={session.status === "CANCELLED"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSessionToCancel(session);
                    setShowCancelDialog(true);
                  }}
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Cancel session
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSessionToDelete(session);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete session
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ParticipantsDialog
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
        session={session}
        readOnly={readOnly}
      />
      {!readOnly && (
        <>
          <DeleteConfirmationDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            session={sessionToDelete}
            onConfirm={handleDeleteConfirm}
            isDeleting={deleteSessionMutation.isPending}
          />
          <CancelSessionDialog
            open={showCancelDialog}
            onOpenChange={setShowCancelDialog}
            session={sessionToCancel}
            onConfirm={handleCancelConfirm}
            isCancelling={updateSessionMutation.isPending}
          />
        </>
      )}
    </>
  );
}
