import { z } from "zod";

// Helper function to convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Item Schedule schemas (defined first for reference)
export const itemScheduleSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  dayOfWeek: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ItemSchedule = z.infer<typeof itemScheduleSchema>;

// Teacher Item schemas (defined for reference)
export const teacherItemSchema = z.object({
  id: z.string(),
  teacherId: z.string(),
  itemId: z.string(),
  teacherProfitPercent: z.number().optional().default(60),
  isActive: z.boolean(),
  createdAt: z.string(),
  teacher: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }),
  item: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type TeacherItem = z.infer<typeof teacherItemSchema>;

// Item schemas
export const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  duration: z.number(),
  capacity: z.number(),
  isActive: z.boolean(),
  image: z.string().nullable(),
  color: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  schedules: z.array(itemScheduleSchema).optional(),
  teacherItems: z.array(teacherItemSchema).optional(),
  _count: z
    .object({
      teacherItems: z.number(),
      schedules: z.number(),
      classSessions: z.number(),
    })
    .optional(),
});

export type Item = z.infer<typeof itemSchema>;

export const createItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  isActive: z.boolean().default(true),
  image: z.string().optional(),
  color: z.string().optional(),
  schedules: z
    .array(
      z
        .object({
          dayOfWeek: z.number().min(0).max(6, "Day of week must be 0-6"),
          startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
          endTime: z
            .string()
            .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format")
            .optional(),
          isActive: z.boolean().default(true),
        })
        .refine(
          (data) => {
            if (!data.endTime) return true; // Skip validation if endTime is not provided
            const startMinutes = timeToMinutes(data.startTime);
            const endMinutes = timeToMinutes(data.endTime);
            return endMinutes > startMinutes;
          },
          {
            message: "End time must be after start time",
            path: ["endTime"],
          },
        ),
    )
    .refine(
      (schedules) => {
        // Check for duplicate schedules (same day and time)
        const seen = new Set();
        for (const schedule of schedules) {
          const key = `${schedule.dayOfWeek}-${schedule.startTime}-${schedule.endTime || ""}`;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
        }
        return true;
      },
      {
        message: "Duplicate schedules are not allowed. Please remove duplicate time slots.",
        path: ["schedules"],
      },
    )
    .optional()
    .default([]),
});

export type CreateItemForm = z.infer<typeof createItemSchema>;

export const updateItemSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute").optional(),
  capacity: z.number().min(1, "Capacity must be at least 1").optional(),
  isActive: z.boolean().optional(),
  image: z.string().optional(),
  color: z.string().optional(),
});

export type UpdateItemForm = z.infer<typeof updateItemSchema>;

export const createItemScheduleSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  dayOfWeek: z.number().min(0).max(6, "Day of week must be 0-6"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  isActive: z.boolean().default(true),
});

export type CreateItemScheduleForm = z.infer<typeof createItemScheduleSchema>;

export const createTeacherItemSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
  itemId: z.string().min(1, "Item is required"),
  teacherProfitPercent: z.number().min(0).max(100, "Percentage must be between 0 and 100").default(60),
  isActive: z.boolean().default(true),
});

export type CreateTeacherItemForm = z.infer<typeof createTeacherItemSchema>;

// Class Session schemas
export const classSessionSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  teacherId: z.string().nullable(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  item: z.object({
    id: z.string(),
    name: z.string(),
    duration: z.number(),
    capacity: z.number(),
  }),
  teacher: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
    })
    .nullable(),
});

export type ClassSession = z.infer<typeof classSessionSchema>;

export const createClassSessionSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  teacherId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]).default("SCHEDULED"),
  notes: z.string().optional(),
});

export type CreateClassSessionForm = z.infer<typeof createClassSessionSchema>;

// Booking schemas
export const bookingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  classSessionId: z.string(),
  membershipId: z.string(),
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }),
  classSession: z.object({
    id: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    item: z.object({
      id: z.string(),
      name: z.string(),
    }),
  }),
});

export type Booking = z.infer<typeof bookingSchema>;

export const createBookingSchema = z.object({
  classSessionId: z.string().min(1, "Class session is required"),
  membershipId: z.string().min(1, "Membership is required"),
  notes: z.string().optional(),
});

export type CreateBookingForm = z.infer<typeof createBookingSchema>;

// Day of week labels
export const DAY_OF_WEEK_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// Time slots for scheduling (15-minute intervals for more flexibility)
export const TIME_SLOTS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

// Color options for items
export const ITEM_COLORS = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#EF4444", label: "Red" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Yellow" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#F97316", label: "Orange" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#84CC16", label: "Lime" },
] as const;
