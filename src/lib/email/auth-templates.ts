import { EmailTemplate, baseStyles } from "./base";

export function createEmailVerificationTemplate(verificationUrl: string): EmailTemplate {
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
          <h2>Verify Your Email Address</h2>
          <p>Welcome to Bodhi Studio Pilates! Please verify your email address to complete your registration.</p>
                    
          <p>Click the button below to verify your email address:</p>
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          
          <p>If you did not create an account with us, please ignore this email.</p>
          
          <p>This verification link will expire in 24 hours for security reasons.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Bodhi Studio Pilates. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Bodhi Studio Pilates!
    
    Please verify your email address to complete your registration.
        
    Visit this link: ${verificationUrl}
    
    If you did not create an account with us, please ignore this email.
    
    This verification link will expire in 24 hours for security reasons.
  `;

  return {
    subject: "Verify Your Email Address - Bodhi Studio Pilates",
    html,
    text,
  };
}

export function createPasswordResetTemplate(resetUrl: string): EmailTemplate {
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
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to set a new password for your account:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          
          <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
          
          <p>This reset link will expire in 1 hour for security reasons.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Bodhi Studio Pilates. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Reset - Bodhi Studio Pilates
    
    We received a request to reset your password.
    
    Visit this link to reset your password: ${resetUrl}
    
    If you did not request this password reset, please ignore this email.
    
    This reset link will expire in 1 hour for security reasons.
  `;

  return {
    subject: "Password Reset Request - Bodhi Studio Pilates",
    html,
    text,
  };
}

export function createWelcomeTemplate(name: string, dashboardUrl?: string): EmailTemplate {
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
          <h2>Welcome to Bodhi Studio Pilates, ${name}!</h2>
          <p>Your email has been successfully verified. Welcome to the future of receipt scanning and expense management!</p>
          
          <p>Here's what you can do now:</p>
          <ul>
            <li>📸 Scan receipts with AI-powered recognition</li>
            <li>📊 Export your data to CSV or Excel</li>
            <li>💼 Manage your expenses efficiently</li>
            <li>🔍 Advanced search and filtering</li>
          </ul>
          
          <a href="${dashboardUrl ?? "#"}" class="button">Open Dashboard</a>
          
          <p>If you have any questions, don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Bodhi Studio Pilates. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Bodhi Studio Pilates, ${name}!
    
    Your email has been successfully verified. Welcome to the future of receipt scanning and expense management!
    
    Here's what you can do now:
    • Scan receipts with AI-powered recognition
    • Export your data to CSV or Excel
    • Manage your expenses efficiently
    • Advanced search and filtering
    
    Visit your dashboard: ${dashboardUrl ?? "your dashboard"}
    
    If you have any questions, don't hesitate to contact our support team.
  `;

  return {
    subject: "Welcome to Bodhi Studio Pilates! 🎉",
    html,
    text,
  };
}
