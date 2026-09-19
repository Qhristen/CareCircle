"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { getApiErrorMessage } from "@/lib/api-error";
import { useRegisterMutation } from "@/lib/store/api/authApi";
import { useAppDispatch } from "@/lib/store/hooks";
import { setCredentials } from "@/lib/store/slices/authSlice";

const fieldClass =
  "w-full rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-outline/70 focus:bg-white focus:ring-2 focus:ring-secondary";

export function SignUpForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [register, { isLoading }] = useRegisterMutation();

  const score =
    Number(password.length >= 8) +
    Number(/[0-9]/.test(password)) +
    Number(/[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password));

  const strength =
    password.length === 0
      ? { label: "Enter 8+ chars, number, uppercase", color: "bg-surface-container-highest", text: "text-on-surface-variant" }
      : score <= 1
        ? { label: "Weak: Add numbers & symbols", color: "bg-red-600", text: "text-red-700" }
        : score === 2
          ? { label: "Moderate: Good progress", color: "bg-tertiary", text: "text-tertiary" }
          : { label: "Rock solid password", color: "bg-secondary", text: "text-secondary" };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await register({
        name: `${String(form.get("firstName") ?? "").trim()} ${String(form.get("lastName") ?? "").trim()}`.trim(),
        email: String(form.get("email") ?? "").trim(),
        password,
        platform: "web",
      }).unwrap();
      dispatch(setCredentials({ user: response.user }));
      router.push("/create-circle");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to create your account."));
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-[13px] font-bold">
          First Name
          <input autoComplete="given-name" className={fieldClass} name="firstName" placeholder="e.g. Babatunde" required type="text" />
        </label>
        <label className="flex flex-col gap-2 text-[13px] font-bold">
          Last Name
          <input autoComplete="family-name" className={fieldClass} name="lastName" placeholder="e.g. Adeleke" required type="text" />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-[13px] font-bold">
        Email Address
        <span className="relative block">
          <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" name="mail" size={19} />
          <input autoComplete="email" className={`${fieldClass} pl-11`} name="email" placeholder="you@domain.com" required type="email" />
        </span>
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-bold" htmlFor="signup-password">Create Password</label>
          <button className="text-xs font-bold text-primary hover:underline" onClick={() => setShowPassword((shown) => !shown)} type="button">
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <span className="relative block">
          <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" name="lock" size={19} />
          <input
            className={`${fieldClass} pl-11`}
            id="signup-password"
            autoComplete="new-password"
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
        </span>
        <div className="mt-1 flex h-1.5 gap-1 overflow-hidden rounded-full">
          {[1, 2, 3].map((step) => (
            <span className={`h-full flex-1 rounded-full ${score >= step ? strength.color : "bg-surface-container-highest"}`} key={step} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold">
          <span className={strength.text}>{strength.label}</span>
          <span className="inline-flex items-center gap-1 text-on-surface-variant"><Icon className="text-secondary" name="shield" size={14} /> Encrypted</span>
        </div>
      </div>

      <div className="space-y-2 pt-1 text-xs leading-5 text-on-surface-variant">
        <label className="flex cursor-pointer items-start gap-3">
          <input className="mt-1 h-4 w-4 shrink-0 accent-primary" required type="checkbox" />
          <span>
            I agree to the <a className="font-semibold text-primary hover:underline" href="#">Community Guidelines</a>,{" "}
            <a className="font-semibold text-primary hover:underline" href="#">Terms of Service</a>, and consent to escrow holding rules.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input className="mt-1 h-4 w-4 shrink-0 accent-primary" defaultChecked type="checkbox" />
          <span>Receive joyful milestone reminders for close friends & family (optional). Never spam.</span>
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}

      <button className="mt-1 inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-4 text-sm font-extrabold text-white shadow-md transition hover:bg-primary-container active:scale-[0.99] disabled:cursor-wait disabled:opacity-70" disabled={isLoading} type="submit">
        {isLoading ? "Creating your account..." : "Create Account & Start Supporting"}
        {!isLoading && <Icon name="arrow-right" size={19} />}
      </button>

      <p className="text-center text-sm text-on-surface-variant">
        Already have an account?{" "}
        <Link className="font-bold text-primary underline decoration-primary/40 underline-offset-4" href="/sign-in">Sign in here</Link>
      </p>
    </form>
  );
}
