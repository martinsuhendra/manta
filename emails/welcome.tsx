import { Button, Heading, Text } from "@react-email/components";

import { automatedFooterNote, emailBodyStyle, emailHeadingStyle, emailPrimaryButtonStyle } from "./_components/styles";
import { MantaEmailLayout } from "./manta-email-layout";

export interface WelcomeEmailProps {
  name: string;
  dashboardUrl?: string;
}

const welcomeFeatures = [
  "Book classes and Hyrox sessions",
  "Track your membership and attendance",
  "Manage your account from the member portal",
  "Stay up to date with studio schedules",
];

export function WelcomeEmail({ name, dashboardUrl = "#" }: WelcomeEmailProps) {
  return (
    <MantaEmailLayout preview={`Welcome to Manta, ${name}`} footerNote={automatedFooterNote}>
      <Heading as="h2" style={emailHeadingStyle}>
        Welcome to Manta, {name}!
      </Heading>

      <Text style={emailBodyStyle}>
        Your email has been successfully verified. Welcome to the Manta LFT. training community.
      </Text>

      <Text style={emailBodyStyle}>Here&apos;s what you can do now:</Text>

      {welcomeFeatures.map((feature) => (
        <Text key={feature} style={{ ...emailBodyStyle, margin: "0 0 8px" }}>
          • {feature}
        </Text>
      ))}

      <Button href={dashboardUrl} style={{ ...emailPrimaryButtonStyle, marginTop: 16 }}>
        Open Dashboard
      </Button>

      <Text style={{ ...emailBodyStyle, margin: "16px 0 0" }}>
        If you have any questions, don&apos;t hesitate to contact our support team.
      </Text>
    </MantaEmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Alex",
  dashboardUrl: "https://example.com/dashboard/home",
} satisfies WelcomeEmailProps;

export default WelcomeEmail;
