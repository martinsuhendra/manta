import { NextRequest, NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { prisma } from "@/lib/generated/prisma";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await prisma.$executeRaw`
      UPDATE class_sessions
      SET status = 'COMPLETED'
      WHERE status = 'SCHEDULED'
        AND (date::timestamp + end_time::time) <= (NOW() AT TIME ZONE 'Asia/Jakarta')
    `;

    return NextResponse.json({
      message: result === 0 ? "No scheduled sessions to complete" : `Marked ${result} session(s) as completed`,
      completedCount: result,
    });
  } catch (error) {
    console.error("Error completing scheduled sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
