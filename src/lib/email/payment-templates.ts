import { EmailTemplate, baseStyles } from "./base";

export interface PaymentSuccessTemplateParams {
  userName?: string;
  productName: string;
  accountUrl: string;
}

export function createPaymentSuccessTemplate(params: PaymentSuccessTemplateParams): EmailTemplate {
  const { userName, productName, accountUrl } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Manta</h1>
        </div>
        <div class="content">
          <h2>✅ Payment Successful!</h2>
          <p>Hi${userName ? ` ${userName}` : ""},</p>
          
          <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="color: #15803d; font-weight: 600; margin: 0;">Your payment for <strong>${productName}</strong> has been successfully processed</p>
          </div>
          
          <p>Your membership is now active and ready to use!</p>
          
          <a href="${accountUrl}" class="button">View My Account</a>
          
          <p>Thank you for your purchase. If you have any questions, please don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Manta. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ✅ Payment Successful!
    
    Hi${userName ? ` ${userName}` : ""},
    
    Your payment for ${productName} has been successfully processed.
    
    Your membership is now active and ready to use!
    
    View your account: ${accountUrl}
    
    Thank you for your purchase.
    
    ---
    © 2025 Manta. All rights reserved.
  `;

  return {
    subject: "Payment Successful - Membership Activated",
    html,
    text,
  };
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
        <div class="header">
          <h1 class="logo">Manta</h1>
        </div>
        <div class="content">
          <h2>✅ Payment Successful - Account Activation Required</h2>
          <p>Congratulations${customerName ? `, ${customerName}` : ""}! Thank you for your trust in using Manta services.</p>
          
          <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="color: #15803d; font-weight: 600; margin: 0;">💰 Your payment has been successfully processed</p>
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
          
          <p style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0;">
            <strong>Important:</strong> This link will expire in 24 hours. Please set up your password immediately to start using the service.
          </p>
          
          <p>If you experience any issues or have questions, our customer support team is ready to help you.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Manta. All rights reserved.</p>
          <p>This is an automated email related to payment and account activation.</p>
        </div>
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
