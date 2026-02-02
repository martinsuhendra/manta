"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { USER_ROLES, USER_ROLE_LABELS, DEFAULT_USER_ROLE } from "@/lib/types";

import { getAvailableRoles } from "./member-detail-drawer-utils";
import { Member } from "./schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z
    .enum([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.MEMBER, USER_ROLES.TEACHER])
    .default(DEFAULT_USER_ROLE),
  phoneNo: z
    .string()
    .min(1, "Phone number is required")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
  image: z.string().nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
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
  const memberWithExtras = member as Member & { image?: string | null; bio?: string | null };
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: member?.name ?? "",
      email: member?.email ?? "",
      role: member?.role ?? DEFAULT_USER_ROLE,
      phoneNo: member?.phoneNo ?? "",
      image: memberWithExtras?.image ?? null,
      bio: memberWithExtras?.bio ?? null,
    },
  });

  // Reset form when member or mode changes
  React.useEffect(() => {
    if (mode === "edit" && member) {
      const m = member as Member & { image?: string | null; bio?: string | null };
      form.reset({
        name: member.name ?? "",
        email: member.email ?? "",
        role: member.role,
        phoneNo: member.phoneNo ?? "",
        image: m.image ?? null,
        bio: m.bio ?? null,
      });
    } else if (mode === "add") {
      form.reset({
        name: "",
        email: "",
        role: DEFAULT_USER_ROLE,
        phoneNo: "",
        image: null,
        bio: null,
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
              <FormLabel>Phone Number </FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(form.watch("role") === USER_ROLES.TEACHER || member?.role === USER_ROLES.TEACHER) && (
          <>
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value ?? undefined}
                      onChange={(v) => field.onChange(v ?? null)}
                      aspectRatio="square"
                      className="max-w-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell members about your background, specialties, and teaching style..."
                      className="min-h-[100px] resize-y"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">Max 2000 characters. Shown on your profile.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </form>
    </Form>
  );
}
