import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Calendar, Package, CreditCard, ListChecks } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatPrice } from "@/lib/utils";

import { MemberDetails } from "./schema";
import { formatStatusLabel, getMembershipStatusVariant } from "./tabs/utils";

type Membership = MemberDetails["memberships"][number];
interface MembershipHistoryColumnActions {
  onViewAttendances?: (membership: Membership) => void;
}

export const createMembershipHistoryColumns = ({
  onViewAttendances,
}: MembershipHistoryColumnActions = {}): ColumnDef<Membership>[] => [
  {
    accessorKey: "product.name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Package className="text-muted-foreground h-4 w-4" />
          <span className="font-medium">{row.original.product.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      return (
        <StatusBadge variant={getMembershipStatusVariant(row.original.status)}>
          {formatStatusLabel(row.original.status)}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: "product.price",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
    cell: ({ row }) => {
      return <span className="font-medium">{formatPrice(row.original.product.price)}</span>;
    },
  },
  {
    accessorKey: "joinDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Join Date" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="text-muted-foreground h-3 w-3" />
          {format(new Date(row.original.joinDate), "MMM dd, yyyy")}
        </div>
      );
    },
  },
  {
    accessorKey: "expiredAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expires" />,
    cell: ({ row }) => {
      const isExpired = new Date(row.original.expiredAt) < new Date();
      return (
        <div className={`flex items-center gap-1 text-sm ${isExpired ? "text-destructive" : ""}`}>
          <Calendar className="text-muted-foreground h-3 w-3" />
          {format(new Date(row.original.expiredAt), "MMM dd, yyyy")}
        </div>
      );
    },
  },
  {
    accessorKey: "transaction.status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Transaction" />,
    cell: ({ row }) => {
      const transaction = row.original.transaction;
      if (!transaction) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return (
        <div className="flex items-center gap-2">
          <CreditCard className="text-muted-foreground h-3.5 w-3.5" />
          <StatusBadge variant={transaction.status === "COMPLETED" ? "default" : "secondary"}>
            {formatStatusLabel(transaction.status)}
          </StatusBadge>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      if (!onViewAttendances) return null;

      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={(event) => {
            event.stopPropagation();
            onViewAttendances(row.original);
          }}
        >
          <ListChecks className="mr-1.5 h-3.5 w-3.5" />
          Attendances
        </Button>
      );
    },
  },
];
