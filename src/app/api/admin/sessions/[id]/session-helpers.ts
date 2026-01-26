import type { Prisma } from "@prisma/client";

interface SessionInfo {
  itemName: string;
  date: string;
  startTime: string;
  endTime: string;
  teacher: {
    name: string | null;
    email: string | null;
  } | null;
  notes: string | null;
}

interface ExistingSession {
  date: Date;
  startTime: string;
  endTime: string;
  itemId: string;
  teacherId: string | null;
  notes: string | null;
  bookings: Array<{
    user: {
      email: string | null;
      name: string | null;
    };
  }>;
}

interface ValidatedData {
  date?: string;
  startTime?: string;
  endTime?: string;
  teacherId?: string | null;
  itemId?: string;
  notes?: string | null;
  status?: "SCHEDULED" | "CANCELLED" | "COMPLETED";
}

interface UpdatedSession {
  item: {
    name: string;
  };
  date: Date;
  startTime: string;
  endTime: string;
  teacher: {
    name: string | null;
    email: string | null;
  } | null;
  notes: string | null;
}

export function buildUpdateData(
  validatedData: ValidatedData,
  existingSession: { item: { duration: number }; itemId: string; date: Date; startTime: string; endTime: string },
  calculateEndTime: (startTime: string, duration: number) => string,
): {
  itemId?: string;
  teacherId?: string | null;
  date?: Date;
  startTime?: string;
  endTime?: string;
  status?: "SCHEDULED" | "CANCELLED" | "COMPLETED";
  notes?: string | null;
} {
  const updateData: {
    itemId?: string;
    teacherId?: string | null;
    date?: Date;
    startTime?: string;
    endTime?: string;
    status?: "SCHEDULED" | "CANCELLED" | "COMPLETED";
    notes?: string | null;
  } = {};

  if (validatedData.itemId) {
    updateData.itemId = validatedData.itemId;
  }

  if (validatedData.teacherId !== undefined) {
    updateData.teacherId = validatedData.teacherId;
  }

  if (validatedData.date) {
    updateData.date = new Date(validatedData.date);
  }

  if (validatedData.startTime) {
    updateData.startTime = validatedData.startTime;
    const itemDuration = existingSession.item.duration;
    updateData.endTime = calculateEndTime(validatedData.startTime, itemDuration);
  }

  if (validatedData.endTime) {
    updateData.endTime = validatedData.endTime;
  }

  if (validatedData.status) {
    updateData.status = validatedData.status;
  }

  if (validatedData.notes !== undefined) {
    updateData.notes = validatedData.notes;
  }

  return updateData;
}

export function detectChanges(
  validatedData: ValidatedData,
  existingSession: ExistingSession,
  updatedSession: UpdatedSession,
): string[] {
  const changes: string[] = [];
  const oldDateStr = existingSession.date.toISOString().split("T")[0];
  const newDateStr = updatedSession.date.toISOString().split("T")[0];

  if (validatedData.date && oldDateStr !== newDateStr) {
    changes.push("Date has been changed");
  }
  if (validatedData.startTime && validatedData.startTime !== existingSession.startTime) {
    changes.push("Start time has been changed");
  }
  if (validatedData.endTime && validatedData.endTime !== existingSession.endTime) {
    changes.push("End time has been changed");
  }
  if (validatedData.teacherId !== undefined && validatedData.teacherId !== existingSession.teacherId) {
    changes.push("Teacher has been changed");
  }
  if (validatedData.itemId && validatedData.itemId !== existingSession.itemId) {
    changes.push("Class has been changed");
  }
  if (validatedData.notes !== undefined && validatedData.notes !== existingSession.notes) {
    changes.push("Notes have been updated");
  }

  return changes;
}

export function buildSessionInfo(updatedSession: UpdatedSession): SessionInfo {
  return {
    itemName: updatedSession.item.name,
    date: updatedSession.date.toISOString(),
    startTime: updatedSession.startTime,
    endTime: updatedSession.endTime,
    teacher: updatedSession.teacher,
    notes: updatedSession.notes,
  };
}
