/* eslint-disable complexity */
"use client";

import { useState } from "react";

import { format } from "date-fns";
import { CheckCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMemberBookSession,
  useMemberCancelBooking,
  useSessionEligibility,
  type MemberSession,
} from "@/hooks/use-member-sessions";

interface BookingModalProps {
  session: MemberSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingModal({ session, open, onOpenChange }: BookingModalProps) {
  const [selectedMembershipId, setSelectedMembershipId] = useState<string>("");
  const { data: eligibility, isLoading: eligibilityLoading } = useSessionEligibility(
    session?.id ?? null,
    open && !!session?.id,
  );
  const bookMutation = useMemberBookSession();
  const cancelMutation = useMemberCancelBooking();

  const handleBook = () => {
    if (!session || !eligibility?.canJoin) return;
    const mid =
      eligibility.eligibleMemberships.length === 1 ? eligibility.eligibleMemberships[0].id : selectedMembershipId;
    if (!mid) return;
    bookMutation.mutate(
      { sessionId: session.id, membershipId: mid },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedMembershipId("");
        },
      },
    );
  };

  const handleCancelBooking = () => {
    if (!eligibility?.bookingId) return;
    cancelMutation.mutate(eligibility.bookingId, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!session) return null;

  const canBook = eligibility?.canJoin && (eligibility.eligibleMemberships.length === 1 || !!selectedMembershipId);
  const isPending = bookMutation.isPending || cancelMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{session.item.name}</DialogTitle>
          <DialogDescription>
            {format(new Date(session.date), "EEEE, MMMM d, yyyy")} · {session.startTime}
            {session.endTime ? ` – ${session.endTime}` : ""}
            {session.teacher && <> · {session.teacher.name ?? session.teacher.email ?? "—"}</>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {eligibilityLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : eligibility?.alreadyBooked ? (
            <div className="bg-muted/50 rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">
                You&apos;re booked for this class. You can cancel your booking below.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-3"
                onClick={handleCancelBooking}
                disabled={isPending}
              >
                {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cancel booking
              </Button>
            </div>
          ) : eligibility?.canJoin ? (
            <div className="space-y-3">
              {eligibility.eligibleMemberships.length > 1 && <Label>Select membership</Label>}
              {eligibility.eligibleMemberships.length > 1 ? (
                <RadioGroup value={selectedMembershipId} onValueChange={setSelectedMembershipId}>
                  {eligibility.eligibleMemberships.map((m) => (
                    <div key={m.id} className="border-input flex items-start space-x-3 rounded-lg border p-3">
                      <RadioGroupItem value={m.id} id={m.id} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={m.id} className="cursor-pointer font-medium">
                          {m.product.name}
                        </Label>
                        {m.remainingQuota !== null && (
                          <p className="text-muted-foreground text-xs">{m.remainingQuota} sessions remaining</p>
                        )}
                        {m.remainingQuota === null && <p className="text-muted-foreground text-xs">Unlimited</p>}
                      </div>
                      <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="border-input flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{eligibility.eligibleMemberships[0].product.name}</p>
                    {eligibility.eligibleMemberships[0].remainingQuota !== null ? (
                      <p className="text-muted-foreground text-xs">
                        {eligibility.eligibleMemberships[0].remainingQuota} sessions remaining
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs">Unlimited</p>
                    )}
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              )}
              <Button className="w-full" onClick={handleBook} disabled={!canBook || isPending}>
                {bookMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Book class
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {eligibility?.reason ?? "You cannot book this class."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
