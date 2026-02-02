"use client";

import { RoleGuard } from "@/components/role-guard";
import { useAdminFreezeRequests } from "@/hooks/use-admin-freeze-requests-query";
import { USER_ROLES } from "@/lib/types";

import { FreezeRequestsTable } from "./_components/freeze-requests-table";

export default function AdminFreezeRequestsPage() {
  const { data: freezeRequests = [], isLoading, error } = useAdminFreezeRequests();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <h2 className="text-destructive text-lg font-semibold">Error loading freeze requests</h2>
        <p className="text-muted-foreground text-center">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Freeze Requests</h1>
          <p className="text-muted-foreground">
            Review and approve or reject membership freeze requests from customers.
          </p>
        </div>
        <FreezeRequestsTable data={freezeRequests} isLoading={isLoading} />
      </div>
    </RoleGuard>
  );
}
