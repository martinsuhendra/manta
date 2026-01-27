"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { USER_ROLES, USER_ROLE_LABELS, DEFAULT_USER_ROLE } from "@/lib/types";

import { getAvailableRoles } from "./member-detail-drawer-utils";
import { Member } from "./schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z
    .enum([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.MEMBER, USER_ROLES.TEACHER])
    .default(DEFAULT_USER_ROLE),
  phoneNo: z.string().optional(),
});

export type FormData = z.infer<typeof formSchema>;

interface MemberFormProps {
  mode: "add" | "edit";
  member: Member | null;
  canEditRoles: boolean;
  canCreateSuperAdmin: boolean;
  onSubmit: (data: FormData) => void;
  isPending: boolean;
}

export function MemberForm({ mode, member, canEditRoles, canCreateSuperAdmin, onSubmit, isPending }: MemberFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: member?.name ?? "",
      email: member?.email ?? "",
      role: member?.role ?? DEFAULT_USER_ROLE,
      phoneNo: member?.phoneNo ?? "",
    },
  });

  // Reset form when member or mode changes
  React.useEffect(() => {
    if (mode === "edit" && member) {
      form.reset({
        name: member.name ?? "",
        email: member.email ?? "",
        role: member.role,
        phoneNo: member.phoneNo ?? "",
      });
    } else if (mode === "add") {
      form.reset({
        name: "",
        email: "",
        role: DEFAULT_USER_ROLE,
        phoneNo: "",
      });
    }
  }, [mode, member, form]);

  const availableRoles = getAvailableRoles(mode, canCreateSuperAdmin, canEditRoles, member?.role);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPending) {
      form.handleSubmit(onSubmit)(e);
    }
  };

  return (
    <Form {...form}>
      <form
        id="member-form"
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
            const form = e.currentTarget;
            const inputs = Array.from(form.querySelectorAll("input, select"));
            const currentIndex = inputs.indexOf(e.target);
            const nextInput = inputs[currentIndex + 1] as HTMLElement;
            if (nextInput) {
              e.preventDefault();
              nextInput.focus();
            }
          }
        }}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter member name" {...field} />
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
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {USER_ROLE_LABELS[role] || role}
                    </SelectItem>
                  ))}
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
  );
}
