import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { handleApiError, requireAdmin } from "@/lib/api-utils";

const sessionTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Template name is required"),
  mode: z.enum(["AUTOMATIC", "MANUAL"]),
  itemIds: z.array(z.string()).min(1, "At least one class must be selected"),
  manualSessions: z
    .array(
      z.object({
        itemId: z.string(),
        teacherId: z.string().optional(),
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
});

// Store templates in memory (in production, use database)
// For now, we'll use a simple in-memory store
// In a real app, you'd want to persist this to a database
const templatesStore = new Map<string, z.infer<typeof sessionTemplateSchema> & { id: string; createdAt: string }>();

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const templates = Array.from(templatesStore.values());
    return NextResponse.json(templates);
  } catch (error) {
    return handleApiError(error, "Failed to fetch templates");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const validatedData = sessionTemplateSchema.parse(body);

    const template = {
      id: validatedData.id || `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: validatedData.name,
      mode: validatedData.mode,
      itemIds: validatedData.itemIds,
      manualSessions: validatedData.manualSessions,
      createdAt: new Date().toISOString(),
    };

    templatesStore.set(template.id, template);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create template");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    if (!templatesStore.has(id)) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    templatesStore.delete(id);

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    return handleApiError(error, "Failed to delete template");
  }
}
