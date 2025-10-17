"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Clock, Eye, Edit, Trash2, MoreHorizontal, Calendar, Users } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";

import { Item } from "./schema";

interface ItemActions {
  onViewItem: (item: Item) => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (item: Item) => void;
}

export const createItemColumns = (actions: ItemActions): ColumnDef<Item>[] => [
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
      <div className="flex items-center justify-center">
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
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Item Name" />,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div
          className="hover:text-primary flex max-w-[250px] min-w-0 cursor-pointer flex-col gap-1 transition-colors"
          onClick={() => actions.onViewItem(item)}
        >
          <div className="flex min-w-0 items-center gap-2">
            {item.color && (
              <div className="h-3 w-3 flex-shrink-0 rounded-full border" style={{ backgroundColor: item.color }} />
            )}
            <span className="truncate font-medium" title={item.name}>
              {item.name}
            </span>
          </div>
        </div>
      );
    },
    meta: {
      className: "whitespace-normal",
    },
    size: 200,
    minSize: 180,
    maxSize: 220,
  },
  {
    accessorKey: "duration",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
    cell: ({ row }) => {
      const duration = row.original.duration;
      return (
        <div className="flex items-center gap-1 text-sm">
          <Clock className="h-3 w-3" />
          {duration} min
        </div>
      );
    },
  },
  {
    accessorKey: "capacity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Capacity" />,
    cell: ({ row }) => {
      const capacity = row.original.capacity;
      return (
        <div className="flex items-center gap-1 text-sm">
          <Users className="h-3 w-3" />
          {capacity}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return <StatusBadge variant={isActive ? "success" : "secondary"}>{isActive ? "Active" : "Inactive"}</StatusBadge>;
    },
  },
  {
    id: "teachers",
    header: "Teachers",
    cell: ({ row }) => {
      const item = row.original as Item & { _count?: { teacherItems: number } };
      const teacherCount = item._count?.teacherItems || 0;
      return (
        <StatusBadge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          {teacherCount}
        </StatusBadge>
      );
    },
  },
  {
    id: "schedules",
    header: "Schedules",
    cell: ({ row }) => {
      const item = row.original as Item & { _count?: { schedules: number } };
      const scheduleCount = item._count?.schedules || 0;
      return (
        <StatusBadge variant="outline" className="gap-1">
          <Calendar className="h-3 w-3" />
          {scheduleCount}
        </StatusBadge>
      );
    },
  },
  {
    id: "sessions",
    header: "Sessions",
    cell: ({ row }) => {
      const item = row.original as Item & { _count?: { classSessions: number } };
      const sessionCount = item._count?.classSessions || 0;
      return (
        <StatusBadge variant="outline" className="gap-1">
          <Calendar className="h-3 w-3" />
          {sessionCount}
        </StatusBadge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => actions.onViewItem(item)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEditItem(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => actions.onDeleteItem(item)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
