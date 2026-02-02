import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Calendar, Package, CreditCard, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatPrice } from "@/lib/utils";

import { MemberDetails } from "./schema";

type Transaction = MemberDetails["transactions"][number];

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "warning" => {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "FAILED":
    case "CANCELLED":
      return "destructive";
    case "PENDING":
      return "warning";
    case "PROCESSING":
      return "secondary";
    case "REFUNDED":
      return "outline";
    default:
      return "secondary";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className="h-4 w-4" />;
    case "FAILED":
    case "CANCELLED":
      return <XCircle className="h-4 w-4" />;
    case "PENDING":
    case "PROCESSING":
      return <Clock className="h-4 w-4" />;
    case "REFUNDED":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <CreditCard className="h-4 w-4" />;
  }
};

export const createTransactionHistoryColumns = (): ColumnDef<Transaction>[] => [
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
        <StatusBadge variant={getStatusVariant(row.original.status)}>
          <span className="mr-1">{getStatusIcon(row.original.status)}</span>
          {row.original.status}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => {
      return (
        <span className="font-semibold">
          {formatPrice(row.original.amount)} {row.original.currency}
        </span>
      );
    },
  },
  {
    accessorKey: "paymentMethod",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Payment Method" />,
    cell: ({ row }) => {
      return row.original.paymentMethod ? (
        <span className="text-sm">{row.original.paymentMethod}</span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    accessorKey: "paymentProvider",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Provider" />,
    cell: ({ row }) => {
      return row.original.paymentProvider ? (
        <span className="text-sm">{row.original.paymentProvider}</span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="text-muted-foreground h-3 w-3" />
          {format(new Date(row.original.createdAt), "MMM dd, yyyy")}
        </div>
      );
    },
  },
  {
    accessorKey: "paidAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Paid At" />,
    cell: ({ row }) => {
      return row.original.paidAt ? (
        <div className="flex items-center gap-1 text-sm">
          <CheckCircle2 className="text-muted-foreground h-3 w-3" />
          {format(new Date(row.original.paidAt), "MMM dd, yyyy")}
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
];
