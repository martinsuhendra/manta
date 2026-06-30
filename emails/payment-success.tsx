import { Button, Heading, Text } from "@react-email/components";

import {
  automatedFooterNote,
  emailBodyStyle,
  emailHeadingStyle,
  emailPrimaryButtonStyle,
  emailSuccessBannerStyle,
} from "./_components/styles";
import { MantaEmailLayout } from "./manta-email-layout";

export interface PaymentSuccessEmailProps {
  userName?: string;
  productName: string;
  accountUrl: string;
}

export function PaymentSuccessEmail({ userName, productName, accountUrl }: PaymentSuccessEmailProps) {
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  return (
    <MantaEmailLayout preview={`Payment successful — ${productName}`} footerNote={automatedFooterNote}>
      <Heading as="h2" style={emailHeadingStyle}>
        Payment Successful
      </Heading>

      <Text style={emailBodyStyle}>{greeting}</Text>

      <SectionSuccessBanner productName={productName} />

      <Text style={{ ...emailBodyStyle, margin: "16px 0" }}>Your membership is now active and ready to use.</Text>

      <Button href={accountUrl} style={emailPrimaryButtonStyle}>
        View My Account
      </Button>

      <Text style={{ ...emailBodyStyle, margin: "16px 0 0" }}>
        Thank you for your purchase. If you have any questions, contact our support team.
      </Text>
    </MantaEmailLayout>
  );
}

function SectionSuccessBanner({ productName }: { productName: string }) {
  return (
    <Text style={emailSuccessBannerStyle}>
      Your payment for <span style={{ fontWeight: 700 }}>{productName}</span> has been successfully processed.
    </Text>
  );
}

PaymentSuccessEmail.PreviewProps = {
  userName: "Alex",
  productName: "Monthly Unlimited",
  accountUrl: "https://example.com/public/my-account",
} satisfies PaymentSuccessEmailProps;

export default PaymentSuccessEmail;
