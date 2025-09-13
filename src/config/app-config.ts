import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Studio Pilates",
  version: packageJson.version,
  copyright: `© ${currentYear}, Studio Pilates.`,
  meta: {
    title: "Studio Pilates - Modern Next.js Dashboard Starter Template",
    description:
      "Studio Pilates is a modern, open-source dashboard starter template built with Next.js 15, Tailwind CSS v4, and shadcn/ui. Perfect for SaaS apps, admin panels, and internal tools—fully customizable and production-ready.",
  },
};
