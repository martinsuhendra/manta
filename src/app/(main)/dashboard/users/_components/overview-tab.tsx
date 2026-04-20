"use client";

import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Mail, Phone, Calendar, Shield, KeyRound, User, PhoneCall, FileSignature } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { useUpdateUserWaiverStatus } from "@/hooks/use-users-query";
import { USER_ROLES, USER_ROLE_LABELS, getRoleVariant } from "@/lib/types";

import { Member, MemberDetails } from "./schema";

interface OverviewTabProps {
  member: Member;
  memberDetails?: MemberDetails | (MemberDetails & { classSessions?: unknown[] }) | null;
}

/* eslint-disable complexity */
export function OverviewTab({ member, memberDetails }: OverviewTabProps) {
  const [isSending, setIsSending] = useState(false);
  const [isWaiverDialogOpen, setIsWaiverDialogOpen] = useState(false);
  const [isWaiverAgreed, setIsWaiverAgreed] = useState(false);
  const updateWaiverStatus = useUpdateUserWaiverStatus();

  const { data: waiverData, isLoading: isWaiverLoading } = useQuery<{
    waiver: { contentHtml: string; version: number; isActive: boolean };
    member: { waiverAcceptedAt: string | null; waiverAcceptedVersion: number | null };
  }>({
    queryKey: ["user-waiver", member.id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${member.id}/waiver`);
      if (!response.ok) throw new Error("Failed to fetch waiver");
      return response.json();
    },
    enabled: isWaiverDialogOpen,
  });

  useEffect(() => {
    if (!waiverData) return;
    setIsWaiverAgreed(Boolean(waiverData.member.waiverAcceptedAt));
  }, [waiverData]);

  const handleSendResetLink = async () => {
    if (!member.email) {
      toast.error("User has no email address");
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch(`/api/admin/users/${member.id}/send-reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send reset link");
        return;
      }
      toast.success("Password reset link sent to user's email");
    } catch {
      toast.error("Failed to send reset link");
    } finally {
      setIsSending(false);
    }
  };
  const isTeacher = member.role === USER_ROLES.TEACHER;
  const teacherDetails = isTeacher && memberDetails && "image" in memberDetails ? memberDetails : null;
  const image = teacherDetails?.image ?? (member as Member & { image?: string }).image;
  const bio = teacherDetails?.bio ?? (member as Member & { bio?: string }).bio;

  const handleSaveWaiverStatus = () => {
    updateWaiverStatus.mutate(
      { userId: member.id, isAccepted: isWaiverAgreed },
      {
        onSuccess: () => {
          toast.success(isWaiverAgreed ? "Waiver marked as agreed" : "Waiver agreement removed");
          setIsWaiverDialogOpen(false);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {isTeacher && (image || bio) && (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profile</h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {image && (
                <Avatar className="h-24 w-24">
                  <AvatarImage src={image} alt={member.name ?? "Profile"} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
              )}
              {bio && (
                <div className="flex-1">
                  <label className="text-muted-foreground text-sm font-medium">About</label>
                  <p className="mt-1 text-base whitespace-pre-wrap">{bio}</p>
                </div>
              )}
            </div>
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-muted-foreground text-sm font-medium">Name</label>
            <p className="text-base font-medium">{member.name ?? "No Name"}</p>
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="text-muted-foreground h-4 w-4" />
              <p className="text-base">{member.email ?? "No Email"}</p>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">Role</label>
            <div className="mt-1">
              <StatusBadge variant={getRoleVariant(member.role)}>
                <Shield className="mr-1 h-3 w-3" />
                {USER_ROLE_LABELS[member.role]}
              </StatusBadge>
            </div>
          </div>

          {member.phoneNo && (
            <div>
              <label className="text-muted-foreground text-sm font-medium">Phone Number</label>
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground h-4 w-4" />
                <p className="text-base">{member.phoneNo}</p>
              </div>
            </div>
          )}

          {member.emergencyContact && (
            <div>
              <label className="text-muted-foreground text-sm font-medium">Emergency Contact</label>
              <div className="flex items-center gap-2">
                <PhoneCall className="text-muted-foreground h-4 w-4" />
                <p className="text-base">{member.emergencyContact}</p>
              </div>
            </div>
          )}

          {member.birthday && (
            <div>
              <label className="text-muted-foreground text-sm font-medium">Birthday</label>
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <p className="text-base">{format(new Date(member.birthday), "MMMM dd, yyyy")}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Account Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-muted-foreground text-sm font-medium">Member Since</label>
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <p className="text-base">{format(new Date(member.createdAt), "MMMM dd, yyyy")}</p>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">Last Updated</label>
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <p className="text-base">{format(new Date(member.updatedAt), "MMMM dd, yyyy")}</p>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">Waiver</label>
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={
                  memberDetails?.waiverAcceptedAt && memberDetails.waiverAcceptedVersion
                    ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60"
                    : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"
                }
                onClick={() => setIsWaiverDialogOpen(true)}
              >
                <FileSignature className="mr-2 h-4 w-4" />
                {memberDetails?.waiverAcceptedAt && memberDetails.waiverAcceptedVersion ? `Accepted` : "Not accepted"}
              </Button>
            </div>
            {memberDetails?.waiverAcceptedAt ? (
              <p className="text-muted-foreground mt-1 text-sm">
                Accepted on {format(new Date(memberDetails.waiverAcceptedAt), "MMMM dd, yyyy")}
              </p>
            ) : (
              <p className="text-muted-foreground mt-1 text-sm">Open to view waiver and update agreement status.</p>
            )}
          </div>

          {member.email && (
            <div>
              <label className="text-muted-foreground text-sm font-medium">Password</label>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={handleSendResetLink} disabled={isSending}>
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  Send Reset Password Link
                </Button>
                <p className="text-muted-foreground mt-1 text-xs">
                  Sends an email with a link for the user to set a new password.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isWaiverDialogOpen} onOpenChange={setIsWaiverDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Member waiver status</DialogTitle>
            <DialogDescription>
              Review current waiver content and update this member&apos;s agreement status.
            </DialogDescription>
          </DialogHeader>

          {isWaiverLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading waiver...
            </div>
          ) : (
            <>
              <div className="max-h-[55vh] overflow-y-auto rounded-md border p-4">
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: waiverData?.waiver.contentHtml ?? "" }} />
                </div>
              </div>

              <div className="rounded-md border p-3">
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox checked={isWaiverAgreed} onCheckedChange={(value) => setIsWaiverAgreed(Boolean(value))} />
                  <span>Mark this member as agreed to the current waiver version.</span>
                </label>
                {waiverData?.waiver.version ? (
                  <p className="text-muted-foreground mt-2 text-xs">
                    Current waiver version: v{waiverData.waiver.version}
                  </p>
                ) : null}
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWaiverDialogOpen(false)}
              disabled={updateWaiverStatus.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveWaiverStatus} disabled={isWaiverLoading || updateWaiverStatus.isPending}>
              {updateWaiverStatus.isPending ? "Saving..." : "Save waiver status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
