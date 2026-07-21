"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

const workspaceNavItems = [
  { href: "/", label: "Home" },
  { href: "/method", label: "Method" },
  { href: "/about", label: "About" },
  { href: "/train", label: "Trainer" },
  { href: "/dashboard", label: "Dashboard" },
];

const marketingNavItems = [
  { href: "/", label: "Home" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/training-options", label: "Training Options" },
  { href: "/#pricing", label: "Pricing" },
];

const marketingPagePrefixes = [
  "/",
  "/method",
  "/about",
  "/puppy-training",
  "/german-shepherd-training",
  "/leash-training",
  "/stop-barking",
  "/training-options",
];

const trainingHelpItems = [
  { href: "/puppy-training", label: "Puppy Training" },
  { href: "/german-shepherd-training", label: "German Shepherd Training" },
  { href: "/leash-training", label: "Leash Training" },
  { href: "/stop-barking", label: "Stop Barking" },
];

export default function GlobalNavbar() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsDesktopDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isMarketingPage = marketingPagePrefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix)
  );
  const visibleNavItems = isMarketingPage ? marketingNavItems : workspaceNavItems;
  const isTrainingHelpActive = trainingHelpItems.some((item) =>
    pathname.startsWith(item.href),
  );

  const navItemClasses = (isActive: boolean) =>
    `rounded px-4 py-2 text-sm font-semibold transition ${
      isActive ? "bg-amber-400 text-black" : "text-white hover:bg-neutral-900"
    }`;

  const isNavItemActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-3 w-3 rounded bg-white" />
          <div>
            <p className="font-semibold">Patriot K9 Command</p>
            <p className="text-xs tracking-widest text-neutral-400">
              STRUCTURED DOG TRAINING
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden lg:flex items-center gap-2">
            {visibleNavItems.map((item) => {
              const isActive = isNavItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-amber-400 text-black"
                      : "text-white hover:bg-neutral-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="relative">
              <button
                type="button"
                aria-expanded={isDesktopDropdownOpen}
                aria-haspopup="menu"
                onClick={() =>
                  setIsDesktopDropdownOpen((currentValue) => !currentValue)
                }
                onBlur={(event) => {
                  if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) {
                    setIsDesktopDropdownOpen(false);
                  }
                }}
                className={navItemClasses(isTrainingHelpActive)}
              >
                Training Help
              </button>

              {isDesktopDropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                >
                  {trainingHelpItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className={`block rounded-lg px-4 py-3 text-sm transition ${
                          isActive
                            ? "bg-amber-400 text-black"
                            : "text-neutral-200 hover:bg-neutral-900 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

            {isLoaded && !isSignedIn && (
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/sign-in"
                className="rounded border border-neutral-600 px-4 py-2 text-sm hover:bg-neutral-900"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded bg-amber-400 px-4 py-2 text-sm font-semibold text-black"
              >
                Sign Up
              </Link>
            </div>
          )}

          {isLoaded && isSignedIn && (
            <div className="ml-2 flex items-center gap-2">
              {isMarketingPage && (
                <Link
                  href="/dashboard"
                  className="hidden rounded border border-neutral-600 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-900 lg:inline-flex"
                >
                  Dashboard
                </Link>
              )}
              <UserButton />
            </div>
          )}

          {!isLoaded && <div className="h-8 w-8" aria-hidden="true" />}

          <button
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)}
            className="rounded border border-neutral-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-neutral-900 lg:hidden"
          >
            Menu
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-neutral-800 px-4 py-4 lg:hidden"
        >
          <nav className="flex flex-col gap-2">
            {visibleNavItems.map((item) => {
              const isActive = isNavItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-amber-400 text-black"
                      : "text-white hover:bg-neutral-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-2 rounded-xl border border-neutral-800 bg-black/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                Training Help
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {trainingHelpItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-lg px-4 py-3 text-sm transition ${
                        isActive
                          ? "bg-amber-400 text-black"
                          : "text-neutral-200 hover:bg-neutral-900 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

          {isLoaded && !isSignedIn && (
              <div className="mt-2 grid gap-2">
                <Link
                  href="/sign-in"
                  className="rounded-lg border border-neutral-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-neutral-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-amber-400 px-4 py-3 text-center text-sm font-semibold text-black"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
