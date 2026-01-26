/* eslint-disable react/no-array-index-key */
"use client";

import * as React from "react";
import { useState, useEffect } from "react";

import axios from "axios";
import { AlertCircle, User, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRemoveSessionParticipant } from "@/hooks/use-bookings-mutation";

import { Session } from "./schema";

interface ParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
}

interface Booking {
  id: string;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW" | "WAITLISTED";
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface SessionWithBookings extends Session {
  bookings: Booking[];
}

export function ParticipantsDialog({ open, onOpenChange, session }: ParticipantsDialogProps) {
  const [sessionWithBookings, setSessionWithBookings] = useState<SessionWithBookings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingToRemove, setBookingToRemove] = useState<Booking | null>(null);

  const removeParticipantMutation = useRemoveSessionParticipant();

  // Fetch session with bookings when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      axios
        .get(`/api/admin/sessions/${session.id}`)
        .then((response) => {
          setSessionWithBookings(response.data);
        })
        .catch((error) => {
          console.error("Error fetching session details:", error);
          toast.error("Failed to fetch participants");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setSessionWithBookings(null);
    }
  }, [open, session.id]);

  const handleRemoveClick = (booking: Booking) => {
    setBookingToRemove(booking);
  };

  const handleRemoveConfirm = () => {
    if (!bookingToRemove) return;

    removeParticipantMutation.mutate(
      {
        sessionId: session.id,
        bookingId: bookingToRemove.id,
      },
      {
        onSuccess: () => {
          setBookingToRemove(null);
          // Refresh the session data
          axios.get(`/api/admin/sessions/${session.id}`).then((response) => {
            setSessionWithBookings(response.data);
          });
        },
      },
    );
  };

  const bookings = sessionWithBookings?.bookings || [];
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED");
  const waitlistedBookings = bookings.filter((b) => b.status === "WAITLISTED");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Session Participants</DialogTitle>
            <DialogDescription>
              {session.item.name} • {session.startTime} - {session.endTime}
            </DialogDescription>
          </DialogHeader>

          {/* Capacity Indicator */}
          <div className="border-muted bg-muted/30 flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Current Capacity</p>
                <p className="text-muted-foreground text-xs">
                  {confirmedBookings.length} of {session.item.capacity} spots filled
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {confirmedBookings.length} / {session.item.capacity}
              </p>
            </div>
          </div>

          {/* Participants List */}
          <div className="space-y-4">
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
                {/* Confirmed Participants */}
                {confirmedBookings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Confirmed Participants ({confirmedBookings.length})</h4>
                    <ScrollArea className="max-h-[300px]">
                      <div className="space-y-2">
                        {confirmedBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="border-muted hover:bg-muted/30 flex items-center justify-between rounded-lg border p-3 transition-colors"
                          >
                            <div className="flex flex-1 items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{booking.user.name || "No Name"}</p>
                                <p className="text-muted-foreground truncate text-xs">{booking.user.email}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveClick(booking)}
                              disabled={removeParticipantMutation.isPending}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0 p-0"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Waitlisted Participants */}
                {waitlistedBookings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Waitlisted ({waitlistedBookings.length})</h4>
                    <ScrollArea className="max-h-[300px]">
                      <div className="space-y-2">
                        {waitlistedBookings.map((booking, index) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3 transition-colors hover:bg-amber-50"
                          >
                            <div className="flex flex-1 items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-amber-100 text-amber-700">
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-medium">{booking.user.name || "No Name"}</p>
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    #{index + 1} in queue
                                  </span>
                                </div>
                                <p className="text-muted-foreground truncate text-xs">{booking.user.email}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveClick(booking)}
                              disabled={removeParticipantMutation.isPending}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0 p-0"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!bookingToRemove} onOpenChange={(open) => !open && setBookingToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{bookingToRemove?.user.name || bookingToRemove?.user.email}</strong> from this session?
              {bookingToRemove?.status === "CONFIRMED" && " Their quota will be restored."}
              {bookingToRemove?.status === "WAITLISTED" &&
                " If there's space, the next waitlisted member will be automatically confirmed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeParticipantMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={removeParticipantMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {removeParticipantMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
