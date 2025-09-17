"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { User } from "@/app/(main)/dashboard/users/_components/schema";
import { userQueryKeys, fetchUsers, fetchUser, createUser, updateUser, deleteUser } from "@/lib/queries/users";

export function useUsers() {
  return useQuery({
    queryKey: userQueryKeys.lists(),
    queryFn: fetchUsers,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userQueryKeys.detail(id),
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      toast.success("User created successfully");
    },
    onError: (error) => {
      let errorMessage = "Failed to create user";

      if (error instanceof Error) {
        if (error.message.includes("email already exists") || error.message.includes("already exists")) {
          errorMessage = "Email already exists";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => updateUser(id, data),
    onSuccess: (updatedUser, { id }) => {
      queryClient.setQueryData(userQueryKeys.detail(id), updatedUser);
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      toast.success("User updated successfully");
    },
    onError: (error) => {
      let errorMessage = "Failed to update user";

      if (error instanceof Error) {
        if (error.message.includes("email already exists") || error.message.includes("already exists")) {
          errorMessage = "Email already exists";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: userQueryKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      toast.success("User deleted successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    },
  });
}
