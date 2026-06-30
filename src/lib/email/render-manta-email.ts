import type { ReactElement } from "react";

import { render } from "@react-email/render";

import type { EmailTemplate } from "./base";

export async function renderMantaEmail(component: ReactElement, subject: string, text: string): Promise<EmailTemplate> {
  const html = await render(component);
  return { subject, html, text };
}
