"use client";

import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

import { RoleGuard } from "@/components/role-guard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { USER_ROLES } from "@/lib/types";

import { PayrollFilters, getSummaryQueryParams, type PayrollFiltersState } from "./_components/payroll-filters";
import { PayrollSummaryTable } from "./_components/payroll-summary-table";
import { TeacherFeesTable } from "./_components/teacher-fees-table";

export default function PayrollPage() {
  const [filters, setFilters] = useState<PayrollFiltersState>({ period: "this-month" });
  const params = useMemo(() => getSummaryQueryParams(filters), [filters]);

  const { data, isLoading } = useQuery({
    queryKey: ["payroll-summary", params],
    queryFn: async () => {
      const search = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
        status: "COMPLETED",
      });
      if (params.teacherId) search.set("teacherId", params.teacherId);
      if (params.itemId) search.set("itemId", params.itemId);
      const res = await fetch(`/api/admin/payroll/summary?${search}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to load summary");
      }
      return res.json();
    },
  });

  return (
    <RoleGuard allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground text-sm">
            View sessions taught by teacher and total fee to pay (IDR) for the selected period. Only completed sessions
            are counted. Fee per session is the fixed amount (IDR) set in Teacher fees.
          </p>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="fees">Teacher fees</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <PayrollFilters filters={filters} onFiltersChange={setFilters} />
              {data?.period && (
                <span className="text-muted-foreground text-sm">
                  {format(parseISO(data.period.startDate), "dd-MM-yyyy")} –{" "}
                  {format(parseISO(data.period.endDate), "dd-MM-yyyy")}
                </span>
              )}
            </div>
            <PayrollSummaryTable
              rows={data?.rows ?? []}
              grandTotalFee={data?.grandTotalFee ?? 0}
              period={data?.period ?? { startDate: "", endDate: "" }}
              isLoading={isLoading}
            />
          </TabsContent>
          <TabsContent value="fees" className="mt-4">
            <TeacherFeesTable />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
