import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  EllipsisVertical,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  CreditCard,
  CalendarCheck,
  ShoppingCart,
} from "lucide-react";

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
import { USER_ROLE_LABELS, getRoleVariant } from "@/lib/types";

import { DataTableColumnHeader } from "../../../../../components/data-table/data-table-column-header";

import { Member } from "./schema";

// Define the actions interface for the columns
interface MemberActions {
  onRowClick: (member: Member) => void;
  onViewProfile: (member: Member) => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (member: Member) => void;
  onPurchaseMembership?: (member: Member) => void;
}

export const createMemberColumns = (actions: MemberActions): ColumnDef<Member>[] => [
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
      <div
        className="flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => {
      const name = row.original.name ?? "No Name";
      const email = row.original.email;

      return (
        <div className="flex flex-col gap-1">
          <div className="font-medium">{name}</div>
          {email && (
            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3" />
              {email}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const role = row.original.role;

      return (
        <StatusBadge variant={getRoleVariant(role)}>
          {USER_ROLE_LABELS[role as keyof typeof USER_ROLE_LABELS] || role}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: "phoneNo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => {
      const phone = row.original.phoneNo;

      return phone ? (
        <div className="flex items-center gap-1 text-sm">
          <Phone className="h-3 w-3" />
          {phone}
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "_count.memberships",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Memberships" />,
    cell: ({ row }) => {
      const count = row.original._count.memberships;

      return (
        <div className="flex items-center gap-1.5">
          <UserCheck className="text-muted-foreground h-3.5 w-3.5" />
          <StatusBadge variant="secondary">{count}</StatusBadge>
        </div>
      );
    },
  },
  {
    accessorKey: "_count.transactions",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Transactions" />,
    cell: ({ row }) => {
      const count = row.original._count.transactions;

      return (
        <div className="flex items-center gap-1.5">
          <CreditCard className="text-muted-foreground h-3.5 w-3.5" />
          <StatusBadge variant="secondary">{count}</StatusBadge>
        </div>
      );
    },
  },
  {
    accessorKey: "_count.bookings",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Attendance" />,
    cell: ({ row }) => {
      const count = row.original._count.bookings;

      return (
        <div className="flex items-center gap-1.5">
          <CalendarCheck className="text-muted-foreground h-3.5 w-3.5" />
          <StatusBadge variant="secondary">{count}</StatusBadge>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);

      return (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3" />
          {format(date, "MMM dd, yyyy")}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const member = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <EllipsisVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                actions.onViewProfile(member);
              }}
            >
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                actions.onEditMember(member);
              }}
            >
              Edit Member
            </DropdownMenuItem>
            {actions.onPurchaseMembership && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  actions.onPurchaseMembership?.(member);
                }}
              >
                Purchase Membership
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                actions.onDeleteMember(member);
              }}
            >
              Delete Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
