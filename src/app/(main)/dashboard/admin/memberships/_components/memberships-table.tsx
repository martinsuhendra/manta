"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { AddMembershipDialog } from "./add-membership-dialog";
import { createMembershipColumns } from "./columns";
import { DeleteMembershipDialog } from "./delete-membership-dialog";
import { EditMembershipDialog } from "./edit-membership-dialog";
import { MembershipsSearch } from "./memberships-search";
import { MembershipsTableSkeleton } from "./memberships-table-skeleton";
import { Membership } from "./schema";
import { StatusFilter } from "./status-filter";
import { ViewMembershipDialog } from "./view-membership-dialog";

interface MembershipsTableProps {
  data: Membership[];
  isLoading: boolean;
}

export function MembershipsTable({ data, isLoading }: MembershipsTableProps) {
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [selectedMembership, setSelectedMembership] = React.useState<Membership | null>(null);
  const [viewMembershipOpen, setViewMembershipOpen] = React.useState(false);
  const [editMembershipOpen, setEditMembershipOpen] = React.useState(false);
  const [deleteMembershipOpen, setDeleteMembershipOpen] = React.useState(false);

  // Filter data based on selected status
  const filteredData = React.useMemo(() => {
    if (selectedStatus === "all") {
      return data;
    }
    return data.filter((membership) => membership.status === selectedStatus);
  }, [data, selectedStatus]);

  // Actions for the table columns
  const actions = React.useMemo(
    () => ({
      onView: (membership: Membership) => {
        setSelectedMembership(membership);
        setViewMembershipOpen(true);
      },
      onEdit: (membership: Membership) => {
        setSelectedMembership(membership);
        setEditMembershipOpen(true);
      },
      onDelete: (membership: Membership) => {
        setSelectedMembership(membership);
        setDeleteMembershipOpen(true);
      },
    }),
    [],
  );

  const columns = React.useMemo(() => createMembershipColumns(actions), [actions]);

  const tableInstance = useDataTableInstance({
    data: filteredData,
    columns,
    defaultPageSize: 10,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <MembershipsSearch
            value={tableInstance.getState().globalFilter ?? ""}
            onChange={(value) => tableInstance.setGlobalFilter(String(value))}
          />
          <StatusFilter value={selectedStatus} onChange={setSelectedStatus} />
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={tableInstance} />
          <AddMembershipDialog />
        </div>
      </div>

      {isLoading ? <MembershipsTableSkeleton /> : <DataTable table={tableInstance} columns={columns} />}

      <DataTablePagination table={tableInstance} />

      <ViewMembershipDialog
        membership={selectedMembership}
        open={viewMembershipOpen}
        onOpenChange={setViewMembershipOpen}
      />

      <EditMembershipDialog
        membership={selectedMembership}
        open={editMembershipOpen}
        onOpenChange={setEditMembershipOpen}
      />

      <DeleteMembershipDialog
        membership={selectedMembership}
        open={deleteMembershipOpen}
        onOpenChange={setDeleteMembershipOpen}
      />
    </div>
  );
}
