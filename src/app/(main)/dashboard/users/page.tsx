"use client";

import { RoleGuard } from "@/components/role-guard";
import { useUsers } from "@/hooks/use-users-query";

import { UsersTable } from "./_components/users-table";

export default function Page() {
  const { data: users = [], isLoading, error } = useUsers();

  if (error) throw new Error(error.message);

  return (
    <RoleGuard allowedRoles={["ADMIN", "SUPERADMIN"]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <UsersTable data={users} isLoading={isLoading} />
      </div>
    </RoleGuard>
  );
}
