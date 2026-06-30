import { createElement } from "react";

import type { EmailTemplate } from "./base";
import { renderMantaEmail } from "./render-manta-email";

export async function createEmailVerificationTemplate(verificationUrl: string): Promise<EmailTemplate> {
  const text = `
Welcome to Manta!

Please verify your email address to complete your registration.

Visit this link: ${verificationUrl}

If you did not create an account with us, please ignore this email.

This verification link will expire in 24 hours for security reasons.
`.trim();

  const { EmailVerificationEmail } = await import("@/emails/email-verification");

  return renderMantaEmail(
    createElement(EmailVerificationEmail, { verificationUrl }),
    "Verify Your Email Address - Manta",
    text,
  );
}

export async function createPasswordResetTemplate(resetUrl: string): Promise<EmailTemplate> {
  const text = `
Password Reset - Manta

We received a request to reset your password.

Visit this link to reset your password: ${resetUrl}

If you did not request this password reset, please ignore this email.

This reset link will expire in 1 hour for security reasons.
`.trim();

  const { PasswordResetEmail } = await import("@/emails/password-reset");

  return renderMantaEmail(createElement(PasswordResetEmail, { resetUrl }), "Password Reset Request - Manta", text);
}

export async function createWelcomeTemplate(name: string, dashboardUrl?: string): Promise<EmailTemplate> {
  const text = `
Welcome to Manta, ${name}!

Your email has been successfully verified. Welcome to the Manta LFT. training community.

Here's what you can do now:
• Book classes and Hyrox sessions
• Track your membership and attendance
• Manage your account from the member portal
• Stay up to date with studio schedules

Visit your dashboard: ${dashboardUrl ?? "your dashboard"}

If you have any questions, don't hesitate to contact our support team.
`.trim();

  const { WelcomeEmail } = await import("@/emails/welcome");

  return renderMantaEmail(createElement(WelcomeEmail, { name, dashboardUrl }), "Welcome to Manta! 🎉", text);
}

export async function createSignupWelcomeTemplate(name: string, shopUrl: string): Promise<EmailTemplate> {
  const text = `
Welcome, ${name}!

Your Manta account is ready. You can browse classes, book sessions, and manage your membership any time.

Open the shop: ${shopUrl}

Thank you for joining us — we look forward to seeing you in the studio.
`.trim();

  const { SignupWelcomeEmail } = await import("@/emails/signup-welcome");

  return renderMantaEmail(
    createElement(SignupWelcomeEmail, { name, shopUrl }),
    "Welcome to Manta — your account is ready",
    text,
  );
}
