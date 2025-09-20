"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { USER_ROLES } from "@/lib/types";

import { EmptyProductsState } from "./empty-products-state";
import { createMembershipSchema, CreateMembershipForm } from "./schema";
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

export function AddMembershipDialog() {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CreateMembershipForm>({
    resolver: zodResolver(createMembershipSchema),
    defaultValues: {
      status: "ACTIVE",
    },
  });

  // Fetch users (only MEMBER role)
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users", "MEMBER"],
    queryFn: async () => {
      const response = await fetch(`/api/users?role=${USER_ROLES.MEMBER}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

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
      setOpen(false);
      form.reset();
      toast.success("Membership created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: CreateMembershipForm) => {
    createMutation.mutate(data);
  };

  // Check if products are available
  const hasProducts = products.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Membership
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Add New Membership</DialogTitle>
          <DialogDescription>
            Create a new membership for a user. The membership will be automatically configured based on the selected
            product.
          </DialogDescription>
        </DialogHeader>
        {!hasProducts ? (
          <EmptyProductsState />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Membership"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
