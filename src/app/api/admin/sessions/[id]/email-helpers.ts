import { emailService } from "@/lib/email/service";
import { createSessionCancelledTemplate, createSessionUpdatedTemplate } from "@/lib/email/templates";

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

interface Booking {
  user: {
    email: string | null;
    name: string | null;
  };
}

export async function sendCancellationEmailsToBookings(bookings: Booking[], sessionInfo: SessionInfo) {
  const emailPromises = bookings
    .filter((booking) => booking.user.email)
    .map((booking) => {
      const emailTemplate = createSessionCancelledTemplate(sessionInfo, booking.user.name || booking.user.email || "");
      return emailService.sendEmail(booking.user.email!, emailTemplate).catch((error) => {
        console.error(`Failed to send cancellation email to ${booking.user.email}:`, error);
      });
    });

  await Promise.all(emailPromises);
}

export async function sendUpdateEmailsToBookings(bookings: Booking[], sessionInfo: SessionInfo, changes: string[]) {
  const emailPromises = bookings
    .filter((booking) => booking.user.email)
    .map((booking) => {
      const emailTemplate = createSessionUpdatedTemplate(
        sessionInfo,
        booking.user.name || booking.user.email || "",
        changes,
      );
      return emailService.sendEmail(booking.user.email!, emailTemplate).catch((error) => {
        console.error(`Failed to send update email to ${booking.user.email}:`, error);
      });
    });

  await Promise.all(emailPromises);
}
