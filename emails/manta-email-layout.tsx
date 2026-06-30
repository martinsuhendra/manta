import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";

import { APP_CONFIG } from "@/config/app-config";
import { brandColors } from "@/lib/email/base";

interface MantaEmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  footerNote?: string;
}

const fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

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
        <Container style={{ maxWidth: 600, margin: "0 auto" }}>
          <Section
            style={{
              background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryDark} 100%)`,
              padding: "32px 24px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {APP_CONFIG.name}
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: brandColors.card,
              padding: "32px 24px",
            }}
          >
            {children}
          </Section>

          <Section
            style={{
              backgroundColor: brandColors.accent,
              padding: "24px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                margin: 0,
                color: brandColors.muted,
                fontSize: 14,
                lineHeight: "20px",
              }}
            >
              {APP_CONFIG.copyright}
            </Text>
            {footerNote ? (
              <Text
                style={{
                  margin: "8px 0 0",
                  color: brandColors.muted,
                  fontSize: 14,
                  lineHeight: "20px",
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
