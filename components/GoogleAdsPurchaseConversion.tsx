"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type GoogleAdsPurchaseConversionProps = {
  currency: string;
  sendTo: string;
  transactionId: string | null;
  value: number;
};

const conversionStorageKey = (transactionId: string) =>
  `google-ads-purchase:${transactionId}`;

export default function GoogleAdsPurchaseConversion({
  currency,
  sendTo,
  transactionId,
  value,
}: GoogleAdsPurchaseConversionProps) {
  useEffect(() => {
    if (!transactionId || typeof window === "undefined") {
      return;
    }

    const storageKey = conversionStorageKey(transactionId);
    const alreadyTracked = window.localStorage.getItem(storageKey);

    if (alreadyTracked) {
      return;
    }

    let attempts = 0;
    let timeoutId: number | undefined;

    const fireConversion = () => {
      if (typeof window.gtag !== "function") {
        attempts += 1;

        if (attempts < 10) {
          timeoutId = window.setTimeout(fireConversion, 300);
        }

        return;
      }

      window.gtag("event", "conversion", {
        send_to: sendTo,
        value,
        currency,
        transaction_id: transactionId,
      });

      window.localStorage.setItem(storageKey, "sent");
    };

    fireConversion();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [currency, sendTo, transactionId, value]);

  return null;
}
