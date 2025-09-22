"use client";

import { RoleGuard } from "@/components/role-guard";
import { USER_ROLES } from "@/lib/types";

import { ItemsTable } from "./_components/items-table";

export default function AdminItemsPage() {
  return (
    <RoleGuard allowedRoles={[USER_ROLES.SUPERADMIN]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground">
            Manage classes and activities that members can book. Configure schedules, assign teachers, and set capacity
            limits.
          </p>
        </div>
        <ItemsTable />
      </div>
    </RoleGuard>
  );
}
