"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/method", label: "Method" },
  { href: "/train", label: "Trainer" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function GlobalNavbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* LEFT: LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <div className="h-3 w-3 rounded bg-white" />
          <div>
            <p className="font-semibold">Patriot K9 Command</p>
            <p className="text-xs tracking-widest text-neutral-400">
              STRUCTURED DOG TRAINING
            </p>
          </div>
        </Link>

        {/* RIGHT: NAV */}
        <div className="flex items-center gap-3">

          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

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
          </nav>

          {!isSignedIn && (
            <div className="hidden md:flex items-center gap-2">
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

          {isSignedIn && (
            <div className="ml-2">
              <UserButton />
            </div>
          )}
        </div>
      </div>

      {/* MOBILE NAV */}
      <div className="border-t border-neutral-800 px-4 py-2 md:hidden">
        <nav className="flex justify-center gap-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-2 text-xs font-semibold ${
                  isActive
                    ? "bg-amber-400 text-black"
                    : "text-white hover:bg-neutral-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}