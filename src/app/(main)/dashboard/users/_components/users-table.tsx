"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { AddUserDialog } from "./add-user-dialog";
import { createUserColumns } from "./columns";
import { DeleteUserDialog } from "./delete-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { RoleFilter } from "./role-filter";
import { User } from "./schema";
import { UsersSearch } from "./users-search";
import { UsersTableSkeleton } from "./users-table-skeleton";
import { ViewProfileDialog } from "./view-profile-dialog";

interface UsersTableProps {
  data: User[];
  isLoading: boolean;
}

export function UsersTable({ data, isLoading }: UsersTableProps) {
  const [selectedRole, setSelectedRole] = React.useState("all");
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [viewProfileOpen, setViewProfileOpen] = React.useState(false);
  const [editUserOpen, setEditUserOpen] = React.useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = React.useState(false);

  // Filter data based on selected role
  const filteredData = React.useMemo(() => {
    if (selectedRole === "all") {
      return data;
    }
    return data.filter((user) => user.role === selectedRole);
  }, [data, selectedRole]);

  // Actions for the table columns
  const actions = React.useMemo(
    () => ({
      onViewProfile: (user: User) => {
        setSelectedUser(user);
        setViewProfileOpen(true);
      },
      onEditUser: (user: User) => {
        setSelectedUser(user);
        setEditUserOpen(true);
      },
      onDeleteUser: (user: User) => {
        setSelectedUser(user);
        setDeleteUserOpen(true);
      },
    }),
    [],
  );

  const columns = React.useMemo(() => createUserColumns(actions), [actions]);

  const table = useDataTableInstance({
    data: filteredData,
    columns,
    getRowId: (row) => row.id,
  });

  if (isLoading) return <UsersTableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage your users and their memberships</p>
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <AddUserDialog />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersSearch
            value={table.getState().globalFilter ?? ""}
            onChange={(value) => table.setGlobalFilter(value)}
            placeholder="Search by name, email, or phone..."
          />
          <RoleFilter selectedRole={selectedRole} onRoleChange={setSelectedRole} />
        </div>
        <div className="text-muted-foreground text-sm">
          {table.getFilteredRowModel().rows.length} of {data.length} user(s)
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <DataTable table={table} columns={columns} />
      </div>

      <DataTablePagination table={table} />

      {/* Dialogs */}
      <ViewProfileDialog user={selectedUser} open={viewProfileOpen} onOpenChange={setViewProfileOpen} />
      <EditUserDialog user={selectedUser} open={editUserOpen} onOpenChange={setEditUserOpen} />
      <DeleteUserDialog user={selectedUser} open={deleteUserOpen} onOpenChange={setDeleteUserOpen} />
    </div>
  );
}
