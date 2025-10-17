"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateUser } from "@/hooks/use-users-query";
import { USER_ROLES, UserRole, USER_ROLE_LABELS } from "@/lib/types";

import { User } from "./schema";

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.MEMBER, USER_ROLES.TEACHER]),
  phoneNo: z.string().optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const updateUser = useUpdateUser();
  const { data: session } = useSession();

  const currentUserRole = session?.user.role;
  const canEditRoles = currentUserRole === USER_ROLES.SUPERADMIN;

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: USER_ROLES.MEMBER,
      phoneNo: "",
    },
  });

  // Update form when user changes
  React.useEffect(() => {
    if (user && open) {
      form.reset({
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role,
        phoneNo: user.phoneNo ?? "",
      });
    }
  }, [user, open, form]);

  // Get available roles based on current user's permissions
  const getAvailableRoles = (): UserRole[] => {
    if (!canEditRoles) {
      // Non-SUPERADMIN users cannot edit roles, return current role only
      return user ? [user.role] : [USER_ROLES.MEMBER];
    }

    // SUPERADMIN can edit all roles
    return [USER_ROLES.MEMBER, USER_ROLES.TEACHER, USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN];
  };

  const onSubmit = (data: EditUserFormData) => {
    if (!user) return;

    updateUser.mutate(
      { userId: user.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user information and settings.
            {!canEditRoles && " (Role editing requires SUPERADMIN privileges)"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={!canEditRoles}>
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
                  {!canEditRoles && (
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
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateUser.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? "Updating..." : "Update User"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
