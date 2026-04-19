export function formatPaymentMethodLabel(value: string | null | undefined) {
  if (!value) return "-";
  if (value === "ALL") return "All";
  if (value.toLowerCase() === "qris") return "QRIS";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatStatusLabel(value: string | null | undefined) {
  if (!value) return "-";
  if (value === "ALL") return "All";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
