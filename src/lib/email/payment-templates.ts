import { createElement } from "react";

import { baseStyles, brandColors, emailFooterHtml, emailHeaderHtml, emailInline, type EmailTemplate } from "./base";
import { renderMantaEmail } from "./render-manta-email";

export interface PaymentSuccessTemplateParams {
  userName?: string;
  productName: string;
  accountUrl: string;
  amount?: number;
  currency?: string;
  transactionId?: string;
  paidAt?: string | Date | null;
  paymentMethod?: string | null;
}

function buildPaymentSuccessPlainText({
  userName,
  productName,
  accountUrl,
  amount,
  currency = "IDR",
  transactionId,
  paidAt,
  paymentMethod,
}: PaymentSuccessTemplateParams) {
  const greeting = userName ? `Hi ${userName},` : "Hi,";
  const invoiceLine = transactionId ? `Receipt: INV-${transactionId.replace(/-/g, "").slice(0, 8).toUpperCase()}` : "";
  const amountLine =
    amount != null
      ? `Total: ${currency === "IDR" ? `Rp ${amount.toLocaleString("id-ID")}` : `${amount} ${currency}`}`
      : "";
  const dateLine = paidAt ? `Paid on: ${new Date(paidAt).toLocaleDateString("en-US")}` : "";
  const methodLine = paymentMethod ? `Payment method: ${paymentMethod}` : "";

  return `
Payment Successful

${greeting}

Your payment for ${productName} has been successfully processed.

${[invoiceLine, amountLine, dateLine, methodLine].filter(Boolean).join("\n")}

Your membership is now active and ready to use.

View your account: ${accountUrl}

Thank you for your purchase.
`.trim();
}

export async function createPaymentSuccessTemplate(params: PaymentSuccessTemplateParams): Promise<EmailTemplate> {
  const { PaymentSuccessEmail } = await import("@/emails/payment-success");

  return renderMantaEmail(
    createElement(PaymentSuccessEmail, params),
    "Payment Successful - Membership Activated",
    buildPaymentSuccessPlainText(params),
  );
}

export function createPaymentSuccessPasswordResetTemplate(resetUrl: string, customerName?: string): EmailTemplate {
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
          <h2>✅ Payment Successful - Account Activation Required</h2>
          <p>Congratulations${customerName ? `, ${customerName}` : ""}! Thank you for your trust in using Manta services.</p>
          
          <div style="${emailInline.successPanel}">
            <p style="color:${brandColors.foreground};font-weight:600;margin:0;">💰 Your payment has been successfully processed</p>
          </div>
          
          <p>To use Manta services, you need to set up a password for your account first. Please click the button below to create your password:</p>
          
          <a href="${resetUrl}" class="button">Create Account Password</a>
          
          <p><strong>Why do you need to set up a password?</strong></p>
          <ul>
            <li>🔒 Protect your account and data securely</li>
            <li>📱 Easy access to Manta dashboard</li>
            <li>📊 Manage your receipts and financial reports</li>
            <li>⚡ Use AI features for automatic scanning</li>
          </ul>
          
          <p style="${emailInline.warningPanel}">
            <strong>Important:</strong> This link will expire in 24 hours. Please set up your password immediately to start using the service.
          </p>
          
          <p>If you experience any issues or have questions, our customer support team is ready to help you.</p>
        </div>
        ${emailFooterHtml("This is an automated email related to payment and account activation.")}
      </div>
    </body>
    </html>
  `;

  const text = `
    ✅ Payment Successful - Manta Account Activation

    Congratulations${customerName ? `, ${customerName}` : ""}! Thank you for your trust in using Manta services.

    💰 PAYMENT SUCCESSFUL
    Your payment has been successfully processed.

    CREATE ACCOUNT PASSWORD
    To use Manta services, you need to set up a password for your account first.

    Visit this link to create your password: ${resetUrl}

    WHY DO YOU NEED TO SET UP A PASSWORD?
    • Protect your account and data securely
    • Easy access to Manta dashboard
    • Manage your receipts and financial reports
    • Use AI features for automatic scanning

    IMPORTANT: This link will expire in 24 hours. Please set up your password immediately to start using the service.

    If you experience any issues or have questions, our customer support team is ready to help you.

    ---
    © 2025 Manta. All rights reserved.
    This is an automated email related to payment and account activation.
  `;

  return {
    subject: "✅ Payment Successful - Create Your Manta Account Password",
    html,
    text,
  };
}
