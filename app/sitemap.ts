import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

const publicRoutes = [
  "/",
  "/about",
  "/method",
  "/puppy-training",
  "/stop-barking",
  "/leash-training",
  "/german-shepherd-training",
  "/train",
  "/sign-in",
  "/sign-up",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
  }));
}
