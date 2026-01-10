"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Pencil, Plus, Trash2, User, Mail, Phone, Calendar, Shield, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users-query";
import { USER_ROLES, UserRole, USER_ROLE_LABELS, DEFAULT_USER_ROLE, getRoleVariant } from "@/lib/types";

import { User as UserType } from "./schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z
    .enum([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.MEMBER, USER_ROLES.TEACHER])
    .default(DEFAULT_USER_ROLE),
  phoneNo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type DrawerMode = "view" | "edit" | "add" | null;

interface UserDetailDrawerProps {
  user: UserType | null;
  mode: DrawerMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: DrawerMode) => void;
}

const useDeletePermissions = (user: UserType | null, session: ReturnType<typeof useSession>["data"]) => {
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

export function UserDetailDrawer({ user, mode, open, onOpenChange, onModeChange }: UserDetailDrawerProps) {
  const { data: session } = useSession();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const currentUserRole = session?.user.role;
  const canCreateSuperAdmin = currentUserRole === USER_ROLES.SUPERADMIN;
  const canEditRoles = currentUserRole === USER_ROLES.SUPERADMIN;
  const { canDelete, isSelfDelete, isTargetSuperAdmin, canDeleteSuperAdmin } = useDeletePermissions(user, session);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: DEFAULT_USER_ROLE,
      phoneNo: "",
    },
  });

  // Get available roles based on current user's permissions
  const getAvailableRoles = (): UserRole[] => {
    if (mode === "add") {
      const baseRoles: UserRole[] = [USER_ROLES.MEMBER, USER_ROLES.TEACHER, USER_ROLES.ADMIN];
      if (canCreateSuperAdmin) {
        baseRoles.push(USER_ROLES.SUPERADMIN);
      }
      return baseRoles;
    }

    // For edit mode
    if (!canEditRoles) {
      return user ? [user.role] : [USER_ROLES.MEMBER];
    }
    return [USER_ROLES.MEMBER, USER_ROLES.TEACHER, USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN];
  };

  // Reset form when user or mode changes
  React.useEffect(() => {
    if (mode === "edit" && user && open) {
      form.reset({
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role,
        phoneNo: user.phoneNo ?? "",
      });
    } else if (mode === "add" && open) {
      form.reset({
        name: "",
        email: "",
        role: DEFAULT_USER_ROLE,
        phoneNo: "",
      });
    }
  }, [user, mode, open, form]);

  const onSubmit = (data: FormData) => {
    if (mode === "add") {
      createUser.mutate(data, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
          onModeChange(null);
          toast.success("User created successfully");
        },
      });
    } else if (mode === "edit" && user) {
      updateUser.mutate(
        { userId: user.id, data },
        {
          onSuccess: () => {
            onOpenChange(false);
            onModeChange(null);
            toast.success("User updated successfully");
          },
        },
      );
    }
  };

  const handleDelete = () => {
    if (!user || !canDelete) return;

    deleteUser.mutate(user.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        onOpenChange(false);
        onModeChange(null);
        toast.success("User deleted successfully");
      },
    });
  };

  const getTitle = () => {
    if (mode === "add") return "Add New User";
    if (mode === "edit") return "Edit User";
    return "User Profile";
  };

  const getDescription = () => {
    if (mode === "add") return "Create a new user account. Fill in the required information below.";
    if (mode === "edit")
      return `Update user information and settings.${!canEditRoles ? " (Role editing requires SUPERADMIN privileges)" : ""}`;
    return "View user details and account information.";
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              {mode === "add" && <Plus className="h-5 w-5" />}
              {mode === "edit" && <Pencil className="h-5 w-5" />}
              {mode === "view" && <User className="h-5 w-5" />}
              {getTitle()}
            </DrawerTitle>
            <DrawerDescription>{getDescription()}</DrawerDescription>
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-4">
            {mode === "view" && user ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
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
                        <StatusBadge variant={getRoleVariant(user.role)}>
                          <Shield className="mr-1 h-3 w-3" />
                          {USER_ROLE_LABELS[user.role]}
                        </StatusBadge>
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
                </div>

                <Separator />

                {/* Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Account Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-muted-foreground text-sm font-medium">Memberships</label>
                      <div className="mt-1">
                        <StatusBadge variant="secondary">{user._count.memberships} membership(s)</StatusBadge>
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
              </div>
            ) : mode === "edit" || mode === "add" ? (
              <Form {...form}>
                <form id="user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter user name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                          disabled={mode === "edit" && !canEditRoles}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getAvailableRoles().map((role) => {
                              const label = Object.entries(USER_ROLE_LABELS).find(([key]) => key === role)?.[1] || role;
                              return (
                                <SelectItem key={role} value={role}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {mode === "edit" && !canEditRoles && (
                          <p className="text-muted-foreground text-xs">Only SUPERADMIN users can edit roles</p>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            ) : null}
          </div>

          {mode === "view" && user && (
            <DrawerFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onModeChange("edit");
                }}
                className="w-full"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit User
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={!canDelete}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </Button>
            </DrawerFooter>
          )}

          {(mode === "edit" || mode === "add") && (
            <DrawerFooter className="gap-2">
              <Button
                type="submit"
                form="user-form"
                disabled={createUser.isPending || updateUser.isPending}
                className="flex-1"
              >
                {createUser.isPending || updateUser.isPending
                  ? mode === "add"
                    ? "Creating..."
                    : "Updating..."
                  : mode === "add"
                    ? "Create User"
                    : "Update User"}
              </Button>
              <DrawerClose asChild>
                <Button type="button" variant="outline" disabled={createUser.isPending || updateUser.isPending}>
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and remove all associated
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {user && (
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
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!canDelete || deleteUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
