"use client";

import { CalendarSearch } from "lucide-react";

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatPrice } from "@/lib/utils";

export interface PayrollSummaryRow {
  teacherId: string;
  teacherName: string;
  teacherEmail: string | null;
  teacherImage?: string | null;
  sessionsCount: number;
  byItem: Array<{
    itemId: string;
    itemName: string;
    sessionsCount: number;
    feeModel: "FLAT_PER_SESSION" | "PER_PARTICIPANT";
    feeAmount: number;
    perParticipantMinGuarantee: number | null;
    perParticipantGuaranteeMaxPax: number | null;
    totalParticipants: number;
    avgFeePerSession: number;
    totalFee: number;
  }>;
  totalFee: number;
}

interface PayrollSummaryTableProps {
  rows: PayrollSummaryRow[];
  grandTotalFee: number;
  isLoading?: boolean;
  embedded?: boolean;
}

function classPayrollLine(b: PayrollSummaryRow["byItem"][number]): string {
  if (b.feeModel === "PER_PARTICIPANT") {
    const floor =
      b.perParticipantMinGuarantee != null && b.perParticipantGuaranteeMaxPax != null
        ? `; floor ${formatPrice(b.perParticipantMinGuarantee)} if ≤${b.perParticipantGuaranteeMaxPax} pax`
        : "";
    return `${b.itemName}: ${b.sessionsCount} session${b.sessionsCount === 1 ? "" : "s"}, ${b.totalParticipants} pax @ ${formatPrice(b.feeAmount)}/pax${floor} → ${formatPrice(b.totalFee)} (avg ${formatPrice(b.avgFeePerSession)}/session)`;
  }
  return `${b.itemName}: ${b.sessionsCount} session${b.sessionsCount === 1 ? "" : "s"} @ ${formatPrice(b.feeAmount)} flat → ${formatPrice(b.totalFee)}`;
}

export function PayrollSummaryTable({ rows, grandTotalFee, isLoading, embedded }: PayrollSummaryTableProps) {
  if (isLoading) {
    return <div className="text-muted-foreground flex items-center justify-center py-12">Loading summary…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="bg-muted/20 rounded-xl border border-dashed px-6 py-12 text-center">
        <div className="bg-background mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border">
          <CalendarSearch className="text-muted-foreground h-4 w-4" />
        </div>
        <p className="text-foreground text-sm font-medium">No completed sessions found</p>
      </div>
    );
  }

  return (
    <div className={cn(!embedded && "rounded-md border", embedded && "overflow-x-auto")}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Teacher</TableHead>
            <TableHead className="text-right">Sessions</TableHead>
            <TableHead>Breakdown by class</TableHead>
            <TableHead className="text-right">Total fee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.teacherId}>
              <TableCell>
                <div>
                  <p className="font-medium">{row.teacherName}</p>
                  {row.teacherEmail && <p className="text-muted-foreground text-xs">{row.teacherEmail}</p>}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.sessionsCount}</TableCell>
              <TableCell>
                <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                  {row.byItem.map((b) => (
                    <li key={b.itemId} className="text-foreground">
                      {classPayrollLine(b)}
                    </li>
                  ))}
                </ul>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatPrice(row.totalFee)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="text-right font-semibold">
              Grand total
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">{formatPrice(grandTotalFee)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
