"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useDeleteSession, useUpdateSession } from "@/hooks/use-sessions-mutation";

import { AddParticipantDialog } from "./add-participant-dialog";
import { BulkAssignTeacherDialog } from "./bulk-assign-teacher-dialog";
import { CancelSessionDialog } from "./cancel-session-dialog";
import { CompactSessionCardActions } from "./compact-session-card-actions";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { ParticipantsDialog } from "./participants-dialog";
import { Session } from "./schema";

interface SessionTableRowActionsProps {
  session: Session;
  onEdit?: (session: Session) => void;
}

export function SessionTableRowActions({ session, onEdit }: SessionTableRowActionsProps) {
  const queryClient = useQueryClient();
  const deleteSessionMutation = useDeleteSession();
  const updateSessionMutation = useUpdateSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAddParticipantDialog, setShowAddParticipantDialog] = useState(false);
  const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);
  const [showAssignTeacherDialog, setShowAssignTeacherDialog] = useState(false);

  const hasParticipants = (session._count?.bookings || 0) > 0;

  const handleDeleteConfirm = () => {
    deleteSessionMutation.mutate(session.id, {
      onSuccess: () => setShowDeleteDialog(false),
    });
  };

  const handleCancelConfirm = () => {
    updateSessionMutation.mutate(
      { sessionId: session.id, data: { status: "CANCELLED" } },
      { onSuccess: () => setShowCancelDialog(false) },
    );
  };

  const handleStatusUpdate = (sessionId: string, newStatus: "SCHEDULED" | "CANCELLED" | "COMPLETED") => {
    updateSessionMutation.mutate({ sessionId, data: { status: newStatus } });
  };

  return (
    <>
      <CompactSessionCardActions
        session={session}
        hasParticipants={hasParticipants}
        onEdit={onEdit}
        onAddParticipant={() => setShowAddParticipantDialog(true)}
        onViewParticipants={() => setShowParticipantsDialog(true)}
        onStatusUpdate={handleStatusUpdate}
        onCancelClick={() => setShowCancelDialog(true)}
        onDeleteClick={() => setShowDeleteDialog(true)}
        onAssignTeacher={() => setShowAssignTeacherDialog(true)}
        compact
      />
      <AddParticipantDialog
        open={showAddParticipantDialog}
        onOpenChange={setShowAddParticipantDialog}
        session={session}
      />
      <ParticipantsDialog open={showParticipantsDialog} onOpenChange={setShowParticipantsDialog} session={session} />
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        session={session}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteSessionMutation.isPending}
      />
      <CancelSessionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        session={session}
        onConfirm={handleCancelConfirm}
        isCancelling={updateSessionMutation.isPending}
      />
      <BulkAssignTeacherDialog
        open={showAssignTeacherDialog}
        onOpenChange={setShowAssignTeacherDialog}
        sessionIds={[session.id]}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["sessions"] })}
      />
    </>
  );
}
