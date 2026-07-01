import { formatPrice } from "@/lib/utils";

export function formatInvoiceNumber(transactionId: string) {
  return `INV-${transactionId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function formatEmailDate(value?: string | Date | null) {
  const date = value ? new Date(value) : new Date();

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatEmailAmount(amount?: number, currency = "IDR") {
  if (amount == null) return "—";

  if (currency === "IDR") return formatPrice(amount);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPaymentMethod(method?: string | null) {
  if (!method) return "Online payment";

  return method
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
