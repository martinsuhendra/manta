"use client";

import { RoleGuard } from "@/components/role-guard";
import { useAdminMemberships } from "@/hooks/use-admin-memberships-query";
import { USER_ROLES } from "@/lib/types";

import { MembershipsTable } from "./_components/memberships-table";

export default function AdminMembershipsPage() {
  const { data: memberships = [], isLoading, error } = useAdminMemberships();

  if (error) throw new Error(error.message);

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
