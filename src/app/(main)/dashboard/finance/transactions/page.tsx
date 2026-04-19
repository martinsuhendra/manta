"use client";

import { RoleGuard } from "@/components/role-guard";
import { USER_ROLES } from "@/lib/types";

import { TransactionsTable } from "./_components/transactions-table";

export default function TransactionsPage() {
  return (
    <RoleGuard allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            Manage purchase transactions, filter by status and date, and create manual transactions from this page.
          </p>
        </div>
        <TransactionsTable />
      </div>
    </RoleGuard>
  );
}
