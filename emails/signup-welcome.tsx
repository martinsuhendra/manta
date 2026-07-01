import { Button, Heading, Text } from "@react-email/components";

import {
  automatedFooterNote,
  emailBodyStyle,
  emailHeadingStyle,
  emailMutedTextStyle,
  emailPrimaryButtonStyle,
} from "./_components/styles";
import { MantaEmailLayout } from "./manta-email-layout";

export interface SignupWelcomeEmailProps {
  name: string;
  shopUrl: string;
}

export function SignupWelcomeEmail({ name, shopUrl }: SignupWelcomeEmailProps) {
  return (
    <MantaEmailLayout preview={`Welcome to Manta, ${name}`} footerNote={automatedFooterNote}>
      <Heading as="h2" style={emailHeadingStyle}>
        Welcome, {name}!
      </Heading>

      <Text style={emailBodyStyle}>
        Your Manta account is ready. You can browse classes, book sessions, and manage your membership any time.
      </Text>

      <Button href={shopUrl} style={emailPrimaryButtonStyle}>
        Browse Classes
      </Button>

      <Text style={emailMutedTextStyle}>Thank you for joining us — we look forward to seeing you in the studio.</Text>
    </MantaEmailLayout>
  );
}

SignupWelcomeEmail.PreviewProps = {
  name: "Alex",
  shopUrl: "https://example.com/public",
} satisfies SignupWelcomeEmailProps;

export default SignupWelcomeEmail;
