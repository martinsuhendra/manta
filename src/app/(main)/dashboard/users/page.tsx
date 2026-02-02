"use client";

import { RoleGuard } from "@/components/role-guard";
import { useUsers } from "@/hooks/use-users-query";
import { USER_ROLES } from "@/lib/types";

import { MembersTable } from "./_components/members-table";

export default function Page() {
  const { data: users = [], isLoading, error } = useUsers();

  if (error) throw new Error(error.message);

  return (
    <RoleGuard allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <MembersTable data={users} isLoading={isLoading} />
      </div>
    </RoleGuard>
  );
}
