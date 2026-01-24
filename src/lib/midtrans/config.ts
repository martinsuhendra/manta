// Midtrans Configuration

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

export const MIDTRANS_CONFIG = {
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
  merchantId: process.env.MIDTRANS_MERCHANT_ID || "",
  isProduction,
  snapApiUrl: isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com",
  coreApiUrl: isProduction ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com",
  snapUrl: isProduction ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js",
} as const;

export const SNAP_API_URL = `${MIDTRANS_CONFIG.snapApiUrl}/snap/v1/transactions`;
export const STATUS_API_URL = `${MIDTRANS_CONFIG.coreApiUrl}/v2`;

// Validate configuration
export function validateMidtransConfig() {
  if (!MIDTRANS_CONFIG.serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured");
  }
  if (!MIDTRANS_CONFIG.clientKey) {
    throw new Error("MIDTRANS_CLIENT_KEY is not configured");
  }
  return true;
}
