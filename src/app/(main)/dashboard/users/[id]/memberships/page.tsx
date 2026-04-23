"use client";

import * as React from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { createMembershipHistoryColumns } from "../../_components/membership-history-columns";
import { MemberDetails } from "../../_components/schema";
import {
  formatStatusLabel,
  getBookingStatusIcon,
  getBookingStatusVariant,
  getSessionStatusVariant,
} from "../../_components/tabs/utils";

interface MembershipAttendanceItem {
  id: string;
  status: string;
  participantCount: number;
  createdAt: string;
  classSession: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    item: {
      id: string;
      name: string;
    };
  };
}

interface MembershipAttendanceResponse {
  membership: {
    id: string;
    status: string;
    joinDate: string;
    expiredAt: string;
    product: {
      id: string;
      name: string;
    };
  };
  items: MembershipAttendanceItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function MemberMembershipsPage() {
  const params = useParams();
  const memberId = params.id as string;
  const [selectedMembershipId, setSelectedMembershipId] = React.useState<string | null>(null);
  const [attendancePage, setAttendancePage] = React.useState(1);
  const attendancePageSize = 10;
  const isAttendanceDialogOpen = selectedMembershipId !== null;

  const {
    data: memberDetails,
    isLoading,
    error,
  } = useQuery<MemberDetails>({
    queryKey: ["member-details", memberId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${memberId}/details`);
      if (!response.ok) throw new Error("Failed to fetch member details");
      return response.json();
    },
  });

  const selectedMembership = React.useMemo(() => {
    if (!selectedMembershipId) return null;
    return (memberDetails?.memberships ?? []).find((membership) => membership.id === selectedMembershipId) ?? null;
  }, [memberDetails?.memberships, selectedMembershipId]);

  const attendanceQuery = useQuery<MembershipAttendanceResponse>({
    queryKey: ["membership-attendances", memberId, selectedMembershipId, attendancePage, attendancePageSize],
    queryFn: async () => {
      if (!selectedMembershipId) throw new Error("No membership selected");
      const response = await fetch(
        `/api/users/${memberId}/memberships/${selectedMembershipId}/attendances?page=${attendancePage}&pageSize=${attendancePageSize}`,
      );
      if (!response.ok) throw new Error("Failed to fetch membership attendances");
      return response.json();
    },
    enabled: isAttendanceDialogOpen,
    placeholderData: (previousData) => previousData,
  });

  const columns = React.useMemo(
    () =>
      createMembershipHistoryColumns({
        onViewAttendances: (membership) => {
          setSelectedMembershipId(membership.id);
          setAttendancePage(1);
        },
      }),
    [],
  );

  const table = useDataTableInstance({
    data: memberDetails?.memberships ?? [],
    columns,
    getRowId: (row) => row.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive text-lg font-semibold">Error loading memberships</p>
        <p className="text-muted-foreground mt-2 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Membership History</h1>
            <p className="text-muted-foreground">
              {memberDetails?.name ?? "Member"}&apos;s complete membership history
            </p>
          </div>
        </div>
        <DataTableViewOptions table={table} />
      </div>

      <DataTable table={table} columns={columns} />
      <DataTablePagination table={table} />

      <Dialog
        open={isAttendanceDialogOpen}
        onOpenChange={(isOpen) => {
          if (isOpen) return;
          setSelectedMembershipId(null);
          setAttendancePage(1);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Membership Attendances</DialogTitle>
            <DialogDescription>
              {selectedMembership
                ? `${memberDetails?.name ?? "Member"} — ${selectedMembership.product.name}`
                : "Attendance history for this membership"}
            </DialogDescription>
          </DialogHeader>

          {attendanceQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          ) : attendanceQuery.error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-destructive text-sm font-medium">Failed to load membership attendances</p>
              <p className="text-muted-foreground text-xs">{attendanceQuery.error.message}</p>
            </div>
          ) : (
            <div className="space-y-4 overflow-hidden">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>
                  {attendanceQuery.data?.pagination.total ?? 0} attendance
                  {(attendanceQuery.data?.pagination.total ?? 0) !== 1 ? "s" : ""}
                </span>
                <span>
                  Page {attendanceQuery.data?.pagination.page ?? 1} of{" "}
                  {attendanceQuery.data?.pagination.totalPages ?? 1}
                </span>
              </div>

              <div className="max-h-[55vh] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Session Status</TableHead>
                      <TableHead>Booked At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(attendanceQuery.data?.items ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                          No attendances for this membership yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendanceQuery.data?.items.map((attendance) => (
                        <TableRow key={attendance.id} className="cursor-default">
                          <TableCell className="font-medium">{attendance.classSession.item.name}</TableCell>
                          <TableCell>{format(new Date(attendance.classSession.date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>
                            {attendance.classSession.startTime} - {attendance.classSession.endTime}
                          </TableCell>
                          <TableCell>
                            <StatusBadge variant={getBookingStatusVariant(attendance.status)}>
                              <span className="mr-1">{getBookingStatusIcon(attendance.status)}</span>
                              {formatStatusLabel(attendance.status)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge variant={getSessionStatusVariant(attendance.classSession.status)}>
                              {formatStatusLabel(attendance.classSession.status)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>{format(new Date(attendance.createdAt), "MMM dd, yyyy")}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAttendancePage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={attendancePage <= 1 || attendanceQuery.isFetching}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAttendancePage((currentPage) =>
                      Math.min(attendanceQuery.data?.pagination.totalPages ?? 1, currentPage + 1),
                    )
                  }
                  disabled={
                    attendancePage >= (attendanceQuery.data?.pagination.totalPages ?? 1) || attendanceQuery.isFetching
                  }
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
