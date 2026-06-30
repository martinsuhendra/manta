import { Button, Heading, Text } from "@react-email/components";

import { automatedFooterNote, emailBodyStyle, emailHeadingStyle, emailPrimaryButtonStyle } from "./_components/styles";
import { MantaEmailLayout } from "./manta-email-layout";

export interface EmailVerificationEmailProps {
  verificationUrl: string;
}

export function EmailVerificationEmail({ verificationUrl }: EmailVerificationEmailProps) {
  return (
    <MantaEmailLayout preview="Verify your Manta email address" footerNote={automatedFooterNote}>
      <Heading as="h2" style={emailHeadingStyle}>
        Verify Your Email Address
      </Heading>

      <Text style={emailBodyStyle}>
        Welcome to Manta! Please verify your email address to complete your registration.
      </Text>

      <Text style={emailBodyStyle}>Click the button below to verify your email address:</Text>

      <Button href={verificationUrl} style={emailPrimaryButtonStyle}>
        Verify Email Address
      </Button>

      <Text style={emailBodyStyle}>If you did not create an account with us, please ignore this email.</Text>

      <Text style={{ ...emailBodyStyle, margin: 0 }}>
        This verification link will expire in 24 hours for security reasons.
      </Text>
    </MantaEmailLayout>
  );
}

EmailVerificationEmail.PreviewProps = {
  verificationUrl: "https://example.com/verify?token=abc123",
} satisfies EmailVerificationEmailProps;

export default EmailVerificationEmail;
