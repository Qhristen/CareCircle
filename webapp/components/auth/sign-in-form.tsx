"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { getApiErrorMessage } from "@/lib/api-error";
import { useLoginMutation } from "@/lib/store/api/authApi";
import { useAppDispatch } from "@/lib/store/hooks";
import { setCredentials } from "@/lib/store/slices/authSlice";

export function SignInForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await login({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
        platform: "web",
      }).unwrap();
      dispatch(setCredentials({ user: response.user }));
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      router.push(requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/explore-circles");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to sign in."));
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="flex items-center justify-between gap-3 text-[13px] font-bold" htmlFor="signin-email">
          <span>Email address</span>
          <span className="hidden shrink-0 items-center gap-1 text-[11px] font-semibold text-secondary sm:inline-flex">
            <Icon name="bolt" size={14} /> Instant sync
          </span>
        </label>
        <div className="flex items-center rounded-lg bg-surface-container-low transition focus-within:bg-white focus-within:ring-2 focus-within:ring-secondary">
          <Icon className="ml-4 shrink-0 text-outline" name="at-sign" size={21} />
          <input autoComplete="email" className="w-full bg-transparent px-3 py-4 text-sm outline-none placeholder:text-outline/70" id="signin-email" name="email" placeholder="e.g. funke@gmail.com" required type="email" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-bold" htmlFor="signin-password">Password</label>
          <a className="text-xs font-bold text-primary hover:underline" href="#">Forgot password?</a>
        </div>
        <div className="flex items-center rounded-lg bg-surface-container-low transition focus-within:bg-white focus-within:ring-2 focus-within:ring-secondary">
          <Icon className="ml-4 shrink-0 text-outline" name="lock" size={20} />
          <input autoComplete="current-password" className="w-full bg-transparent px-3 py-4 text-sm outline-none placeholder:text-outline/70" id="signin-password" name="password" placeholder="••••••••••••" required type={showPassword ? "text" : "password"} />
          <button aria-label={showPassword ? "Hide password" : "Show password"} className="mr-4 text-outline transition hover:text-on-surface" onClick={() => setShowPassword((shown) => !shown)} type="button">
            <Icon name="eye" size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-1 text-xs text-on-surface-variant">
        <label className="flex cursor-pointer items-center gap-2">
          <input className="h-4 w-4 accent-secondary" defaultChecked type="checkbox" />
          <span>Remember this device for 30 days</span>
        </label>
        <span className="hidden items-center gap-1.5 font-semibold sm:flex"><Icon className="text-secondary" name="shield" size={16} /> Protected</span>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

      <button className="mt-1 inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-4 text-base font-extrabold text-white shadow-md transition hover:bg-primary-container active:scale-[0.99] disabled:cursor-wait disabled:opacity-80" disabled={isLoading} type="submit">
        {isLoading ? "Verifying Circle Access..." : "Sign In to GiftCircle"}
        {!isLoading && <Icon name="arrow-right" size={20} />}
      </button>

      <div className="flex justify-center pt-1">
        <button className="inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface" type="button">
          <Icon className="text-primary" name="mail" size={16} />
          Send me a passwordless magic link instead
        </button>
      </div>

      <div className="mt-1 flex flex-col items-center justify-between gap-3 rounded-lg bg-surface-container-low p-4 text-[11px] font-semibold sm:flex-row">
        <span className="inline-flex items-center gap-2"><Icon className="text-secondary" name="shield" size={17} /> 256-bit SSL Encrypted</span>
        <span className="inline-flex items-center gap-2 text-on-surface-variant"><span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Bank-Grade Escrow via ProvidusBank</span>
      </div>

      <p className="text-center text-sm text-on-surface-variant">
        Don&apos;t have an account yet?{" "}
        <Link className="font-bold text-primary underline decoration-primary-fixed decoration-2 underline-offset-4" href="/sign-up">Create your account (takes 60s)</Link>
      </p>
    </form>
  );
}
