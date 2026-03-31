"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const brandFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens only"),
  address: z.string().optional(),
  logo: z.string().optional(),
  primaryColor: z.string().min(1).default("#6366f1"),
  accentColor: z.string().min(1).default("#8b5cf6"),
  isActive: z.boolean().default(true),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;

interface BrandFormProps {
  defaultValues?: Partial<BrandFormValues>;
  onSubmit: (values: BrandFormValues) => void | Promise<void>;
  isPending?: boolean;
  submitLabel?: string;
}

export function BrandForm({ defaultValues, onSubmit, isPending = false, submitLabel = "Save" }: BrandFormProps) {
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      address: "",
      logo: "",
      primaryColor: "#6366f1",
      accentColor: "#8b5cf6",
      isActive: true,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Downtown Gym" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="e.g. downtown-gym" {...field} />
              </FormControl>
              <FormDescription>Used in URLs. Lowercase letters, numbers and hyphens only.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Full address" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://…" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="primaryColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary color</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded border bg-transparent p-1"
                      {...field}
                    />
                  </FormControl>
                  <Input className="font-mono" value={field.value} onChange={field.onChange} placeholder="#6366f1" />
                </div>
                <FormDescription>Theme primary color for this brand.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accentColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accent color</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="color"
                      className="h-10 w-14 cursor-pointer rounded border bg-transparent p-1"
                      {...field}
                    />
                  </FormControl>
                  <Input className="font-mono" value={field.value} onChange={field.onChange} placeholder="#8b5cf6" />
                </div>
                <FormDescription>Theme accent color for this brand.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>Inactive brands are hidden from the brand switcher.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
