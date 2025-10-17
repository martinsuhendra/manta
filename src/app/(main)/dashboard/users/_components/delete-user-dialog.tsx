"use client";

import * as React from "react";

import { Trash2, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDeleteUser } from "@/hooks/use-users-query";
import { USER_ROLES, USER_ROLE_LABELS, getRoleVariant } from "@/lib/types";

import { User } from "./schema";

interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const useDeletePermissions = (user: User | null, session: ReturnType<typeof useSession>["data"]) => {
  const currentUserRole = session?.user.role;
  const canDeleteSuperAdmin = currentUserRole === USER_ROLES.SUPERADMIN;
  const isTargetSuperAdmin = user?.role === USER_ROLES.SUPERADMIN;
  const isSelfDelete = user?.id === session?.user.id;
  const canDelete = !isSelfDelete && (!isTargetSuperAdmin || canDeleteSuperAdmin);

  return { canDelete, isSelfDelete, isTargetSuperAdmin, canDeleteSuperAdmin };
};

interface WarningMessagesProps {
  canDelete: boolean;
  isSelfDelete: boolean;
  isTargetSuperAdmin: boolean;
  canDeleteSuperAdmin: boolean;
}

const WarningMessages = ({
  canDelete,
  isSelfDelete,
  isTargetSuperAdmin,
  canDeleteSuperAdmin,
}: WarningMessagesProps) => {
  if (!canDelete) {
    return (
      <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-destructive mt-0.5 h-5 w-5" />
          <div className="space-y-1">
            <p className="text-destructive text-sm font-medium">Cannot Delete User</p>
            <p className="text-muted-foreground text-sm">
              {isSelfDelete && "You cannot delete your own account."}
              {isTargetSuperAdmin && !canDeleteSuperAdmin && "Only SUPERADMIN users can delete SUPERADMIN accounts."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-600" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-orange-800">Warning</p>
          <p className="text-sm text-orange-700">
            This user&apos;s memberships and associated data will also be deleted. This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
};

export function DeleteUserDialog({ user, open, onOpenChange }: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser();
  const { data: session } = useSession();
  const { canDelete, isSelfDelete, isTargetSuperAdmin, canDeleteSuperAdmin } = useDeletePermissions(user, session);

  const handleDelete = () => {
    if (!user || !canDelete) return;

    deleteUser.mutate(user.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user account and remove all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{user.name ?? "No Name"}</span>
              <StatusBadge variant={getRoleVariant(user.role)}>{USER_ROLE_LABELS[user.role]}</StatusBadge>
            </div>
            <div className="text-muted-foreground text-sm">{user.email ?? "No Email"}</div>
            <div className="text-muted-foreground text-sm">{user._count.memberships} membership(s)</div>
          </div>

          <WarningMessages
            canDelete={canDelete}
            isSelfDelete={isSelfDelete}
            isTargetSuperAdmin={isTargetSuperAdmin}
            canDeleteSuperAdmin={canDeleteSuperAdmin}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteUser.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={!canDelete || deleteUser.isPending}>
            {deleteUser.isPending ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
