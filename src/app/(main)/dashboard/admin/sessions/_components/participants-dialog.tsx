/* eslint-disable max-lines, react/no-array-index-key */
"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, CheckCircle2, User, UserMinus, UserPlus, Users } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmSessionParticipants, useRemoveSessionParticipant } from "@/hooks/use-bookings-mutation";
import { useSession } from "@/hooks/use-sessions-query";

import { AddParticipantDialog } from "./add-participant-dialog";
import { Session } from "./schema";

type SessionBooking = NonNullable<Session["bookings"]>[number];

interface ParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
  readOnly?: boolean;
}

/* eslint-disable complexity */
export function ParticipantsDialog({ open, onOpenChange, session, readOnly = false }: ParticipantsDialogProps) {
  const queryClient = useQueryClient();
  const [bookingToRemove, setBookingToRemove] = useState<SessionBooking | null>(null);
  const [selectedReservedBookingIds, setSelectedReservedBookingIds] = useState<string[]>([]);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const { data: sessionDetail, isLoading } = useSession(session.id, open);
  const removeParticipantMutation = useRemoveSessionParticipant();
  const confirmParticipantsMutation = useConfirmSessionParticipants();

  const bookings = sessionDetail?.bookings ?? [];
  const reservedBookings = bookings.filter((b) => b.status === "RESERVED");
  const checkedInBookings = bookings.filter((b) => b.status === "CHECKED_IN");
  const waitlistedBookings = bookings.filter((b) => b.status === "WAITLISTED");
  const reservedBookingIds = useMemo(() => reservedBookings.map((booking) => booking.id), [reservedBookings]);
  const reservedBookingIdSet = useMemo(() => new Set(reservedBookingIds), [reservedBookingIds]);
  const selectedReservedSet = useMemo(() => new Set(selectedReservedBookingIds), [selectedReservedBookingIds]);
  const allReservedSelected =
    reservedBookings.length > 0 && selectedReservedBookingIds.length === reservedBookings.length;
  const moveToCheckedInCount =
    selectedReservedBookingIds.length > 0 ? selectedReservedBookingIds.length : reservedBookings.length;
  const totalSlots = sessionDetail ? (sessionDetail.totalParticipantSlots ?? 0) : 0;

  useEffect(() => {
    if (!open) {
      setSelectedReservedBookingIds((currentSelected) => (currentSelected.length === 0 ? currentSelected : []));
      return;
    }
    setSelectedReservedBookingIds((currentSelected) => {
      const nextSelected = currentSelected.filter((bookingId) => reservedBookingIdSet.has(bookingId));
      if (nextSelected.length !== currentSelected.length) return nextSelected;
      const currentSelectedSet = new Set(currentSelected);
      const hasChanged = nextSelected.some((bookingId) => !currentSelectedSet.has(bookingId));
      return hasChanged ? nextSelected : currentSelected;
    });
  }, [open, reservedBookingIds, reservedBookingIdSet]);

  const handleRemoveConfirm = () => {
    if (!bookingToRemove) return;
    setIsRemoving(true);

    removeParticipantMutation.mutate(
      { sessionId: session.id, bookingId: bookingToRemove.id },
      {
        onSuccess: () => {
          setBookingToRemove(null);
          queryClient.invalidateQueries({ queryKey: ["sessions"] });
        },
        onSettled: () => setIsRemoving(false),
      },
    );
  };

  const handleToggleReservedSelection = (bookingId: string, checked: boolean) => {
    setSelectedReservedBookingIds((currentSelected) => {
      if (checked) return currentSelected.includes(bookingId) ? currentSelected : [...currentSelected, bookingId];
      return currentSelected.filter((selectedId) => selectedId !== bookingId);
    });
  };

  const handleSelectAllReserved = () => {
    setSelectedReservedBookingIds(reservedBookings.map((booking) => booking.id));
  };

  const handleClearReservedSelection = () => {
    setSelectedReservedBookingIds([]);
  };

  const handleConfirmReservedBookings = (bookingIds: string[]) => {
    if (bookingIds.length === 0) return;
    confirmParticipantsMutation.mutate(
      { sessionId: session.id, bookingIds },
      {
        onSuccess: () => {
          setSelectedReservedBookingIds([]);
        },
      },
    );
  };

  const isUpdatingStatuses = confirmParticipantsMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-lg">
          <DialogHeader className="border-b px-4 py-3 pr-10 sm:px-6 sm:py-4">
            <DialogTitle>Session Participants</DialogTitle>
            <DialogDescription>
              {session.item.name} • {session.startTime} - {session.endTime}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="border-muted bg-muted/30 flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg border p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Current Capacity</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {totalSlots} of {session.item.capacity} spots filled
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-2xl font-bold">
                  {totalSlots} / {session.item.capacity}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No participants have been added to this session yet.</AlertDescription>
              </Alert>
            ) : (
              <>
                {reservedBookings.length > 0 && !readOnly && (
                  <div className="bg-primary/5 border-primary/20 space-y-3 rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">Move Reserved Participants to Checked in</p>
                        <p className="text-muted-foreground text-xs">
                          Select specific participants, or check in all reserved in one action.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatPill
                          icon={<Users className="h-3.5 w-3.5" />}
                          label="Reserved"
                          value={reservedBookings.length}
                        />
                        <StatPill
                          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          label="Checked in"
                          value={checkedInBookings.length}
                        />
                      </div>
                    </div>
                    <div className="bg-background/70 flex flex-wrap items-center justify-between gap-2 rounded-md border p-2.5">
                      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                        <ArrowRight className="h-3.5 w-3.5" />
                        {selectedReservedBookingIds.length > 0
                          ? `${selectedReservedBookingIds.length} selected will move to checked in`
                          : `No selection yet - action will check in all ${reservedBookings.length} reserved participants`}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={allReservedSelected ? handleClearReservedSelection : handleSelectAllReserved}
                        disabled={isUpdatingStatuses}
                      >
                        {allReservedSelected ? "Clear Selection" : "Select All Reserved"}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfirmReservedBookings(selectedReservedBookingIds)}
                        disabled={selectedReservedBookingIds.length === 0 || isUpdatingStatuses}
                      >
                        {isUpdatingStatuses
                          ? "Checking in..."
                          : `Check In Selected (${selectedReservedBookingIds.length})`}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConfirmReservedBookings(reservedBookings.map((booking) => booking.id))}
                        disabled={reservedBookings.length === 0 || isUpdatingStatuses}
                      >
                        {isUpdatingStatuses ? "Checking in..." : `Check In All (${moveToCheckedInCount})`}
                      </Button>
                    </div>
                  </div>
                )}
                {reservedBookings.length > 0 && (
                  <BookingSection
                    title={`Reserved Participants (${reservedBookings.length})`}
                    bookings={reservedBookings}
                    variant="reserved"
                    onRemove={setBookingToRemove}
                    isRemoving={isRemoving}
                    selectedBookingIds={selectedReservedSet}
                    onToggleSelect={handleToggleReservedSelection}
                    isUpdatingStatuses={isUpdatingStatuses}
                    readOnly={readOnly}
                  />
                )}
                {checkedInBookings.length > 0 && (
                  <BookingSection
                    title={`Checked in Participants (${checkedInBookings.length})`}
                    bookings={checkedInBookings}
                    variant="confirmed"
                    onRemove={setBookingToRemove}
                    isRemoving={isRemoving}
                    readOnly={readOnly}
                  />
                )}
                {waitlistedBookings.length > 0 && (
                  <BookingSection
                    title={`Waitlisted (${waitlistedBookings.length})`}
                    bookings={waitlistedBookings}
                    variant="waitlisted"
                    onRemove={setBookingToRemove}
                    isRemoving={isRemoving}
                    readOnly={readOnly}
                  />
                )}
              </>
            )}
          </div>

          <DialogFooter className="flex-col-reverse gap-2 border-t px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {!readOnly && (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => setIsAddParticipantOpen(true)}
                disabled={isLoading}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Participant
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!bookingToRemove} onOpenChange={(open) => !open && setBookingToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{bookingToRemove ? bookingToRemove.user.name || bookingToRemove.user.email : ""}</strong> from
              this session?
              {bookingToRemove?.status === "CHECKED_IN" && " Their quota will be restored."}
              {bookingToRemove?.status === "WAITLISTED" &&
                " If there's space, the next waitlisted member will be automatically checked in."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={isRemoving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!readOnly && (
        <AddParticipantDialog open={isAddParticipantOpen} onOpenChange={setIsAddParticipantOpen} session={session} />
      )}
    </>
  );
}

