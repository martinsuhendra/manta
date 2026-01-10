"use client";

import * as React from "react";

import { Plus } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { createUserColumns } from "./columns";
import { RoleFilter } from "./role-filter";
import { User } from "./schema";
import { UserDetailDrawer } from "./user-detail-drawer";
import { UsersSearch } from "./users-search";
import { UsersTableSkeleton } from "./users-table-skeleton";

type DrawerMode = "view" | "edit" | "add" | null;

interface UsersTableProps {
  data: User[];
  isLoading: boolean;
}

export function UsersTable({ data, isLoading }: UsersTableProps) {
  const [selectedRole, setSelectedRole] = React.useState("all");
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [drawerMode, setDrawerMode] = React.useState<DrawerMode>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

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
      onRowClick: (user: User) => {
        setSelectedUser(user);
        setDrawerMode("view");
        setDrawerOpen(true);
      },
      onViewProfile: (user: User) => {
        setSelectedUser(user);
        setDrawerMode("view");
        setDrawerOpen(true);
      },
      onEditUser: (user: User) => {
        setSelectedUser(user);
        setDrawerMode("edit");
        setDrawerOpen(true);
      },
      onDeleteUser: (user: User) => {
        // Open drawer in view mode, then user can click delete button
        setSelectedUser(user);
        setDrawerMode("view");
        setDrawerOpen(true);
      },
    }),
    [],
  );

  const handleAddClick = () => {
    setSelectedUser(null);
    setDrawerMode("add");
    setDrawerOpen(true);
  };

  const columns = React.useMemo(() => createUserColumns(actions), [actions]);

  const table = useDataTableInstance({
    data: filteredData,
    columns,
    getRowId: (row) => row.id,
  });

  // Sync search value with table global filter
  React.useEffect(() => {
    table.setGlobalFilter(searchValue);
  }, [searchValue, table]);

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
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersSearch value={searchValue} onChange={setSearchValue} placeholder="Search by name, email, or phone..." />
          <RoleFilter selectedRole={selectedRole} onRoleChange={setSelectedRole} />
        </div>
        <div className="text-muted-foreground text-sm">{data.length} user(s)</div>
      </div>

      <DataTable table={table} columns={columns} onRowClick={actions.onRowClick} />

      <DataTablePagination table={table} />

      <UserDetailDrawer
        user={selectedUser}
        mode={drawerMode}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onModeChange={setDrawerMode}
      />
    </div>
  );
}
