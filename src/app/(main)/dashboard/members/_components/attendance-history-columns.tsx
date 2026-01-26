import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, UserCheck, CheckCircle2, XCircle, ClockIcon } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { StatusBadge } from "@/components/ui/status-badge";

import { MemberDetails } from "./schema";

type Booking = MemberDetails["bookings"][number];

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return "default";
    case "CANCELLED":
    case "NO_SHOW":
      return "destructive";
    case "WAITLISTED":
      return "secondary";
    default:
      return "secondary";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return <CheckCircle2 className="h-4 w-4" />;
    case "CANCELLED":
    case "NO_SHOW":
      return <XCircle className="h-4 w-4" />;
    case "WAITLISTED":
      return <ClockIcon className="h-4 w-4" />;
    default:
      return null;
  }
};

export const createAttendanceHistoryColumns = (): ColumnDef<Booking>[] => [
  {
    accessorKey: "classSession.item.name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <MapPin className="text-muted-foreground h-4 w-4" />
          <span className="font-medium">{row.original.classSession.item.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const icon = getStatusIcon(row.original.status);
      return (
        <StatusBadge variant={getStatusVariant(row.original.status)}>
          {icon && <span className="mr-1">{icon}</span>}
          {row.original.status}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: "classSession.date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="text-muted-foreground h-3 w-3" />
          {format(new Date(row.original.classSession.date), "MMM dd, yyyy")}
        </div>
      );
    },
  },
  {
    accessorKey: "classSession.startTime",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1 text-sm">
          <Clock className="text-muted-foreground h-3 w-3" />
          {row.original.classSession.startTime} - {row.original.classSession.endTime}
        </div>
      );
    },
  },
  {
    accessorKey: "classSession.status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Session Status" />,
    cell: ({ row }) => {
      return (
        <StatusBadge variant={row.original.classSession.status === "COMPLETED" ? "default" : "secondary"}>
          {row.original.classSession.status}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: "membership.product.name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Membership" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <UserCheck className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{row.original.membership.product.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Booked" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="text-muted-foreground h-3 w-3" />
          {format(new Date(row.original.createdAt), "MMM dd, yyyy")}
        </div>
      );
    },
  },
];
