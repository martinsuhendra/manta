"use client";

import { useState } from "react";

import { format } from "date-fns";
import { Loader2, Mail, Phone, Calendar, Shield, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { USER_ROLE_LABELS, getRoleVariant } from "@/lib/types";

import { Member } from "./schema";

interface OverviewTabProps {
  member: Member;
}

export function OverviewTab({ member }: OverviewTabProps) {
  const [isSending, setIsSending] = useState(false);

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
  return (
    <div className="space-y-6">
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
    </div>
  );
}
