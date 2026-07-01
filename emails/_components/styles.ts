import { brandColors } from "@/lib/email/base";

export const emailHeadingStyle = {
  margin: "0 0 12px",
  color: brandColors.foreground,
  fontSize: 22,
  fontWeight: 700,
  lineHeight: "28px",
  letterSpacing: "-0.02em",
} as const;

export const emailBodyStyle = {
  margin: "0 0 16px",
  color: brandColors.text,
  fontSize: 15,
  lineHeight: "24px",
} as const;

export const emailPrimaryButtonStyle = {
  backgroundColor: brandColors.primary,
  borderRadius: 8,
  color: "#ffffff",
  display: "inline-block",
  fontSize: 15,
  fontWeight: 600,
  lineHeight: "100%",
  padding: "12px 22px",
  textDecoration: "none",
} as const;

export const emailMutedTextStyle = {
  margin: "16px 0 0",
  color: brandColors.muted,
  fontSize: 13,
  lineHeight: "20px",
} as const;

export const automatedFooterNote = "This is an automated email. Please do not reply to this message.";

export const emailSuccessColors = {
  background: "rgba(239, 95, 24, 0.08)",
  border: "rgba(239, 95, 24, 0.22)",
  foreground: brandColors.foreground,
} as const;

export const emailSuccessBannerStyle = {
  margin: "16px 0 0",
  padding: "12px 14px",
  backgroundColor: emailSuccessColors.background,
  border: `1px solid ${emailSuccessColors.border}`,
  borderRadius: 8,
  color: emailSuccessColors.foreground,
  fontSize: 14,
  fontWeight: 500,
  lineHeight: "20px",
} as const;

export const emailInvoiceContainerStyle = {
  margin: "20px 0 0",
  border: `1px solid ${brandColors.border}`,
  borderTop: `3px solid ${brandColors.primary}`,
  borderRadius: 10,
  overflow: "hidden" as const,
  backgroundColor: brandColors.card,
} as const;

export const emailInvoiceBodyStyle = {
  padding: "22px 24px",
} as const;

export const emailInvoiceLabelStyle = {
  margin: 0,
  color: brandColors.muted,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.1em",
  lineHeight: "14px",
  textTransform: "uppercase" as const,
} as const;

export const emailInvoiceValueStyle = {
  margin: "4px 0 0",
  color: brandColors.foreground,
  fontSize: 14,
  fontWeight: 600,
  lineHeight: "20px",
} as const;

export const emailInvoiceMutedStyle = {
  margin: 0,
  color: brandColors.muted,
  fontSize: 13,
  lineHeight: "20px",
} as const;

export const emailInvoiceDividerStyle = {
  borderColor: brandColors.border,
  margin: "18px 0",
} as const;

export const emailInvoiceTableHeaderStyle = {
  margin: 0,
  color: brandColors.muted,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  lineHeight: "14px",
  textTransform: "uppercase" as const,
} as const;

export const emailInvoiceTotalLabelStyle = {
  margin: 0,
  color: brandColors.foreground,
  fontSize: 14,
  fontWeight: 600,
  lineHeight: "20px",
} as const;

export const emailInvoiceTotalValueStyle = {
  margin: 0,
  color: brandColors.primary,
  fontSize: 20,
  fontWeight: 700,
  lineHeight: "26px",
  textAlign: "right" as const,
} as const;

export const emailPaidBadgeStyle = {
  display: "inline-block",
  margin: 0,
  padding: "4px 10px",
  backgroundColor: emailSuccessColors.background,
  border: `1px solid ${emailSuccessColors.border}`,
  borderRadius: 6,
  color: brandColors.primary,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  lineHeight: "14px",
} as const;
