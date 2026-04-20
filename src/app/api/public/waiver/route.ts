import { NextResponse } from "next/server";

import { getWaiverSettings } from "@/lib/waiver-settings";

export async function GET() {
  try {
    const waiver = await getWaiverSettings();
    return NextResponse.json({
      contentHtml: waiver.contentHtml,
      version: waiver.version,
      isActive: waiver.isActive,
    });
  } catch (error) {
    console.error("Failed to fetch public waiver:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
