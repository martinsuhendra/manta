import { brandColors } from "@/lib/email/base";

export const emailHeadingStyle = {
  margin: "0 0 16px",
  color: brandColors.foreground,
  fontSize: 24,
  fontWeight: 700,
  lineHeight: "32px",
} as const;

export const emailBodyStyle = {
  margin: "0 0 16px",
  fontSize: 16,
  lineHeight: "24px",
} as const;

export const emailPrimaryButtonStyle = {
  backgroundColor: brandColors.primary,
  borderRadius: 8,
  color: "#ffffff",
  display: "inline-block",
  fontSize: 16,
  fontWeight: 600,
  lineHeight: "100%",
  padding: "12px 24px",
  textDecoration: "none",
} as const;

export const automatedFooterNote = "This is an automated email. Please do not reply to this message.";

export const emailSuccessBannerStyle = {
  margin: "16px 0",
  padding: 16,
  backgroundColor: "#f0fdf4",
  border: "1px solid #22c55e",
  borderRadius: 8,
  color: "#15803d",
  fontSize: 16,
  fontWeight: 600,
  lineHeight: "24px",
} as const;
