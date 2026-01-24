"use client";

import { useEffect, useState } from "react";

const MIDTRANS_SCRIPT_ID = "midtrans-snap-script";
const SNAP_URL =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

interface UseSnapOptions {
  onSuccess?: (result: SnapPaymentResult) => void;
  onPending?: (result: SnapPaymentResult) => void;
  onError?: (result: SnapPaymentResult) => void;
  onClose?: () => void;
}

interface SnapPaymentResult {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
}

export function useMidtransSnap() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if script already exists
    if (document.getElementById(MIDTRANS_SCRIPT_ID)) {
      setIsLoaded(true);
      return;
    }

    // Check if snap is already available
    if (window.snap) {
      setIsLoaded(true);
      return;
    }

    // Load script
    const script = document.createElement("script");
    script.id = MIDTRANS_SCRIPT_ID;
    script.src = SNAP_URL;
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "");

    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      console.error("Failed to load Midtrans Snap.js");
      setIsLoading(false);
    };

    setIsLoading(true);
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.getElementById(MIDTRANS_SCRIPT_ID);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const openSnap = (snapToken: string, options?: UseSnapOptions) => {
    if (!isLoaded || !window.snap) {
      console.error("Snap.js is not loaded yet");
      return;
    }

    window.snap.pay(snapToken, {
      onSuccess: (result) => {
        console.log("Payment success:", result);
        options?.onSuccess?.(result);
      },
      onPending: (result) => {
        console.log("Payment pending:", result);
        options?.onPending?.(result);
      },
      onError: (result) => {
        console.error("Payment error:", result);
        options?.onError?.(result);
      },
      onClose: () => {
        console.log("Payment popup closed");
        options?.onClose?.();
      },
    });
  };

  return {
    isLoaded,
    isLoading,
    openSnap,
  };
}
