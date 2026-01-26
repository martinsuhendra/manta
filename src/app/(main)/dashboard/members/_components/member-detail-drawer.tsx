"use client";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { Trash2, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

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
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users-query";
import { USER_ROLES, USER_ROLE_LABELS, getRoleVariant } from "@/lib/types";

import { DrawerFooterButtons } from "./drawer-footer-buttons";
import { DrawerHeaderContent } from "./drawer-header-content";
import { LoadingSpinner } from "./loading-spinner";
import { MemberForm, type FormData } from "./member-form";
import { OverviewTab } from "./overview-tab";
import { Member, MemberDetails } from "./schema";
import { TabTriggers } from "./tab-triggers";
import { AttendanceTab } from "./tabs/attendance-tab";
import { MembershipsTab } from "./tabs/memberships-tab";
import { TransactionsTab } from "./tabs/transactions-tab";

type DrawerMode = "view" | "edit" | "add" | null;

interface MemberDetailDrawerProps {
  member: Member | null;
  mode: DrawerMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: DrawerMode) => void;
}

const useDeletePermissions = (member: Member | null, session: ReturnType<typeof useSession>["data"]) => {
  const currentUserRole = session?.user.role;
  const canDeleteSuperAdmin = currentUserRole === USER_ROLES.SUPERADMIN;
  const isTargetSuperAdmin = member?.role === USER_ROLES.SUPERADMIN;
  const isSelfDelete = member?.id === session?.user.id;
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
            <p className="text-destructive text-sm font-medium">Cannot Delete Member</p>
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
            This member&apos;s memberships, transactions, and attendance records will also be deleted. This action
            cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
};

export function MemberDetailDrawer({ member, mode, open, onOpenChange, onModeChange }: MemberDetailDrawerProps) {
  const { data: session } = useSession();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("overview");

  const currentUserRole = session?.user.role;
  const canCreateSuperAdmin = currentUserRole === USER_ROLES.SUPERADMIN;
  const canEditRoles = currentUserRole === USER_ROLES.SUPERADMIN;
  const { canDelete, isSelfDelete, isTargetSuperAdmin, canDeleteSuperAdmin } = useDeletePermissions(member, session);

  // Fetch detailed member data when in view mode
  const { data: memberDetails, isLoading: isLoadingDetails } = useQuery<MemberDetails>({
    queryKey: ["member-details", member?.id],
    queryFn: async () => {
      if (!member?.id) throw new Error("Member ID is required");
      const response = await fetch(`/api/users/${member.id}/details`);
      if (!response.ok) throw new Error("Failed to fetch member details");
      return response.json();
    },
    enabled: mode === "view" && !!member?.id && open,
  });

  // Reset tab when drawer opens/closes
  React.useEffect(() => {
    if (open && mode === "view") {
      setActiveTab("overview");
    }
  }, [open, mode]);

  const handleSubmit = (data: FormData) => {
    if (mode === "add") {
      createUser.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          onModeChange(null);
          toast.success("Member created successfully");
        },
      });
      return;
    }

    if (mode === "edit" && member) {
      updateUser.mutate(
        { userId: member.id, data },
        {
          onSuccess: () => {
            onOpenChange(false);
            onModeChange(null);
            toast.success("Member updated successfully");
          },
        },
      );
    }
  };

  const handleDelete = () => {
    if (!member || !canDelete) return;

    deleteUser.mutate(member.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        onOpenChange(false);
        onModeChange(null);
        toast.success("Member deleted successfully");
      },
    });
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="!w-auto !min-w-fit sm:!max-w-none">
          <DrawerHeader>{mode && <DrawerHeaderContent mode={mode} canEditRoles={canEditRoles} />}</DrawerHeader>

          <div className="overflow-y-auto px-4 pb-4">
            {mode === "view" && member ? (
              isLoadingDetails ? (
                <LoadingSpinner />
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-col justify-start gap-6">
                  <TabTriggers memberDetails={memberDetails} />

                  <TabsContent value="overview" className="relative flex flex-col gap-4 overflow-auto">
                    <OverviewTab member={member} />
                  </TabsContent>

                  <TabsContent value="memberships" className="flex flex-col">
                    {memberDetails ? (
                      <MembershipsTab
                        memberships={memberDetails.memberships}
                        memberId={member.id}
                        memberName={member.name}
                      />
                    ) : (
                      <LoadingSpinner />
                    )}
                  </TabsContent>

                  <TabsContent value="transactions" className="flex flex-col">
                    {memberDetails ? (
                      <TransactionsTab transactions={memberDetails.transactions} memberId={member.id} />
                    ) : (
                      <LoadingSpinner />
                    )}
                  </TabsContent>

                  <TabsContent value="attendance" className="flex flex-col">
                    {memberDetails ? (
                      <AttendanceTab bookings={memberDetails.bookings} memberId={member.id} />
                    ) : (
                      <LoadingSpinner />
                    )}
                  </TabsContent>
                </Tabs>
              )
            ) : mode === "edit" || mode === "add" ? (
              <MemberForm
                mode={mode}
                member={member}
                canEditRoles={canEditRoles}
                canCreateSuperAdmin={canCreateSuperAdmin}
                onSubmit={handleSubmit}
                isPending={createUser.isPending || updateUser.isPending}
              />
            ) : null}
          </div>

          {mode && (
            <DrawerFooterButtons
              mode={mode}
              canDelete={canDelete}
              isPending={createUser.isPending || updateUser.isPending}
              onEdit={() => onModeChange("edit")}
              onDelete={() => setDeleteDialogOpen(true)}
            />
          )}
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the member account and remove all associated
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {member && (
            <div className="space-y-4">
              {/* Member Info */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{member.name ?? "No Name"}</span>
                  <StatusBadge variant={getRoleVariant(member.role)}>{USER_ROLE_LABELS[member.role]}</StatusBadge>
                </div>
                <div className="text-muted-foreground text-sm">{member.email ?? "No Email"}</div>
                <div className="text-muted-foreground text-sm">
                  {member._count.memberships} membership(s), {member._count.transactions} transaction(s),{" "}
                  {member._count.bookings} booking(s)
                </div>
              </div>

              <WarningMessages
                canDelete={canDelete}
                isSelfDelete={isSelfDelete}
                isTargetSuperAdmin={isTargetSuperAdmin}
                canDeleteSuperAdmin={canDeleteSuperAdmin}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!canDelete || deleteUser.isPending}
              className="bg-destructive hover:bg-destructive/90 text-white hover:text-white"
            >
              {deleteUser.isPending ? "Deleting..." : "Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
