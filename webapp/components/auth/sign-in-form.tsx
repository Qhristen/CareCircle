"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import { getApiErrorMessage } from "@/lib/api-error";
import { useLoginMutation } from "@/lib/store/api/authApi";
import { useAppDispatch } from "@/lib/store/hooks";
import { setCredentials } from "@/lib/store/slices/authSlice";

export function SignInForm() {
  const { t } = useTranslation();
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
      setError(getApiErrorMessage(requestError, t("auth.signInError")));
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="flex items-center justify-between gap-3 text-[13px] font-bold" htmlFor="signin-email">
          <span>{t("auth.email")}</span>
          <span className="hidden shrink-0 items-center gap-1 text-[11px] font-semibold text-secondary sm:inline-flex">
            <Icon name="bolt" size={14} /> {t("auth.instantSync")}
          </span>
        </label>
        <div className="flex items-center rounded-lg bg-surface-container-low transition focus-within:bg-white focus-within:ring-2 focus-within:ring-secondary">
          <Icon className="ml-4 shrink-0 text-outline" name="at-sign" size={21} />
          <input autoComplete="email" className="w-full bg-transparent px-3 py-4 text-sm outline-none placeholder:text-outline/70" id="signin-email" name="email" placeholder="e.g. funke@gmail.com" required type="email" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-bold" htmlFor="signin-password">{t("auth.password")}</label>
          <a className="text-xs font-bold text-primary hover:underline" href="#">{t("auth.forgotPassword")}</a>
        </div>
        <div className="flex items-center rounded-lg bg-surface-container-low transition focus-within:bg-white focus-within:ring-2 focus-within:ring-secondary">
          <Icon className="ml-4 shrink-0 text-outline" name="lock" size={20} />
          <input autoComplete="current-password" className="w-full bg-transparent px-3 py-4 text-sm outline-none placeholder:text-outline/70" id="signin-password" name="password" placeholder="••••••••••••" required type={showPassword ? "text" : "password"} />
          <button aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")} className="mr-4 text-outline transition hover:text-on-surface" onClick={() => setShowPassword((shown) => !shown)} type="button">
            <Icon name="eye" size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-1 text-xs text-on-surface-variant">
        <label className="flex cursor-pointer items-center gap-2">
          <input className="h-4 w-4 accent-secondary" defaultChecked type="checkbox" />
          <span>{t("auth.rememberDevice")}</span>
        </label>
        <span className="hidden items-center gap-1.5 font-semibold sm:flex"><Icon className="text-secondary" name="shield" size={16} /> {t("auth.protected")}</span>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

      <button className="mt-1 inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-4 text-base font-extrabold text-white shadow-md transition hover:bg-primary-container active:scale-[0.99] disabled:cursor-wait disabled:opacity-80" disabled={isLoading} type="submit">
        {isLoading ? t("auth.verifying") : t("auth.signInButton")}
        {!isLoading && <Icon name="arrow-right" size={20} />}
      </button>


      <p className="text-center text-sm text-on-surface-variant">
        {t("auth.noAccount")} {" "}
        <Link className="font-bold text-primary underline decoration-primary-fixed decoration-2 underline-offset-4" href="/sign-up">{t("auth.createIn60")}</Link>
      </p>
    </form>
  );
}
