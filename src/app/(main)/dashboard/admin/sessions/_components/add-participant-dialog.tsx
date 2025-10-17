"use client";

import * as React from "react";
import { useState, useEffect } from "react";

import { format } from "date-fns";
import { AlertCircle, Calendar, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { UserCombobox } from "@/app/(main)/dashboard/admin/memberships/_components/user-combobox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddSessionParticipant } from "@/hooks/use-bookings-mutation";
import { useEligibleMembersQuery } from "@/hooks/use-eligible-members-query";

import { Session, EligibleMembership } from "./schema";

interface AddParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
}

export function AddParticipantDialog({ open, onOpenChange, session }: AddParticipantDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMembershipId, setSelectedMembershipId] = useState<string>("");

  const addParticipantMutation = useAddSessionParticipant();
  const { data: members = [], isLoading, isError } = useEligibleMembersQuery(session.id, open);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedUserId("");
      setSelectedMembershipId("");
    }
  }, [open]);

  // Show error toast if fetching fails
  useEffect(() => {
    if (isError) {
      toast.error("Failed to fetch members");
    }
  }, [isError]);

  const selectedMember = members.find((m) => m.id === selectedUserId);
  const eligibleMemberships = selectedMember?.memberships.filter((m) => m.isEligible) || [];
  const ineligibleMemberships = selectedMember?.memberships.filter((m) => !m.isEligible) || [];

  const handleSubmit = () => {
    if (!selectedUserId || !selectedMembershipId) {
      toast.error("Please select a member and membership");
      return;
    }

    addParticipantMutation.mutate(
      {
        sessionId: session.id,
        userId: selectedUserId,
        membershipId: selectedMembershipId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  const usersForCombobox = members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Participant to Session</DialogTitle>
          <DialogDescription>
            Add a member to {session.item.name} on {format(new Date(session.date), "MMM d, yyyy")} at{" "}
            {session.startTime}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label>Select Member</Label>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <UserCombobox
                users={usersForCombobox}
                value={selectedUserId}
                onValueChange={(value) => {
                  setSelectedUserId(value);
                  setSelectedMembershipId(""); // Reset membership selection
                }}
                placeholder="Select a member..."
              />
            )}
          </div>

          {/* Membership Selection */}
          {selectedMember && (
            <div className="space-y-3">
              <Label>Select Membership</Label>

              {selectedMember.memberships.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This member has no active memberships. Please assign a membership first.
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="max-h-[300px] pr-4">
                  <RadioGroup value={selectedMembershipId} onValueChange={setSelectedMembershipId}>
                    <div className="space-y-3">
                      {/* Eligible Memberships */}
                      {eligibleMemberships.map((membership) => (
                        <MembershipCard
                          key={membership.id}
                          membership={membership}
                          isSelected={selectedMembershipId === membership.id}
                          onSelect={() => setSelectedMembershipId(membership.id)}
                        />
                      ))}

                      {/* Ineligible Memberships */}
                      {ineligibleMemberships.map((membership) => (
                        <MembershipCard
                          key={membership.id}
                          membership={membership}
                          isSelected={false}
                          onSelect={() => {}} // Disabled
                          disabled
                        />
                      ))}
                    </div>
                  </RadioGroup>
                </ScrollArea>
              )}

              {/* Warning if no eligible memberships */}
              {eligibleMemberships.length === 0 && selectedMember.memberships.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This member has no eligible memberships for this class. They may have reached their quota limit or
                    their memberships don&apos;t include this class type.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={addParticipantMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedUserId || !selectedMembershipId || addParticipantMutation.isPending}
          >
            {addParticipantMutation.isPending ? "Adding..." : "Add Participant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MembershipCardProps {
  membership: EligibleMembership;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function MembershipCard({ membership, isSelected, onSelect, disabled = false }: MembershipCardProps) {
  return (
    <div
      className={`border-input hover:border-primary relative flex cursor-pointer items-start space-x-3 rounded-lg border p-4 transition-colors ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } ${isSelected ? "border-primary bg-primary/5" : ""}`}
      onClick={() => !disabled && onSelect()}
    >
      <RadioGroupItem value={membership.id} id={membership.id} className="mt-1" disabled={disabled} />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={membership.id}
            className={`text-base font-semibold ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            {membership.product.name}
          </Label>
          {membership.isEligible ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />
              Eligible
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              <AlertCircle className="mr-1 h-3 w-3" />
              Not Eligible
            </Badge>
          )}
        </div>

        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Expires: {format(new Date(membership.expiredAt), "MMM d, yyyy")}</span>
          </div>
          {membership.remainingQuota !== null && (
            <div>
              <span className="font-medium">Quota:</span> {membership.remainingQuota} remaining
            </div>
          )}
          {membership.remainingQuota === null && membership.isEligible && (
            <div>
              <span className="font-medium">Unlimited</span> quota
            </div>
          )}
        </div>

        {!membership.isEligible && <p className="text-destructive text-sm">{membership.reason}</p>}
      </div>
    </div>
  );
}
