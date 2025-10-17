"use client";

import { RoleGuard } from "@/components/role-guard";
import { useAdminMemberships } from "@/hooks/use-admin-memberships-query";
import { USER_ROLES } from "@/lib/types";

import { MembershipsTable } from "./_components/memberships-table";

export default function AdminMembershipsPage() {
  const { data: memberships = [], isLoading, error } = useAdminMemberships();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <h2 className="text-destructive text-lg font-semibold">Error loading memberships</h2>
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
    <RoleGuard allowedRoles={[USER_ROLES.SUPERADMIN]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Memberships</h1>
          <p className="text-muted-foreground">Create, view, edit, and delete user memberships across the platform.</p>
        </div>
        <MembershipsTable data={memberships} isLoading={isLoading} />
      </div>
    </RoleGuard>
  );
}
