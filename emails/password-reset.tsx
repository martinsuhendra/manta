import { Button, Heading, Text } from "@react-email/components";

import {
  automatedFooterNote,
  emailBodyStyle,
  emailHeadingStyle,
  emailMutedTextStyle,
  emailPrimaryButtonStyle,
} from "./_components/styles";
import { MantaEmailLayout } from "./manta-email-layout";

export interface PasswordResetEmailProps {
  resetUrl: string;
}

export function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  return (
    <MantaEmailLayout preview="Reset your Manta password" footerNote={automatedFooterNote}>
      <Heading as="h2" style={emailHeadingStyle}>
        Password Reset Request
      </Heading>

      <Text style={emailBodyStyle}>
        We received a request to reset your password. Click the button below to set a new password for your account:
      </Text>

      <Button href={resetUrl} style={emailPrimaryButtonStyle}>
        Reset Password
      </Button>

      <Text style={emailBodyStyle}>
        If you did not request this password reset, please ignore this email. Your password will remain unchanged.
      </Text>

      <Text style={emailMutedTextStyle}>This reset link will expire in 1 hour for security reasons.</Text>
    </MantaEmailLayout>
  );
}

PasswordResetEmail.PreviewProps = {
  resetUrl: "https://example.com/reset-password?token=abc123",
} satisfies PasswordResetEmailProps;

export default PasswordResetEmail;
