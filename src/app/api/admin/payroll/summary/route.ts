import { NextRequest, NextResponse } from "next/server";

import { handleApiError, requireAdmin } from "@/lib/api-utils";
import { prisma } from "@/lib/generated/prisma";

const MAX_DAYS_RANGE = 365;

/* eslint-disable complexity */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const teacherId = searchParams.get("teacherId") || undefined;
    const itemId = searchParams.get("itemId") || undefined;
    // Payroll only counts COMPLETED sessions; cancelled/scheduled sessions do not earn teacher fees
    const status = "COMPLETED" as const;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const defaultEnd = new Date(today);
    defaultEnd.setMonth(defaultEnd.getMonth() + 1);
    defaultEnd.setDate(0); // last day of current month
    const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const startDate = startDateParam ? new Date(startDateParam) : defaultStart;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEnd;

    if (startDate > endDate) {
      return NextResponse.json({ error: "Start date must be before or equal to end date" }, { status: 400 });
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > MAX_DAYS_RANGE) {
      return NextResponse.json({ error: `Date range cannot exceed ${MAX_DAYS_RANGE} days` }, { status: 400 });
    }

    const sessions = await prisma.classSession.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status,
        teacherId: { not: null },
        ...(teacherId && { teacherId }),
        ...(itemId && { itemId }),
      },
      include: {
        item: { select: { id: true, name: true, price: true } },
        teacher: { select: { id: true, name: true, email: true } },
      },
    });

    const pairKeys = [...new Set(sessions.map((s) => `${s.teacherId}:${s.itemId}`))];
    const teacherItemPairs = pairKeys
      .map((key) => {
        const [tid, iid] = key.split(":");
        return { teacherId: tid ?? "", itemId: iid ?? "" };
      })
      .filter((p) => p.teacherId && p.itemId);

    const teacherItems = await prisma.teacherItem.findMany({
      where: {
        OR: teacherItemPairs.map((p) => ({ teacherId: p.teacherId, itemId: p.itemId })),
      },
      select: { teacherId: true, itemId: true, feeAmount: true },
    });

    const feeAmountMap = new Map<string, number>();
    for (const ti of teacherItems) {
      feeAmountMap.set(`${ti.teacherId}:${ti.itemId}`, ti.feeAmount);
    }

    type ByItem = { itemId: string; itemName: string; sessionsCount: number; feePerSession: number; totalFee: number };
    const teacherMap = new Map<
      string,
      {
        teacherId: string;
        teacherName: string;
        teacherEmail: string | null;
        byItem: Map<string, ByItem>;
        totalFee: number;
      }
    >();

    for (const s of sessions) {
      const tid = s.teacherId!;
      const teacher = s.teacher!;
      const feePerSession = feeAmountMap.get(`${tid}:${s.itemId}`) ?? 0;

      if (!teacherMap.has(tid)) {
        teacherMap.set(tid, {
          teacherId: tid,
          teacherName: teacher.name ?? "—",
          teacherEmail: teacher.email ?? null,
          byItem: new Map(),
          totalFee: 0,
        });
      }
      const row = teacherMap.get(tid)!;
      const itemKey = s.item.id;
      if (!row.byItem.has(itemKey)) {
        row.byItem.set(itemKey, {
          itemId: s.item.id,
          itemName: s.item.name,
          sessionsCount: 0,
          feePerSession,
          totalFee: 0,
        });
      }
      const byItem = row.byItem.get(itemKey)!;
      byItem.sessionsCount += 1;
      byItem.totalFee += feePerSession;
      row.totalFee += feePerSession;
    }

    const rows = Array.from(teacherMap.values()).map((r) => ({
      teacherId: r.teacherId,
      teacherName: r.teacherName,
      teacherEmail: r.teacherEmail,
      sessionsCount: Array.from(r.byItem.values()).reduce((sum, b) => sum + b.sessionsCount, 0),
      byItem: Array.from(r.byItem.values()).map((b) => ({
        ...b,
        feePerSession: Math.round(b.feePerSession * 100) / 100,
        totalFee: Math.round(b.totalFee * 100) / 100,
      })),
      totalFee: Math.round(r.totalFee * 100) / 100,
    }));

    const grandTotalFee = Math.round(rows.reduce((sum, r) => sum + r.totalFee, 0) * 100) / 100;

    return NextResponse.json({
      period: { startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) },
      rows,
      grandTotalFee,
    });
  } catch (err) {
    return handleApiError(err, "Failed to fetch payroll summary");
  }
}
