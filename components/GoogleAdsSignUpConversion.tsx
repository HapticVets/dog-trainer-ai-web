"use client";

import { useEffect } from "react";
import { GOOGLE_ADS_SIGN_UP_SEND_TO } from "@/lib/googleAds";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type GoogleAdsSignUpConversionProps = {
  userId: string | null | undefined;
  userCreatedAt: number | null | undefined;
};

const conversionStorageKey = (userId: string) => `google-ads-sign-up:${userId}`;
const MAX_SIGN_UP_CONVERSION_AGE_MS = 15 * 60 * 1000;

export default function GoogleAdsSignUpConversion({
  userId,
  userCreatedAt,
}: GoogleAdsSignUpConversionProps) {
  useEffect(() => {
    const isRecentSignUp =
      typeof userCreatedAt === "number" &&
      Date.now() - userCreatedAt >= 0 &&
      Date.now() - userCreatedAt <= MAX_SIGN_UP_CONVERSION_AGE_MS;

    if (
      !userId ||
      !GOOGLE_ADS_SIGN_UP_SEND_TO ||
      !isRecentSignUp ||
      typeof window === "undefined" ||
      new URLSearchParams(window.location.search).get("signup") !== "complete"
    ) {
      return;
    }

    const storageKey = conversionStorageKey(userId);

    if (window.localStorage.getItem(storageKey) === "sent") {
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
        send_to: GOOGLE_ADS_SIGN_UP_SEND_TO,
      });

      window.localStorage.setItem(storageKey, "sent");
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    };

    fireConversion();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [userCreatedAt, userId]);

  return null;
}
