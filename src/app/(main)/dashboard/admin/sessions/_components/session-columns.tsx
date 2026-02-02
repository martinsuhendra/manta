"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { Clock, User, Users } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-badge";

import { Session, SESSION_STATUS_COLORS } from "./schema";
import { SessionTableRowActions } from "./session-table-row-actions";

interface SessionActions {
  onEditSession: (session: Session) => void;
}

export function createSessionColumns(actions: SessionActions): ColumnDef<Session>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => {
        const session = row.original;
        const dateKey = session.date.includes("T") ? session.date.split("T")[0] : session.date;
        let formattedDate: string;
        try {
          formattedDate = format(parseISO(dateKey), "MMM d, yyyy");
        } catch {
          formattedDate = dateKey;
        }
        return <span className="font-medium">{formattedDate}</span>;
      },
    },
    {
      accessorKey: "startTime",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
      cell: ({ row }) => {
        const session = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Clock className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-sm">
              {session.startTime} - {session.endTime}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "item.name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
      cell: ({ row }) => {
        const session = row.original;
        return (
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: session.item.color || SESSION_STATUS_COLORS[session.status] }}
            />
            <span className="font-medium">{session.item.name}</span>
          </div>
        );
      },
    },
    {
      id: "teacher",
      header: "Teacher",
      cell: ({ row }) => {
        const session = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <User className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-sm">{session.teacher?.name || session.teacher?.email || "Unassigned"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const session = row.original;
        return (
          <StatusBadge
            variant="secondary"
            className="text-xs"
            style={{
              backgroundColor: `${SESSION_STATUS_COLORS[session.status]}20`,
              color: SESSION_STATUS_COLORS[session.status],
              border: `1px solid ${SESSION_STATUS_COLORS[session.status]}40`,
            }}
          >
            {session.status}
          </StatusBadge>
        );
      },
    },
    {
      id: "participants",
      header: "Participants",
      cell: ({ row }) => {
        const session = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Users className="text-muted-foreground h-3.5 w-3.5" />
            <span className="text-sm">
              {session._count?.bookings || 0}/{session.item.capacity}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const session = row.original;
        return <SessionTableRowActions session={session} onEdit={actions.onEditSession} />;
      },
      enableSorting: false,
    },
  ];
}
