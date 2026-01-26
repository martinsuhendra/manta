"use client";

import * as React from "react";
import { useState } from "react";

import { useUpdateSession, useDeleteSession } from "@/hooks/use-sessions-mutation";

import { AddParticipantDialog } from "./add-participant-dialog";
import { CancelSessionDialog } from "./cancel-session-dialog";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { ParticipantsDialog } from "./participants-dialog";
import { Session } from "./schema";
import { SessionCardActions } from "./session-card-actions";
import { SessionCardCompact } from "./session-card-compact";
import { SessionCardDetailed } from "./session-card-detailed";

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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  const [showAddParticipantDialog, setShowAddParticipantDialog] = useState(false);
  const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);

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

  const handleCancelClick = (session: Session) => {
    setSessionToCancel(session);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = () => {
    if (!sessionToCancel) return;

    updateSessionMutation.mutate(
      { sessionId: sessionToCancel.id, data: { status: "CANCELLED" } },
      {
        onSuccess: () => {
          setShowCancelDialog(false);
          setSessionToCancel(null);
        },
      },
    );
  };

  const hasParticipants = (session._count?.bookings || 0) > 0;

  const commonProps = {
    session,
    onEdit,
    onAddParticipant: () => setShowAddParticipantDialog(true),
    onViewParticipants: () => setShowParticipantsDialog(true),
    onStatusUpdate: handleStatusUpdate,
    onCancelClick: handleCancelClick,
    onDeleteClick: handleDeleteClick,
    hasParticipants,
  };

  return (
    <>
      {variant === "compact" ? (
        <SessionCardCompact {...commonProps} showDate={showDate} />
      ) : (
        <SessionCardDetailed {...commonProps} />
      )}
      <AddParticipantDialog
        open={showAddParticipantDialog}
        onOpenChange={setShowAddParticipantDialog}
        session={session}
      />
      <ParticipantsDialog open={showParticipantsDialog} onOpenChange={setShowParticipantsDialog} session={session} />
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
  );
}
