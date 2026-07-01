import { Button, Heading, Text } from "@react-email/components";

import { brandColors } from "@/lib/email/base";

import { automatedFooterNote, emailBodyStyle, emailHeadingStyle, emailMutedTextStyle } from "./_components/styles";
import { MantaEmailLayout } from "./manta-email-layout";

export interface EmailVerificationEmailProps {
  verificationUrl: string;
}

export function EmailVerificationEmail({ verificationUrl }: EmailVerificationEmailProps) {
  return (
    <MantaEmailLayout preview="Verify your Manta email address" footerNote={automatedFooterNote}>
      <Heading as="h2" style={{ ...emailHeadingStyle, textAlign: "center" }}>
        Verify Your Email
      </Heading>

      <Text style={{ ...emailBodyStyle, textAlign: "center", marginBottom: 28 }}>
        Please click the button below to confirm your email.
      </Text>

      <Button
        href={verificationUrl}
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: brandColors.primary,
          borderRadius: 999,
          color: "#ffffff",
          fontSize: 15,
          fontWeight: 600,
          lineHeight: "100%",
          padding: "16px 24px",
          textAlign: "center",
          textDecoration: "none",
        }}
      >
        Confirm your email
      </Button>

      <Text style={{ ...emailMutedTextStyle, textAlign: "center" }}>
        If you did not request this, no worries — simply ignore this message.
      </Text>

      <Text style={{ ...emailMutedTextStyle, marginTop: 12, fontSize: 12, textAlign: "center" }}>
        This verification link expires in 24 hours.
      </Text>
    </MantaEmailLayout>
  );
}

EmailVerificationEmail.PreviewProps = {
  verificationUrl: "https://example.com/verify?token=abc123",
} satisfies EmailVerificationEmailProps;

export default EmailVerificationEmail;
