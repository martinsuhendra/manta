"use client";

import * as React from "react";

import { Plus } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { createMemberColumns } from "./columns";
import { MemberDetailDrawer } from "./member-detail-drawer";
import { MembersSearch } from "./members-search";
import { MembersTableSkeleton } from "./members-table-skeleton";
import { RoleFilter } from "./role-filter";
import { Member } from "./schema";

type DrawerMode = "view" | "edit" | "add" | null;

interface MembersTableProps {
  data: Member[];
  isLoading: boolean;
}

export function MembersTable({ data, isLoading }: MembersTableProps) {
  const [selectedRole, setSelectedRole] = React.useState("all");
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
  const [drawerMode, setDrawerMode] = React.useState<DrawerMode>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Filter data based on selected role
  const filteredData = React.useMemo(() => {
    if (selectedRole === "all") {
      return data;
    }
    return data.filter((member) => member.role === selectedRole);
  }, [data, selectedRole]);

  // Actions for the table columns
  const actions = React.useMemo(
    () => ({
      onRowClick: (member: Member) => {
        setSelectedMember(member);
        setDrawerMode("view");
        setDrawerOpen(true);
      },
      onViewProfile: (member: Member) => {
        setSelectedMember(member);
        setDrawerMode("view");
        setDrawerOpen(true);
      },
      onEditMember: (member: Member) => {
        setSelectedMember(member);
        setDrawerMode("edit");
        setDrawerOpen(true);
      },
      onDeleteMember: (member: Member) => {
        setSelectedMember(member);
        setDrawerMode("view");
        setDrawerOpen(true);
      },
    }),
    [],
  );

  const handleAddClick = () => {
    setSelectedMember(null);
    setDrawerMode("add");
    setDrawerOpen(true);
  };

  const columns = React.useMemo(() => createMemberColumns(actions), [actions]);

  const table = useDataTableInstance({
    data: filteredData,
    columns,
    getRowId: (row) => row.id,
  });

  // Sync search value with table global filter
  React.useEffect(() => {
    table.setGlobalFilter(searchValue);
  }, [searchValue, table]);

  if (isLoading) return <MembersTableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Members</h2>
          <p className="text-muted-foreground">Manage members, their memberships, transactions, and attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MembersSearch
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search by name, email, or phone..."
          />
          <RoleFilter selectedRole={selectedRole} onRoleChange={setSelectedRole} />
        </div>
        <div className="text-muted-foreground text-sm">{data.length} member(s)</div>
      </div>

      <DataTable table={table} columns={columns} onRowClick={actions.onRowClick} />

      <DataTablePagination table={table} />

      <MemberDetailDrawer
        member={selectedMember}
        mode={drawerMode}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onModeChange={setDrawerMode}
      />
    </div>
  );
}
