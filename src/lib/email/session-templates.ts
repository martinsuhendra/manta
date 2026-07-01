import { format } from "date-fns";

import { escapeHtml } from "../utils";

import { EmailTemplate, baseStyles, brandColors, emailFooterHtml, emailHeaderHtml, emailInline } from "./base";

export interface SessionInfo {
  itemName: string;
  date: string;
  startTime: string;
  endTime: string;
  teacher?: {
    name: string | null;
    email: string | null;
  } | null;
  notes?: string | null;
}

export function createSessionJoinedTemplate(session: SessionInfo, participantName: string): EmailTemplate {
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
          <h2>✅ You're Registered for a Class!</h2>
          <p>Hi ${escapedParticipantName},</p>
          <p>Great news! You've been successfully registered for the following class session:</p>
          
          <div style="${emailInline.successPanel}">
            <h3 style="${emailInline.h3}">📅 Session Details</h3>
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
            ${escapedNotes ? `<div style="${emailInline.notesDivider}"><p style="${emailInline.notesText}">${escapedNotes}</p></div>` : ""}
          </div>
          
          <p style="margin-top: 24px;">We look forward to seeing you there! Please arrive a few minutes early.</p>
          
          <div style="${emailInline.warningPanel}">
            <p style="${emailInline.warningText}">
              <strong>Reminder:</strong> If you need to cancel or make changes, please contact us as soon as possible.
            </p>
          </div>
        </div>
        ${emailFooterHtml("This is an automated email. Please do not reply to this message.")}
      </div>
    </body>
    </html>
  `;

  const text = `
    ✅ YOU'RE REGISTERED FOR A CLASS! - Manta
    
    Hi ${escapedParticipantName},
    
    Great news! You've been successfully registered for the following class session:
    
    📅 SESSION DETAILS:
    Class: ${escapedItemName}
    Date: ${sessionDate}
    Time: ${session.startTime} - ${session.endTime}
    Teacher: ${teacherInfo}
    ${escapedNotes ? `Notes: ${escapedNotes}` : ""}
    
    We look forward to seeing you there! Please arrive a few minutes early.
    
    Reminder: If you need to cancel or make changes, please contact us as soon as possible.
    
    ---
    © 2025 Manta. All rights reserved.
    This is an automated email. Please do not reply to this message.
  `;

  return {
    subject: `✅ You're Registered: ${escapedItemName} on ${sessionDate} - Manta`,
    html,
    text,
  };
}

