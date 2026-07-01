import { Body, Container, Head, Html, Img, Preview, Section, Text } from "@react-email/components";

import { APP_CONFIG } from "@/config/app-config";
import { brandColors, emailLayout, getEmailAssetUrl } from "@/lib/email/base";

interface MantaEmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  footerNote?: string;
}

const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function MantaEmailLayout({ preview, children, footerNote }: MantaEmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          backgroundColor: brandColors.background,
          color: brandColors.text,
          fontFamily,
        }}
      >
        <Container style={{ maxWidth: emailLayout.maxWidth, margin: "0 auto", padding: "24px 16px" }}>
          <Section
            style={{
              backgroundColor: brandColors.card,
              borderRadius: "12px 12px 0 0",
              borderBottom: `3px solid ${brandColors.primary}`,
              padding: emailLayout.headerPadding,
              textAlign: "center",
            }}
          >
            <Img
              src={getEmailAssetUrl(emailLayout.logoPath)}
              alt={APP_CONFIG.name}
              width={emailLayout.logoWidth}
              height={emailLayout.logoHeight}
              style={{
                margin: "0 auto",
                display: "block",
                width: emailLayout.logoWidth,
                height: "auto",
                maxWidth: "100%",
              }}
            />
          </Section>

          <Section
            style={{
              backgroundColor: brandColors.card,
              padding: "32px 32px 28px",
            }}
          >
            {children}
          </Section>

          <Section
            style={{
              backgroundColor: brandColors.accent,
              borderRadius: "0 0 12px 12px",
              padding: "20px 32px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                margin: 0,
                color: brandColors.muted,
                fontSize: 13,
                lineHeight: "20px",
              }}
            >
              {APP_CONFIG.copyright}
            </Text>
            {footerNote ? (
              <Text
                style={{
                  margin: "6px 0 0",
                  color: brandColors.muted,
                  fontSize: 12,
                  lineHeight: "18px",
                }}
              >
                {footerNote}
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
