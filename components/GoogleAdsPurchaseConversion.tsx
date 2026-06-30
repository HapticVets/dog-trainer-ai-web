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
    const storedValue = window.localStorage.getItem(storageKey);
    const matchingKeys = Object.keys(window.localStorage).filter((key) =>
      key.startsWith("google-ads-purchase")
    );
    const storedRecord = parseStoredConversionRecord(storedValue);
    const alreadyTracked =
      storedRecord?.status === "sent" &&
      storedRecord.transactionId === transactionId;

    console.log("GoogleAdsPurchaseConversion storageKey:", storageKey);
    console.log("GoogleAdsPurchaseConversion stored value:", storedValue);
    console.log(
      "GoogleAdsPurchaseConversion matching localStorage keys:",
      matchingKeys
    );
    console.log(
      "GoogleAdsPurchaseConversion duplicate key exists:",
      alreadyTracked
    );

    if (alreadyTracked) {
      console.log(
        "GoogleAdsPurchaseConversion exiting early: duplicate conversion already tracked"
      );
      return;
    }

    if (storedValue && !alreadyTracked) {
      console.log(
        "GoogleAdsPurchaseConversion found a malformed or mismatched stored value, ignoring it:",
        {
          storedValue,
          parsedRecord: storedRecord,
          transactionId,
        }
      );
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

      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          status: "sent",
          transactionId,
        } satisfies StoredConversionRecord)
      );
      console.log(
        "GoogleAdsPurchaseConversion stored duplicate-prevention key after firing:",
        storageKey
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
