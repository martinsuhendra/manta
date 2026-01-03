import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Manta",
  version: packageJson.version,
  copyright: `© ${currentYear}, Manta.`,
  meta: {
    title: "Manta - Modern Next.js Dashboard Starter Template",
    description:
      "Manta is a modern, open-source dashboard starter template built with Next.js 15, Tailwind CSS v4, and shadcn/ui. Perfect for SaaS apps, admin panels, and internal tools—fully customizable and production-ready.",
  },
};
