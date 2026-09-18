"use client";

import Link from "next/link";
import { CreateCircleWizard } from "@/components/create-circle/create-circle-wizard";
import { Icon } from "@/components/ui/icon";
import { useAppSelector } from "@/lib/store/hooks";

export function CreateCircleAccess() {
  const { authChecked, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!authChecked) {
    return (
      <main className="grid min-h-[65vh] place-items-center bg-surface px-4">
        <div className="text-center">
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-primary-fixed border-t-primary" />
          <p className="mt-4 text-sm font-semibold text-on-surface-variant">Checking your session…</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-[65vh] place-items-center bg-surface px-4 py-16">
        <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-fixed text-primary">
            <Icon name="lock" size={25} />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-on-surface">Sign in to create a circle</h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Your account is needed to save the draft, manage contributions, and publish its share link.
          </p>
          <Link className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-white hover:bg-primary-container" href="/sign-in?next=/create-circle">
            Sign in to continue <Icon name="arrow-right" size={17} />
          </Link>
          <p className="mt-4 text-xs text-on-surface-variant">
            New to CareCircle? <Link className="font-bold text-primary hover:underline" href="/sign-up">Create an account</Link>
          </p>
        </section>
      </main>
    );
  }

  return <CreateCircleWizard />;
}
