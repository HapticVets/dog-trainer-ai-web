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
const isDevelopment = process.env.NODE_ENV !== "production";
const isValidCurrency = (currency: string) => /^[A-Za-z]{3}$/.test(currency.trim());

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
    const normalizedTransactionId = transactionId?.trim() ?? "";
    const normalizedSendTo = sendTo.trim();
    const normalizedCurrency = currency.trim().toUpperCase();
    const hasValidValue = Number.isFinite(value) && value >= 0;
    const hasValidConfiguration =
      normalizedTransactionId.length > 0 &&
      normalizedSendTo.length > 0 &&
      hasValidValue &&
      isValidCurrency(currency);

    if (!hasValidConfiguration || typeof window === "undefined") {
      if (isDevelopment && typeof window !== "undefined") {
        console.warn("Google Ads purchase conversion was not sent.", {
          hasTransactionId: normalizedTransactionId.length > 0,
          hasPurchaseSendTo: normalizedSendTo.length > 0,
          hasValidValue,
          hasValidCurrency: isValidCurrency(currency),
        });
      }

      return;
    }

    const storageKey = conversionStorageKey(normalizedTransactionId);
    const storedValue = window.localStorage.getItem(storageKey);
    const storedRecord = parseStoredConversionRecord(storedValue);
    const alreadyTracked =
      storedRecord?.status === "sent" &&
      storedRecord.transactionId === normalizedTransactionId;

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
        } else if (isDevelopment) {
          console.warn("Google Ads purchase conversion was not sent: gtag is unavailable.");
        }

        return;
      }

      try {
        window.gtag("event", "conversion", {
          send_to: normalizedSendTo,
          value,
          currency: normalizedCurrency,
          transaction_id: normalizedTransactionId,
        });
      } catch (error) {
        console.error("Google Ads purchase conversion could not be issued.", error);
        return;
      }

      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            status: "sent",
            transactionId: normalizedTransactionId,
          } satisfies StoredConversionRecord)
        );
      } catch (error) {
        console.error("Google Ads purchase conversion deduplication could not be stored.", error);
      }
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
