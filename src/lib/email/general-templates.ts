import { escapeHtml } from "../utils";

import { EmailTemplate, baseStyles, brandColors, emailFooterHtml, emailHeaderHtml, emailInline } from "./base";

interface UserLinkTemplateParams {
  linkType: "waiver" | "payment";
  linkUrl: string;
  recipientName?: string | null;
}

export function createContactFormTemplate(
  name: string,
  email: string,
  subject: string,
  message: string,
): EmailTemplate {
  // Escape all user inputs to prevent XSS
  const escapedName = escapeHtml(name);
  const escapedEmail = escapeHtml(email);
  const escapedSubject = escapeHtml(subject);
  const escapedMessage = escapeHtml(message);

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
          <h2>📩 New Message from Contact Form</h2>
          
          <div style="${emailInline.panel}">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="${emailInline.label} width: 120px;">Name:</td>
                <td style="${emailInline.value}">${escapedName}</td>
              </tr>
              <tr>
                <td style="${emailInline.label}">Email:</td>
                <td style="${emailInline.value}">${escapedEmail}</td>
              </tr>
              <tr>
                <td style="${emailInline.label}">Subject:</td>
                <td style="${emailInline.value}">${escapedSubject}</td>
              </tr>
            </table>
          </div>
          
          <div style="${emailInline.panel}">
            <h3 style="${emailInline.subheading}">Message:</h3>
            <p style="margin: 0; line-height: 1.6; color: ${brandColors.text}; white-space: pre-wrap;">${escapedMessage}</p>
          </div>
          
          <div style="${emailInline.warningPanel}">
            <p style="${emailInline.warningText}">
              <strong>Note:</strong> This message was sent through the Manta website contact form. 
              Please respond within 1-2 business days as per customer service commitment.
            </p>
          </div>
          
          <p style="margin-top: 24px; font-size: 14px; ${emailInline.muted}">
            Received at: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET
          </p>
        </div>
        ${emailFooterHtml("This email was automatically sent from the contact form system.")}
      </div>
    </body>
    </html>
  `;

  const text = `
    📩 NEW MESSAGE FROM CONTACT FORM - Manta
    
    SENDER INFORMATION:
    Name: ${escapedName}
    Email: ${escapedEmail}
    Subject: ${escapedSubject}
    
    MESSAGE:
    ${escapedMessage}
    
    ---
    Received at: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET
    
    Note: This message was sent through the Manta website contact form. 
    Please respond within 1-2 business days as per customer service commitment.
    
    ---
    © 2025 Manta. All rights reserved.
    This email was automatically sent from the contact form system.
  `;

  return {
    subject: `📩 New Contact Message: ${escapedSubject} - from ${escapedName}`,
    html,
    text,
  };
}

export function createUserLinkTemplate({ linkType, linkUrl, recipientName }: UserLinkTemplateParams): EmailTemplate {
  const escapedLinkUrl = escapeHtml(linkUrl);
  const safeName = escapeHtml(recipientName?.trim() || "there");
  const isWaiver = linkType === "waiver";
  const title = isWaiver ? "Waiver Link" : "Payment Link";
  const description = isWaiver
    ? "Please review and complete your waiver using the button below."
    : "Please complete your payment using the button below.";

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
          <h2>${title}</h2>
          <p>Hi ${safeName},</p>
          <p>${description}</p>
          <a href="${escapedLinkUrl}" class="button">Open ${title}</a>
          <p>If the button doesn&apos;t work, copy and paste this URL into your browser:</p>
          <p><a href="${escapedLinkUrl}" style="color:${brandColors.primary};">${escapedLinkUrl}</a></p>
        </div>
        ${emailFooterHtml("This is an automated email. Please do not reply to this message.")}
      </div>
    </body>
    </html>
  `;

  const text = `
    ${title} - Manta

    Hi ${safeName},

    ${isWaiver ? "Please review and complete your waiver:" : "Please complete your payment:"}
    ${escapedLinkUrl}

    If you have any issue opening the link, please contact support.
  `;

  return {
    subject: `${title} - Manta`,
    html,
    text,
  };
}
