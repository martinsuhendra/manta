import { format } from "date-fns";

import { escapeHtml } from "../utils";

import { EmailTemplate, baseStyles, emailFooterHtml, emailHeaderHtml, emailInline } from "./base";
import type { SessionInfo } from "./session-templates";

/** Member cancelled their own booking (session still runs). */
export function createMemberBookingCancellationConfirmationTemplate(
  session: SessionInfo,
  participantName: string,
): EmailTemplate {
  const sessionDate = format(new Date(session.date), "EEEE, MMMM d, yyyy");
  const escapedItemName = escapeHtml(session.itemName);
  const escapedParticipantName = escapeHtml(participantName);
  const teacherInfo = session.teacher ? escapeHtml(session.teacher.name || session.teacher.email || "TBA") : "TBA";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        ${emailHeaderHtml()}
        <div class="content">
          <h2>Booking cancelled</h2>
          <p>Hi ${escapedParticipantName},</p>
          <p>This confirms you have cancelled your registration for the following class session:</p>
          <div style="${emailInline.panel}">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="${emailInline.label} width: 140px;">Class:</td>
                <td style="${emailInline.valueStrong}">${escapedItemName}</td>
              </tr>
              <tr>
                <td style="${emailInline.label}">Date:</td>
                <td style="${emailInline.value}">${sessionDate}</td>
              </tr>
              <tr>
                <td style="${emailInline.label}">Time:</td>
                <td style="${emailInline.value}">${session.startTime} - ${session.endTime}</td>
              </tr>
              <tr>
                <td style="${emailInline.label}">Teacher:</td>
                <td style="${emailInline.value}">${teacherInfo}</td>
              </tr>
            </table>
          </div>
          <p style="margin-top: 16px; ${emailInline.muted} font-size: 14px;">If you change your mind, you can book again from the schedule while spots are available.</p>
        </div>
        ${emailFooterHtml("This is an automated email. Please do not reply to this message.")}
      </div>
    </body>
    </html>
  `;

  const text = `
Booking cancelled - Manta

Hi ${participantName},

This confirms you have cancelled your registration for:

Class: ${session.itemName}
Date: ${sessionDate}
Time: ${session.startTime} - ${session.endTime}
Teacher: ${teacherInfo}

You can book again from the schedule while spots are available.

© 2025 Manta. All rights reserved.
This is an automated email. Please do not reply to this message.
  `.trim();

  return {
    subject: `Booking cancelled: ${escapedItemName} on ${sessionDate} - Manta`,
    html,
    text,
  };
}

/** Waitlisted member automatically confirmed when a spot opens (same session). */
export function createSessionPromotedFromWaitlistTemplate(
  session: SessionInfo,
  participantName: string,
): EmailTemplate {
  const sessionDate = format(new Date(session.date), "EEEE, MMMM d, yyyy");
  const escapedItemName = escapeHtml(session.itemName);
  const escapedParticipantName = escapeHtml(participantName);
  const teacherInfo = session.teacher ? escapeHtml(session.teacher.name || session.teacher.email || "TBA") : "TBA";
  const escapedNotes = session.notes ? escapeHtml(session.notes) : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        ${emailHeaderHtml()}
        <div class="content">
          <h2>You're in — off the waitlist!</h2>
          <p>Hi ${escapedParticipantName},</p>
          <p>A spot opened up and you've been <strong>confirmed</strong> for this class (you're no longer on the waitlist):</p>
          <div style="${emailInline.successPanel}">
            <h3 style="${emailInline.h3}">📅 Session details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="${emailInline.label} width: 140px;">Class:</td>
                <td style="${emailInline.valueStrong}">${escapedItemName}</td>
              </tr>
              <tr>
                <td style="${emailInline.label}">Date:</td>
                <td style="${emailInline.value}">${sessionDate}</td>
              </tr>
              <tr>
                <td style="${emailInline.label}">Time:</td>
                <td style="${emailInline.value}">${session.startTime} - ${session.endTime}</td>
              </tr>
              <tr>
                <td style="${emailInline.label}">Teacher:</td>
                <td style="${emailInline.value}">${teacherInfo}</td>
              </tr>
            </table>
            ${escapedNotes ? `<div style="margin-top: 16px;"><p style="${emailInline.notesText}">${escapedNotes}</p></div>` : ""}
          </div>
          <p style="margin-top: 20px;">We look forward to seeing you there.</p>
        </div>
        ${emailFooterHtml("This is an automated email. Please do not reply to this message.")}
      </div>
    </body>
    </html>
  `;

  const text = `
You're confirmed — off the waitlist! - Manta

Hi ${participantName},

A spot opened up and you've been confirmed for this class:

Class: ${session.itemName}
Date: ${sessionDate}
Time: ${session.startTime} - ${session.endTime}
Teacher: ${teacherInfo}
${session.notes ? `Notes: ${session.notes}` : ""}

We look forward to seeing you there.

© 2025 Manta. All rights reserved.
This is an automated email. Please do not reply to this message.
  `.trim();

  return {
    subject: `You're confirmed: ${escapedItemName} on ${sessionDate} (off waitlist) - Manta`,
    html,
    text,
  };
}
