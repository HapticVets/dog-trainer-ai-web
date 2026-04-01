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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0f17]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo-icon.png"
            alt="Patriot K9 Command"
            className="h-9 w-9 object-contain"
          />
          <div className="leading-tight">
            <div className="text-base font-bold text-white">Patriot K9 Command</div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Structured Dog Training
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-cyan-400 text-black"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {!isSignedIn && (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/sign-in"
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-black hover:brightness-110"
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

      <div className="border-t border-white/5 px-4 py-2 md:hidden">
        <nav className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-cyan-400 text-black"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {!isSignedIn && (
          <div className="mt-3 flex justify-center gap-2">
            <Link
              href="/sign-in"
              className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-black hover:brightness-110"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}