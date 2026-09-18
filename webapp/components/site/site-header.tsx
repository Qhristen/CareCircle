"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Icon } from "@/components/ui/icon";
import { baseApi } from "@/lib/store/api/baseApi";
import { useLogoutMutation } from "@/lib/store/api/authApi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { logout as clearSession } from "@/lib/store/slices/authSlice";

const navigation = [
  { label: "Explore Circles", href: "/explore-circles" },
  { label: "How It Works", href: "/explore-circles#how-it-works" },
  { label: "Active Circles", href: "/explore-circles#active-circles" },
  // { label: "Stories & Impact", href: "/explore-circles#impact" },
];

export function SiteHeader() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [logout] = useLogoutMutation();
  const userInitials = user?.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "GC";

  async function handleLogout() {
    try {
      await logout().unwrap();
    } finally {
      dispatch(clearSession());
      dispatch(baseApi.util.resetApiState());
      setProfileOpen(false);
      router.push("/sign-in");
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.04] bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 xl:flex">
            {navigation.map((item) => {
              const active =
                item.href === "/explore-circles" &&
                (pathname === "/explore-circles" || pathname === "/");

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${active
                      ? "bg-surface-container text-on-surface"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                    }`}
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-3">
          <form
            action="/explore-circles#active-circles"
            className="relative hidden w-full max-w-[292px] md:block"
          >
            <label className="sr-only" htmlFor="site-search">
              Search CareCircle
            </label>
            <Icon
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline"
              name="search"
              size={17}
            />
            <input
              className="w-full rounded-full bg-white py-2.5 pl-10 pr-4 text-xs text-on-surface outline-none ring-primary/20 placeholder:text-outline focus:ring-4"
              id="site-search"
              name="q"
              placeholder="Search circles, recipients, or causes..."
              type="search"
            />
          </form>

          <Link
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-[13px] font-bold text-white  transition hover:bg-primary-container active:scale-[0.98] sm:px-5"
            href="/create-circle"
          >
            <Icon name="plus" size={17} />
            <span className="hidden sm:inline">Start a Circle</span>
          </Link>

          <button
            aria-label="Notifications"
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            type="button"
          >
            <Icon name="bell" size={19} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-surface" />
          </button>

          {isAuthenticated && user ? (
            <div className="relative hidden lg:block">
              <button
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
                className="flex items-center gap-1 rounded-full p-1 transition hover:bg-surface-container"
                onClick={() => setProfileOpen((open) => !open)}
                type="button"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-extrabold text-white">
                  {userInitials}
                </span>
                <Icon className="text-outline" name="chevron-down" size={15} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 w-56 rounded-xl bg-white p-2 shadow-card">
                  <div className="border-b border-surface-container px-3 py-2">
                    <p className="truncate text-sm font-bold text-on-surface">{user.name}</p>
                    <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
                  </div>
                  <Link
                    className="mt-1 block rounded-lg px-3 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
                    href="/my-circles"
                    onClick={() => setProfileOpen(false)}
                  >
                    My circles
                  </Link>
                  <button className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-on-surface-variant hover:bg-surface-container" onClick={handleLogout} type="button">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link className="hidden rounded-full px-3 py-2 text-sm font-bold text-primary hover:bg-primary-fixed lg:block" href="/sign-in">
              Sign in
            </Link>
          )}

          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container xl:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <Icon name={menuOpen ? "close" : "menu"} size={21} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-black/[0.05] bg-surface px-4 py-3 shadow-lg xl:hidden"
        >
          <div className="mx-auto grid max-w-[1240px] gap-1">
            {!isAuthenticated && (
              <Link className="rounded-xl px-4 py-3 text-sm font-semibold text-primary hover:bg-surface-container" href="/sign-in" onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>
            )}
            {navigation.map((item) => (
              <Link
                className="rounded-xl px-4 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
                href={item.href}
                key={item.label}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
                  href="/my-circles"
                  onClick={() => setMenuOpen(false)}
                >
                  My circles
                </Link>
                <button className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-on-surface-variant hover:bg-surface-container" onClick={handleLogout} type="button">
                  Sign out
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
