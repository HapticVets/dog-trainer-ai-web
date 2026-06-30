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
    console.log("GoogleAdsPurchaseConversion mounted");
    console.log("GoogleAdsPurchaseConversion transactionId:", transactionId);
    console.log("GoogleAdsPurchaseConversion sendTo:", sendTo);
    console.log("GoogleAdsPurchaseConversion value/currency:", {
      value,
      currency,
    });
    console.log(
      "GoogleAdsPurchaseConversion window.gtag exists:",
      typeof window !== "undefined" && typeof window.gtag === "function"
    );

    if (!transactionId || typeof window === "undefined") {
      console.log(
        "GoogleAdsPurchaseConversion exiting early:",
        !transactionId
          ? "missing transactionId"
          : "window is undefined"
      );
      return;
    }

    const storageKey = conversionStorageKey(transactionId);
    const alreadyTracked = window.localStorage.getItem(storageKey);

    console.log("GoogleAdsPurchaseConversion storageKey:", storageKey);
    console.log(
      "GoogleAdsPurchaseConversion duplicate key exists:",
      Boolean(alreadyTracked)
    );

    if (alreadyTracked) {
      console.log(
        "GoogleAdsPurchaseConversion exiting early: duplicate conversion already tracked"
      );
      return;
    }

    let attempts = 0;
    let timeoutId: number | undefined;

    const fireConversion = () => {
      if (typeof window.gtag !== "function") {
        console.log(
          "GoogleAdsPurchaseConversion waiting for window.gtag",
          { attempt: attempts + 1 }
        );
        attempts += 1;

        if (attempts < 10) {
          timeoutId = window.setTimeout(fireConversion, 300);
        } else {
          console.log(
            "GoogleAdsPurchaseConversion exiting early: window.gtag never became available"
          );
        }

        return;
      }

      console.log("GoogleAdsPurchaseConversion firing conversion", {
        sendTo,
        value,
        currency,
        transactionId,
      });

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
