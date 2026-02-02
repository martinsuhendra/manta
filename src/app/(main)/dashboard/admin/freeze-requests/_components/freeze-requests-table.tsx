"use client";

import * as React from "react";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Check, X } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { FreezeRequestWithRelations } from "@/hooks/use-admin-freeze-requests-query";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { FREEZE_REASON_LABELS, FREEZE_REQUEST_STATUS } from "@/lib/constants/freeze";

import { ApproveFreezeDialog } from "./approve-freeze-dialog";
import { FreezeRequestsStatusFilter } from "./freeze-requests-status-filter";
import { RejectFreezeDialog } from "./reject-freeze-dialog";

interface FreezeRequestsTableProps {
  data: FreezeRequestWithRelations[];
  isLoading: boolean;
}

function getStatusVariant(status: string) {
  switch (status) {
    case FREEZE_REQUEST_STATUS.PENDING_APPROVAL:
      return "warning";
    case FREEZE_REQUEST_STATUS.APPROVED:
      return "success";
    case FREEZE_REQUEST_STATUS.REJECTED:
      return "destructive";
    case FREEZE_REQUEST_STATUS.COMPLETED:
      return "secondary";
    default:
      return "outline";
  }
}

export function FreezeRequestsTable({ data, isLoading }: FreezeRequestsTableProps) {
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<FreezeRequestWithRelations | null>(null);

  const filteredData = React.useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((r) => r.status === statusFilter);
  }, [data, statusFilter]);

  const columns: ColumnDef<FreezeRequestWithRelations>[] = [
    {
      accessorKey: "membership.user.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => {
        const m = row.original.membership;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{m.user.name || "N/A"}</span>
            <span className="text-muted-foreground text-sm">{m.user.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "membership.product.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      cell: ({ row }) => row.original.membership.product.name,
    },
    {
      accessorKey: "reason",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Reason" />,
      cell: ({ row }) => {
        const r = row.original;
        const label = FREEZE_REASON_LABELS[r.reason as keyof typeof FREEZE_REASON_LABELS] ?? r.reason;
        return (
          <div className="flex flex-col">
            <span>{label}</span>
            {r.reasonDetails && (
              <span className="text-muted-foreground max-w-[200px] truncate text-sm" title={r.reasonDetails}>
                {r.reasonDetails}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = String(row.getValue("status"));
        const label = status
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return <StatusBadge variant={getStatusVariant(status)}>{label}</StatusBadge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Requested" />,
      cell: ({ row }) => {
        const d = new Date(row.getValue("createdAt"));
        return (
          <div className="flex flex-col">
            <span>{format(d, "MMM dd, yyyy")}</span>
            <span className="text-muted-foreground text-sm">{format(d, "HH:mm")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "freezeEndDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Freeze End" />,
      cell: ({ row }) => {
        const d = row.original.freezeEndDate;
        if (!d) return <span className="text-muted-foreground">—</span>;
        const date = new Date(d);
        return (
          <div className="flex flex-col">
            <span>{format(date, "MMM dd, yyyy")}</span>
            <span className="text-muted-foreground text-sm">{format(date, "HH:mm")}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const req = row.original;
        if (req.status !== FREEZE_REQUEST_STATUS.PENDING_APPROVAL) return null;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              className="h-8"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRequest(req);
                setApproveDialogOpen(true);
              }}
            >
              <Check className="mr-1 h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive h-8"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRequest(req);
                setRejectDialogOpen(true);
              }}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  const tableInstance = useDataTableInstance({
    data: filteredData,
    columns,
    defaultPageSize: 10,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <FreezeRequestsStatusFilter value={statusFilter} onChange={setStatusFilter} />
      </div>

      {isLoading ? (
        <div className="border-input flex h-[200px] items-center justify-center rounded-md border">
          <p className="text-muted-foreground text-sm">Loading freeze requests...</p>
        </div>
      ) : (
        <>
          <DataTable table={tableInstance} columns={columns} />
          <DataTablePagination table={tableInstance} />
        </>
      )}

      <ApproveFreezeDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        freezeRequest={selectedRequest}
      />
      <RejectFreezeDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen} freezeRequest={selectedRequest} />
    </div>
  );
}
