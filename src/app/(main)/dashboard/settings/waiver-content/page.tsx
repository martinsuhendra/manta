"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Switch } from "@/components/ui/switch";
import { USER_ROLES } from "@/lib/types";

const formSchema = z.object({
  contentHtml: z.string().min(1, "Waiver content is required"),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface WaiverSettingsResponse {
  contentHtml: string;
  version: number;
  isActive: boolean;
}

export default function WaiverContentPage() {
  const queryClient = useQueryClient();

  const { data: waiver, isLoading } = useQuery({
    queryKey: ["admin-waiver-settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/waiver-settings");
      if (!response.ok) throw new Error("Failed to load waiver settings");
      return response.json() as Promise<WaiverSettingsResponse>;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values:
      waiver != null
        ? {
            contentHtml: waiver.contentHtml,
            isActive: waiver.isActive,
          }
        : undefined,
    defaultValues: {
      contentHtml: "",
      isActive: true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch("/api/admin/waiver-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to save waiver settings");
      }
      return response.json() as Promise<WaiverSettingsResponse>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-waiver-settings"], data);
      toast.success(`Waiver saved (v${data.version})`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(values: FormValues) {
    updateMutation.mutate(values);
  }

  return (
    <RoleGuard allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Waiver content</h1>
          <p className="text-muted-foreground">
            Members must accept the active waiver before they can book sessions. Updating content creates a new waiver
            version and members must accept it once.
          </p>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading waiver settings...
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <FormLabel className="text-base">Waiver is active</FormLabel>
                      <FormDescription>
                        When disabled, members will not be blocked from booking because of waiver acceptance.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentHtml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waiver body</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Write your waiver content..."
                        disabled={updateMutation.isPending}
                        className="min-h-[18rem]"
                        isScrollable={false}
                      />
                    </FormControl>
                    <FormDescription>
                      Current version: <strong>v{waiver?.version ?? 1}</strong>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save waiver"
                )}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </RoleGuard>
  );
}
