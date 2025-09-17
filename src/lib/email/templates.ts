// Re-export all email templates from separate files
export type { EmailTemplate, brandColors, baseStyles } from "./base";

// Auth-related templates
export { createEmailVerificationTemplate, createPasswordResetTemplate, createWelcomeTemplate } from "./auth-templates";

// Payment-related templates
export { createPaymentSuccessPasswordResetTemplate } from "./payment-templates";

// General templates
export { createContactFormTemplate } from "./general-templates";

// Legacy template that might still be in use - simplified version
export function createMultipleActiveMembershipsTemplate(
  customerName?: string,
  activeMembershipsCount: number = 2,
  supportEmail: string = "info@forcerasolution.com",
) {
  return {
    subject: "⚠️ Important Notice: Multiple Active Memberships - Bodhi Studio Pilates",
    html: `<p>Multiple membership notice for ${customerName ?? "customer"} (${activeMembershipsCount} active). Contact: ${supportEmail}</p>`,
    text: `Multiple membership notice for ${customerName ?? "customer"} (${activeMembershipsCount} active). Contact: ${supportEmail}`,
  };
}
