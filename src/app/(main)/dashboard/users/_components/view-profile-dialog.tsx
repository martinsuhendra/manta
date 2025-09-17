"use client";

import * as React from "react";

import { format } from "date-fns";
import { User, Mail, Phone, Calendar, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { USER_ROLE_LABELS } from "@/lib/types";

import { User as UserType } from "./schema";

interface ViewProfileDialogProps {
  user: UserType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewProfileDialog({ user, open, onOpenChange }: ViewProfileDialogProps) {
  if (!user) return null;

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "destructive";
      case "ADMIN":
        return "default";
      case "TEACHER":
        return "secondary";
      case "MEMBER":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </DialogTitle>
          <DialogDescription>View user details and account information.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-muted-foreground text-sm font-medium">Name</label>
              <p className="text-base font-medium">{user.name ?? "No Name"}</p>
            </div>

            <div>
              <label className="text-muted-foreground text-sm font-medium">Email</label>
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <p className="text-base">{user.email ?? "No Email"}</p>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground text-sm font-medium">Role</label>
              <div className="mt-1">
                <Badge variant={getRoleVariant(user.role)}>
                  <Shield className="mr-1 h-3 w-3" />
                  {USER_ROLE_LABELS[user.role]}
                </Badge>
              </div>
            </div>

            {user.phoneNo && (
              <div>
                <label className="text-muted-foreground text-sm font-medium">Phone Number</label>
                <div className="flex items-center gap-2">
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <p className="text-base">{user.phoneNo}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-4 border-t pt-4">
            <div>
              <label className="text-muted-foreground text-sm font-medium">Memberships</label>
              <div className="mt-1">
                <Badge variant="secondary">{user._count.memberships} membership(s)</Badge>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground text-sm font-medium">Member Since</label>
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <p className="text-base">{format(new Date(user.createdAt), "MMMM dd, yyyy")}</p>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground text-sm font-medium">Last Updated</label>
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <p className="text-base">{format(new Date(user.updatedAt), "MMMM dd, yyyy")}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
