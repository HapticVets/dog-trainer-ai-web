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
    const hasWindow = typeof window !== "undefined";
    const pathname = hasWindow ? window.location.pathname : "";
    const searchParams = hasWindow ? window.location.search : "";
    const hasSignUpMarker =
      hasWindow && new URLSearchParams(searchParams).get("signup") === "complete";
    const isRecentSignUp =
      typeof userCreatedAt === "number" &&
      Date.now() - userCreatedAt >= 0 &&
      Date.now() - userCreatedAt <= MAX_SIGN_UP_CONVERSION_AGE_MS;
    const isSignUpDetectionTrue = hasSignUpMarker && isRecentSignUp;

    console.log("GoogleAdsSignUpConversion mounted");
    console.log("GoogleAdsSignUpConversion pathname:", pathname);
    console.log("GoogleAdsSignUpConversion search params:", searchParams);
    console.log("GoogleAdsSignUpConversion Clerk user id:", userId);
    console.log(
      "GoogleAdsSignUpConversion signup detection:",
      isSignUpDetectionTrue,
      { hasSignUpMarker, isRecentSignUp }
    );
    console.log(
      "GoogleAdsSignUpConversion Google Ads send_to configured:",
      Boolean(GOOGLE_ADS_SIGN_UP_SEND_TO)
    );
    console.log(
      "GoogleAdsSignUpConversion window.gtag exists:",
      hasWindow && typeof window.gtag === "function"
    );

    if (
      !userId ||
      !GOOGLE_ADS_SIGN_UP_SEND_TO ||
      !isRecentSignUp ||
      !hasWindow ||
      !hasSignUpMarker
    ) {
      console.log("GoogleAdsSignUpConversion exited early:", {
        missingUserId: !userId,
        missingSendTo: !GOOGLE_ADS_SIGN_UP_SEND_TO,
        isRecentSignUp,
        hasWindow,
        hasSignUpMarker,
      });
      return;
    }

    const storageKey = conversionStorageKey(userId);

    if (window.localStorage.getItem(storageKey) === "sent") {
      console.log("GoogleAdsSignUpConversion exited early: already tracked");
      return;
    }

    let attempts = 0;
    let timeoutId: number | undefined;

    const fireConversion = () => {
      console.log("GoogleAdsSignUpConversion conversion function called");
      console.log(
        "GoogleAdsSignUpConversion window.gtag exists at conversion:",
        typeof window.gtag === "function"
      );

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
      console.log("GoogleAdsSignUpConversion conversion fired");

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
