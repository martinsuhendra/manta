import { describe, expect, it } from "vitest";

import { createPaymentSuccessTemplate } from "@/lib/email/payment-templates";

describe("createPaymentSuccessTemplate", () => {
  it("renders react-email html with payment details", async () => {
    const template = await createPaymentSuccessTemplate({
      userName: "Alex",
      productName: "Monthly Unlimited",
      accountUrl: "https://example.com/public/my-account",
    });

    expect(template.subject).toBe("Payment Successful - Membership Activated");
    expect(template.html).toContain("Monthly Unlimited");
    expect(template.html).toContain("https://example.com/public/my-account");
    expect(template.html).toContain("Payment Successful");
    expect(template.text).toContain("Alex");
    expect(template.text).toContain("Monthly Unlimited");
  });
});
