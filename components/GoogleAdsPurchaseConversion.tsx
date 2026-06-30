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

type StoredConversionRecord = {
  status: "sent";
  transactionId: string;
};

const conversionStorageKey = (transactionId: string) =>
  `google-ads-purchase:${transactionId}`;

const parseStoredConversionRecord = (
  rawValue: string | null
): StoredConversionRecord | null => {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredConversionRecord>;

    if (parsed.status === "sent" && typeof parsed.transactionId === "string") {
      return {
        status: "sent",
        transactionId: parsed.transactionId,
      };
    }
  } catch {
    return null;
  }

  return null;
};

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
    const storedValue = window.localStorage.getItem(storageKey);
    const storedRecord = parseStoredConversionRecord(storedValue);
    const alreadyTracked =
      storedRecord?.status === "sent" &&
      storedRecord.transactionId === transactionId;

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

      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          status: "sent",
          transactionId,
        } satisfies StoredConversionRecord)
      );
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
