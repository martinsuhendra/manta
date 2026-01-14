"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { USER_ROLES } from "@/lib/types";
import { cn } from "@/lib/utils";

import { EmptyProductsState } from "./empty-products-state";
import {
  createMembershipSchema,
  Membership,
  updateMembershipSchema,
  UpdateMembershipForm,
  CreateMembershipForm,
} from "./schema";
import { UserCombobox } from "./user-combobox";

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  validDays: number;
  quota: number;
}

type DrawerMode = "view" | "edit" | "add" | null;

interface MembershipDetailDrawerProps {
  membership: Membership | null;
  mode: DrawerMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: DrawerMode) => void;
}

export function MembershipDetailDrawer({
  membership,
  mode,
  open,
  onOpenChange,
  onModeChange,
}: MembershipDetailDrawerProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const form = useForm<CreateMembershipForm | UpdateMembershipForm>({
    resolver: zodResolver(mode === "add" ? createMembershipSchema : updateMembershipSchema),
    defaultValues: {
      status: "ACTIVE",
    },
  });

  // Fetch users (only MEMBER role) for add mode
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users", "MEMBER"],
    queryFn: async () => {
      const response = await fetch(`/api/users?role=${USER_ROLES.MEMBER}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: mode === "add",
  });

  // Fetch products for add mode
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: mode === "add",
  });

  // Reset form when membership or mode changes
  React.useEffect(() => {
    if (mode === "edit" && membership && open) {
      form.reset({
        status: membership.status as "ACTIVE" | "EXPIRED" | "SUSPENDED" | "PENDING",
        expiredAt: format(new Date(membership.expiredAt), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
      });
    } else if (mode === "add" && open) {
      form.reset({
        status: "ACTIVE",
        userId: undefined,
        productId: undefined,
        joinDate: undefined,
      });
    }
  }, [membership, mode, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateMembershipForm) => {
      const response = await fetch("/api/admin/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create membership");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-memberships"] });
      onOpenChange(false);
      onModeChange(null);
      form.reset();
      toast.success("Membership created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateMembershipForm) => {
      if (!membership) throw new Error("No membership selected");

      const response = await fetch(`/api/admin/memberships/${membership.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update membership");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-memberships"] });
      onOpenChange(false);
      onModeChange(null);
      toast.success("Membership updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!membership) throw new Error("No membership selected");

      const response = await fetch(`/api/admin/memberships/${membership.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete membership");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-memberships"] });
      setDeleteDialogOpen(false);
      onOpenChange(false);
      onModeChange(null);
      toast.success("Membership deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: CreateMembershipForm | UpdateMembershipForm) => {
    if (mode === "add") {
      createMutation.mutate(data as CreateMembershipForm);
    } else if (mode === "edit") {
      updateMutation.mutate(data as UpdateMembershipForm);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const hasProducts = products.length > 0;
  const isExpired = membership ? new Date(membership.expiredAt) < new Date() : false;
  const statusVariant =
    membership?.status === "ACTIVE"
      ? "default"
      : membership?.status === "PENDING"
        ? "warning"
        : membership?.status === "EXPIRED"
          ? "destructive"
          : membership?.status === "SUSPENDED"
            ? "secondary"
            : "outline";

  const getTitle = () => {
    if (mode === "add") return "Add New Membership";
    if (mode === "edit") return "Edit Membership";
    return "Membership Details";
  };

  const getDescription = () => {
    if (mode === "add")
      return "Create a new membership for a user. The membership will be automatically configured based on the selected product.";
    if (mode === "edit")
      return membership ? `Update membership details for ${membership.user.name || membership.user.email}.` : "";
    return "Complete information about this membership.";
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader>
            <DrawerTitle>{getTitle()}</DrawerTitle>
            <DrawerDescription>{getDescription()}</DrawerDescription>
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-4">
            {mode === "add" && !hasProducts ? (
              <EmptyProductsState />
            ) : mode === "view" && membership ? (
              <div className="space-y-6">
                {/* User Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">User Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground font-medium">Name:</span>
                      <div>{membership.user.name || "N/A"}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Email:</span>
                      <div>{membership.user.email || "N/A"}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Phone:</span>
                      <div>{membership.user.phoneNo || "N/A"}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Product Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Product Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground font-medium">Product:</span>
                      <div>{membership.product.name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Price:</span>
                      <div>${membership.product.price}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Valid Days:</span>
                      <div>{membership.product.validDays} days</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Membership Status */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Membership Status</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground font-medium">Status:</span>
                      <div className="mt-1">
                        <StatusBadge variant={statusVariant}>{membership.status}</StatusBadge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Join Date:</span>
                      <div>{format(new Date(membership.joinDate), "MMM dd, yyyy")}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Expires:</span>
                      <div className={isExpired ? "text-destructive font-medium" : ""}>
                        {format(new Date(membership.expiredAt), "MMM dd, yyyy 'at' HH:mm")}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Timestamps */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Timestamps</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground font-medium">Created:</span>
                      <div>{format(new Date(membership.createdAt), "MMM dd, yyyy 'at' HH:mm")}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Updated:</span>
                      <div>{format(new Date(membership.updatedAt), "MMM dd, yyyy 'at' HH:mm")}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : mode === "edit" || mode === "add" ? (
              <Form {...form}>
                <form id="membership-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {mode === "add" && (
                    <>
                      <FormField
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>User (Members only)</FormLabel>
                            <FormControl>
                              <UserCombobox
                                users={users}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder="Search and select a user..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger
                                  className="data-[size=default]:!h-12 data-[size=sm]:!h-12"
                                  style={{ height: "48px" }}
                                >
                                  <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    <div className="flex flex-col text-left">
                                      <span>{product.name}</span>
                                      <span className="text-muted-foreground text-sm">
                                        ${product.price} • {product.validDays} days • {product.quota} sessions
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="joinDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date (Optional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                    )}
                                  >
                                    {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      field.onChange(format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
                                    } else {
                                      field.onChange(undefined);
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {mode === "edit" && membership && (
                    <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                      <div className="space-y-2">
                        <span className="text-sm font-medium">User</span>
                        <div className="rounded-md border p-2 text-sm">
                          <div>{membership.user.name || "No Name"}</div>
                          <div className="text-muted-foreground">{membership.user.email}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Product</span>
                        <div className="rounded-md border p-2 text-sm">
                          <div>{membership.product.name}</div>
                          <div className="text-muted-foreground">${membership.product.price}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="EXPIRED">Expired</SelectItem>
                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {mode === "edit" && (
                    <FormField
                      control={form.control}
                      name="expiredAt"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Expiration Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    field.onChange(format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
                                  }
                                }}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </form>
              </Form>
            ) : null}
          </div>

          {mode === "view" && membership && (
            <DrawerFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onModeChange("edit");
                }}
                className="w-full"
              >
                Edit Membership
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Membership
              </Button>
            </DrawerFooter>
          )}

          {(mode === "edit" || mode === "add") && (
            <DrawerFooter className="gap-2">
              <Button
                type="submit"
                form="membership-form"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? mode === "add"
                    ? "Creating..."
                    : "Updating..."
                  : mode === "add"
                    ? "Create Membership"
                    : "Update Membership"}
              </Button>
              <DrawerClose asChild>
                <Button type="button" variant="outline">
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
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="text-destructive h-5 w-5" />
              Delete Membership
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the membership for{" "}
              <span className="font-semibold">{membership?.user.name || membership?.user.email}</span>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {membership && (
            <div className="bg-muted/50 my-4 rounded-md border p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">User:</span>
                  <span>{membership.user.name || membership.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Product:</span>
                  <span>{membership.product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="capitalize">{membership.status.toLowerCase()}</span>
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Membership"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