export function createSessionUpdatedTemplate(
  session: SessionInfo,
  participantName: string,
  changes: string[],
): EmailTemplate {
  const sessionDate = format(new Date(session.date), "EEEE, MMMM d, yyyy");
  const escapedItemName = escapeHtml(session.itemName);
  const escapedParticipantName = escapeHtml(participantName);
  const teacherInfo = session.teacher ? escapeHtml(session.teacher.name || session.teacher.email || "TBA") : "TBA";
  const escapedNotes = session.notes ? escapeHtml(session.notes) : null;
  const changesList = changes.map((change) => escapeHtml(change)).join("</li><li>");

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
          <h2>📝 Session Update</h2>
          <p>Hi ${escapedParticipantName},</p>
          <p>We wanted to inform you that there have been updates to a class session you're registered for:</p>
          
          <div style="${emailInline.warningPanel}">
            <h3 style="${emailInline.subheading}">⚠️ Changes Made:</h3>
            <ul style="margin: 0; padding-left: 20px; color: ${brandColors.text};">
              <li>${changesList}</li>
            </ul>
          </div>
          
          <div style="${emailInline.successPanel}">
            <h3 style="${emailInline.h3}">📅 Updated Session Details</h3>
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
            ${escapedNotes ? `<div style="${emailInline.notesDivider}"><p style="${emailInline.notesText}">${escapedNotes}</p></div>` : ""}
          </div>
          
          <p style="margin-top: 24px;">Please make note of these changes. We apologize for any inconvenience.</p>
        </div>
        ${emailFooterHtml("This is an automated email. Please do not reply to this message.")}
      </div>
    </body>
    </html>
  `;

  const text = `
    📝 SESSION UPDATE - Manta
    
    Hi ${escapedParticipantName},
    
    We wanted to inform you that there have been updates to a class session you're registered for:
    
    ⚠️ CHANGES MADE:
    ${changes.map((change) => `- ${change}`).join("\n")}
    
    📅 UPDATED SESSION DETAILS:
    Class: ${escapedItemName}
    Date: ${sessionDate}
    Time: ${session.startTime} - ${session.endTime}
    Teacher: ${teacherInfo}
    ${escapedNotes ? `Notes: ${escapedNotes}` : ""}
    
    Please make note of these changes. We apologize for any inconvenience.
    
    ---
    © 2025 Manta. All rights reserved.
    This is an automated email. Please do not reply to this message.
  `;

  return {
    subject: `📝 Session Update: ${escapedItemName} on ${sessionDate} - Manta`,
    html,
    text,
  };
}

export function createSessionWaitlistedTemplate(session: SessionInfo, participantName: string): EmailTemplate {
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
          <h2>⏳ You're on the Waitlist</h2>
          <p>Hi ${escapedParticipantName},</p>
          <p>Thank you for your interest! The class session you requested is currently at full capacity, so we've added you to the waitlist.</p>
          
          <div style="${emailInline.panel}">
            <h3 style="${emailInline.h3}">📅 Session Details</h3>
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
          
          <div style="${emailInline.infoPanel}">
            <p style="${emailInline.infoText}">
              <strong>What happens next?</strong> If a spot becomes available, you'll automatically be confirmed and receive an email notification. We'll notify you as soon as possible!
            </p>
          </div>
        </div>
        ${emailFooterHtml("This is an automated email. Please do not reply to this message.")}
      </div>
    </body>
    </html>
  `;

  const text = `
    ⏳ YOU'RE ON THE WAITLIST - Manta
    
    Hi ${escapedParticipantName},
    
    Thank you for your interest! The class session you requested is currently at full capacity, so we've added you to the waitlist.
    
    📅 SESSION DETAILS:
    Class: ${escapedItemName}
    Date: ${sessionDate}
    Time: ${session.startTime} - ${session.endTime}
    Teacher: ${teacherInfo}
    
    What happens next? If a spot becomes available, you'll automatically be confirmed and receive an email notification. We'll notify you as soon as possible!
    
    ---
    © 2025 Manta. All rights reserved.
    This is an automated email. Please do not reply to this message.
  `;

  return {
    subject: `⏳ Waitlisted: ${escapedItemName} on ${sessionDate} - Manta`,
    html,
    text,
  };
}

export function createSessionCancelledTemplate(session: SessionInfo, participantName: string): EmailTemplate {
  const sessionDate = format(new Date(session.date), "EEEE, MMMM d, yyyy");
  const escapedItemName = escapeHtml(session.itemName);
  const escapedParticipantName = escapeHtml(participantName);

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
          <h2>❌ Session Cancelled</h2>
          <p>Hi ${escapedParticipantName},</p>
          <p>We're sorry to inform you that the following class session has been cancelled:</p>
          
          <div style="${emailInline.destructivePanel}">
            <h3 style="${emailInline.destructiveHeading}">📅 Cancelled Session</h3>
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
            </table>
          </div>
          
          <p style="margin-top: 24px;">We sincerely apologize for any inconvenience this may cause. If you have any questions or concerns, please don't hesitate to contact us.</p>
          
          <div style="${emailInline.infoPanel}">
            <p style="${emailInline.infoText}">
              <strong>Next Steps:</strong> Your booking has been automatically cancelled. If you have any questions about alternative sessions or refunds, please contact our support team.
            </p>
          </div>
        </div>
        ${emailFooterHtml("This is an automated email. Please do not reply to this message.")}
      </div>
    </body>
    </html>
  `;

  const text = `
    ❌ SESSION CANCELLED - Manta
    
    Hi ${escapedParticipantName},
    
    We're sorry to inform you that the following class session has been cancelled:
    
    📅 CANCELLED SESSION:
    Class: ${escapedItemName}
    Date: ${sessionDate}
    Time: ${session.startTime} - ${session.endTime}
    
    We sincerely apologize for any inconvenience this may cause. If you have any questions or concerns, please don't hesitate to contact us.
    
    Next Steps: Your booking has been automatically cancelled. If you have any questions about alternative sessions or refunds, please contact our support team.
    
    ---
    © 2025 Manta. All rights reserved.
    This is an automated email. Please do not reply to this message.
  `;

  return {
    subject: `❌ Session Cancelled: ${escapedItemName} on ${sessionDate} - Manta`,
    html,
    text,
  };
}

export {
  createMemberBookingCancellationConfirmationTemplate,
  createSessionPromotedFromWaitlistTemplate,
} from "./session-templates-followup";
