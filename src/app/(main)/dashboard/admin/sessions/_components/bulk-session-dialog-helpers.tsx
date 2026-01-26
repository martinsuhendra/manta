"use client";

import { format } from "date-fns";

interface Template {
  id: string;
  name: string;
  mode: "AUTOMATIC" | "MANUAL";
  itemIds: string[];
  manualSessions?: Array<{
    itemId: string;
    teacherId?: string;
    dayOfWeek: number;
    startTime: string;
    notes?: string;
  }>;
}

interface ConvertTemplateSessionsParams {
  template: Template;
  startDate: string;
  endDate: string;
}

export function convertTemplateSessionsToDates({ template, startDate, endDate }: ConvertTemplateSessionsParams): Array<{
  itemId: string;
  teacherId?: string;
  date: string;
  startTime: string;
  notes?: string;
}> {
  if (!template.manualSessions || !startDate || !endDate) {
    return [];
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const convertedSessions: Array<{
    itemId: string;
    teacherId?: string;
    date: string;
    startTime: string;
    notes?: string;
  }> = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const matchingSessions = template.manualSessions.filter((s) => s.dayOfWeek === dayOfWeek);
    for (const session of matchingSessions) {
      convertedSessions.push({
        itemId: session.itemId,
        teacherId: session.teacherId,
        date: format(d, "yyyy-MM-dd"),
        startTime: session.startTime,
        notes: session.notes,
      });
    }
  }

  return convertedSessions;
}
