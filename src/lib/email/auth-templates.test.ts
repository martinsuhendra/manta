import { describe, expect, it } from "vitest";

import {
  createEmailVerificationTemplate,
  createPasswordResetTemplate,
  createSignupWelcomeTemplate,
  createWelcomeTemplate,
} from "@/lib/email/auth-templates";

describe("auth email templates", () => {
  it("renders email verification template", async () => {
    const template = await createEmailVerificationTemplate("https://example.com/verify?token=abc");

    expect(template.subject).toBe("Verify Your Email Address - Manta");
    expect(template.html).toContain("Verify Your Email Address");
    expect(template.html).toContain("https://example.com/verify?token=abc");
    expect(template.text).toContain("https://example.com/verify?token=abc");
  });

  it("renders password reset template", async () => {
    const template = await createPasswordResetTemplate("https://example.com/reset?token=abc");

    expect(template.subject).toBe("Password Reset Request - Manta");
    expect(template.html).toContain("Password Reset Request");
    expect(template.html).toContain("https://example.com/reset?token=abc");
  });

  it("renders welcome template", async () => {
    const template = await createWelcomeTemplate("Alex", "https://example.com/dashboard/home");

    expect(template.subject).toBe("Welcome to Manta! 🎉");
    expect(template.html).toMatch(/Welcome to Manta,\s*Alex/);
    expect(template.html).toContain("training community");
    expect(template.html).toContain("https://example.com/dashboard/home");
  });

  it("renders signup welcome template", async () => {
    const template = await createSignupWelcomeTemplate("Alex", "https://example.com/public");

    expect(template.subject).toBe("Welcome to Manta — your account is ready");
    expect(template.html).toContain("Welcome,");
    expect(template.html).toContain("Alex");
    expect(template.html).toContain("https://example.com/public");
    expect(template.text).toContain("Open the shop");
  });
});
