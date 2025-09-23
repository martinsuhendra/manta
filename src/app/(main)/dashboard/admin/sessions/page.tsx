"use client";

import { RoleGuard } from "@/components/role-guard";
import { USER_ROLES } from "@/lib/types";

import { SessionsView } from "./_components/sessions-view";

export default function AdminSessionsPage() {
  return (
    <RoleGuard allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">
            Manage class sessions with calendar view. Create, update, and cancel sessions, assign teachers, and track
            bookings.
          </p>
        </div>
        <SessionsView />
      </div>
    </RoleGuard>
  );
}
