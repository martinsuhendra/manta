export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export const brandColors = {
  primary: "#C77A3A", // oklch(0.64 0.17 36.44) - Tangerine primary
  primaryLight: "#D48C4D", // Lighter shade of primary
  primaryDark: "#B56B2B", // Darker shade of primary
  background: "#F0EFF0", // oklch(0.94 0 236.5) - Tangerine background
  foreground: "#525252", // oklch(0.32 0 0) - Tangerine foreground
  text: "#525252", // Same as foreground for consistency
  muted: "#8C8C8C", // oklch(0.55 0.02 264.36) - Tangerine muted-foreground
  card: "#FFFFFF", // oklch(1 0 0) - Card background
  border: "#E5E3E5", // oklch(0.9 0.01 247.88) - Border
  accent: "#E8E4EC", // oklch(0.91 0.02 243.82) - Accent
};

export const baseStyles = `
  <style>
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: ${brandColors.background};
      color: ${brandColors.text};
    }
    .header {
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryDark} 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      color: white;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      padding: 32px 24px;
    }
    .button {
      display: inline-block;
      background: ${brandColors.primary};
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background: ${brandColors.primaryDark};
      color: #ffffff !important;
    }
    .footer {
      background-color: ${brandColors.accent};
      padding: 24px;
      text-align: center;
      color: ${brandColors.muted};
      font-size: 14px;
    }
  </style>
`;
