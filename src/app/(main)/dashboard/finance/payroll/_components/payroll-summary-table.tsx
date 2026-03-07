"use client";

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/utils";

export interface PayrollSummaryRow {
  teacherId: string;
  teacherName: string;
  teacherEmail: string | null;
  sessionsCount: number;
  byItem: Array<{
    itemId: string;
    itemName: string;
    sessionsCount: number;
    feePerSession: number;
    totalFee: number;
  }>;
  totalFee: number;
}

interface PayrollSummaryTableProps {
  rows: PayrollSummaryRow[];
  grandTotalFee: number;
  period: { startDate: string; endDate: string };
  isLoading?: boolean;
}

export function PayrollSummaryTable({ rows, grandTotalFee, period, isLoading }: PayrollSummaryTableProps) {
  if (isLoading) {
    return <div className="text-muted-foreground flex items-center justify-center py-12">Loading summary…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center">
        No completed sessions
        {period.startDate && period.endDate ? ` for ${period.startDate} – ${period.endDate}` : ""}.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Teacher</TableHead>
            <TableHead className="text-right">Sessions</TableHead>
            <TableHead className="text-right">Breakdown by session</TableHead>
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
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-sm">
                  {row.byItem.map((b) => (
                    <span key={b.itemId}>
                      {b.itemName}: {b.sessionsCount}
                    </span>
                  ))}
                </div>
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
