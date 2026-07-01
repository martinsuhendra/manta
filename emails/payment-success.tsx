import { Button, Heading, Text } from "@react-email/components";

import { PaymentInvoice } from "./_components/payment-invoice";
import {
  automatedFooterNote,
  emailBodyStyle,
  emailHeadingStyle,
  emailMutedTextStyle,
  emailPrimaryButtonStyle,
} from "./_components/styles";
import { MantaEmailLayout } from "./manta-email-layout";

export interface PaymentSuccessEmailProps {
  userName?: string;
  productName: string;
  accountUrl: string;
  amount?: number;
  currency?: string;
  transactionId?: string;
  paidAt?: string | Date | null;
  paymentMethod?: string | null;
}

export function PaymentSuccessEmail({
  userName,
  productName,
  accountUrl,
  amount,
  currency,
  transactionId,
  paidAt,
  paymentMethod,
}: PaymentSuccessEmailProps) {
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  return (
    <MantaEmailLayout preview={`Payment receipt — ${productName}`} footerNote={automatedFooterNote}>
      <Heading as="h2" style={emailHeadingStyle}>
        Payment received
      </Heading>

      <Text style={{ ...emailBodyStyle, marginBottom: 20 }}>
        {greeting} Your receipt for <strong>{productName}</strong> is below.
      </Text>

      <PaymentInvoice
        userName={userName}
        productName={productName}
        amount={amount}
        currency={currency}
        transactionId={transactionId}
        paidAt={paidAt}
        paymentMethod={paymentMethod}
      />

      <Button href={accountUrl} style={{ ...emailPrimaryButtonStyle, marginTop: 20 }}>
        View My Account
      </Button>

      <Text style={emailMutedTextStyle}>Questions about this payment? Reply to our support team.</Text>
    </MantaEmailLayout>
  );
}

PaymentSuccessEmail.PreviewProps = {
  userName: "Alex",
  productName: "Monthly Unlimited",
  accountUrl: "https://example.com/public/my-account",
  amount: 1_850_000,
  currency: "IDR",
  transactionId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  paidAt: "2026-07-01T09:12:00.000Z",
  paymentMethod: "bank_transfer",
} satisfies PaymentSuccessEmailProps;

export default PaymentSuccessEmail;