interface StatPillProps {
  icon: ReactNode;
  label: string;
  value: number;
}

function StatPill({ icon, label, value }: StatPillProps) {
  return (
    <div className="bg-background/70 text-foreground inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium">
      {icon}
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

interface BookingSectionProps {
  title: string;
  bookings: NonNullable<Session["bookings"]>;
  variant: "confirmed" | "waitlisted" | "reserved";
  onRemove: (booking: NonNullable<Session["bookings"]>[number]) => void;
  isRemoving: boolean;
  selectedBookingIds?: Set<string>;
  onToggleSelect?: (bookingId: string, checked: boolean) => void;
  isUpdatingStatuses?: boolean;
  readOnly?: boolean;
}

function BookingSection({
  title,
  bookings,
  variant,
  onRemove,
  isRemoving,
  selectedBookingIds,
  onToggleSelect,
  isUpdatingStatuses = false,
  readOnly = false,
}: BookingSectionProps) {
  const isWaitlisted = variant === "waitlisted";
  const isReserved = variant === "reserved";

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{title}</h4>
      <ScrollArea className="max-h-[300px]">
        <div className="space-y-2">
          {bookings.map((booking, index) => (
            <div
              key={booking.id}
              className={
                isWaitlisted
                  ? "flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3 transition-colors hover:bg-amber-50"
                  : isReserved
                    ? "border-primary/20 bg-primary/5 hover:bg-primary/10 flex items-center justify-between rounded-lg border p-3 transition-colors"
                    : "border-muted hover:bg-muted/30 flex items-center justify-between rounded-lg border p-3 transition-colors"
              }
            >
              <div className="flex flex-1 items-center gap-3">
                {isReserved && !readOnly && (
                  <Checkbox
                    checked={selectedBookingIds?.has(booking.id) ?? false}
                    onCheckedChange={(checked) => onToggleSelect?.(booking.id, checked === true)}
                    disabled={isUpdatingStatuses}
                    aria-label={`Select ${booking.user.name || booking.user.email || "participant"}`}
                  />
                )}
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className={
                      isWaitlisted
                        ? "bg-amber-100 text-amber-700"
                        : isReserved
                          ? "bg-primary/15 text-primary"
                          : "bg-primary/10 text-primary"
                    }
                  >
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{booking.user.name || "No Name"}</p>
                    {isWaitlisted && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        #{index + 1} in queue
                      </span>
                    )}
                    {isReserved && (
                      <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                        Reserved
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">{booking.user.email}</p>
                </div>
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(booking)}
                  disabled={isRemoving}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0 p-0"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
