const DEFAULT_APP_URL = "https://app.patriotk9kennel.com";

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
const socialShareImagePath = "/images/branding/patriot-k9-command-social-share.png";

export const siteConfig = {
  siteName: "Patriot K9 AI Trainer",
  brandName: "Patriot K9 Kennel",
  appUrl: normalizeUrl(configuredAppUrl || DEFAULT_APP_URL),
  oldAppUrl: "https://train.hapticvets.com",
  socialShareImagePath,
} as const;

export const authRoutes = {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  postSignInUrl: "/train",
  postSignUpUrl: "/train?signup=complete",
} as const;

export const absoluteUrl = (path = "/") => new URL(path, `${siteConfig.appUrl}/`).toString();
export const socialShareImageUrl = absoluteUrl(siteConfig.socialShareImagePath);
