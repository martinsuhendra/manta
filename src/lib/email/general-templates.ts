import { escapeHtml } from "../utils";

import { EmailTemplate, baseStyles } from "./base";

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
        <div class="header">
          <h1 class="logo">Bodhi Studio Pilates</h1>
        </div>
        <div class="content">
          <h2>📩 New Message from Contact Form</h2>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Name:</td>
                <td style="padding: 8px 0; color: #1f2937;">${escapedName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Email:</td>
                <td style="padding: 8px 0; color: #1f2937;">${escapedEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Subject:</td>
                <td style="padding: 8px 0; color: #1f2937;">${escapedSubject}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">Message:</h3>
            <p style="margin: 0; line-height: 1.6; color: #1f2937; white-space: pre-wrap;">${escapedMessage}</p>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Note:</strong> This message was sent through the Bodhi Studio Pilates website contact form. 
              Please respond within 1-2 business days as per customer service commitment.
            </p>
          </div>
          
          <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
            Received at: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Bodhi Studio Pilates. All rights reserved.</p>
          <p>This email was automatically sent from the contact form system.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    📩 NEW MESSAGE FROM CONTACT FORM - Bodhi Studio Pilates
    
    SENDER INFORMATION:
    Name: ${escapedName}
    Email: ${escapedEmail}
    Subject: ${escapedSubject}
    
    MESSAGE:
    ${escapedMessage}
    
    ---
    Received at: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} ET
    
    Note: This message was sent through the Bodhi Studio Pilates website contact form. 
    Please respond within 1-2 business days as per customer service commitment.
    
    ---
    © 2025 Bodhi Studio Pilates. All rights reserved.
    This email was automatically sent from the contact form system.
  `;

  return {
    subject: `📩 New Contact Message: ${escapedSubject} - from ${escapedName}`,
    html,
    text,
  };
}
