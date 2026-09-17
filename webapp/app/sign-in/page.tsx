import type { Metadata } from "next";
import Image from "next/image";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to manage your GiftCircle account, circles, and contributions.",
};

export default function SignInPage() {
  return (
    <main className="bg-surface py-8 sm:py-10">
      <div className="mx-auto grid max-w-[1240px] items-stretch gap-8 px-4 sm:px-6 lg:grid-cols-12">
        <aside className="relative min-h-[620px] overflow-hidden rounded-xl p-6 shadow-card sm:p-8 lg:col-span-5" aria-label="GiftCircle community impact">
          <Image
            alt="A multigenerational African family and close friends sharing a joyful meal"
            className="object-cover"
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            src="/onbording_image.png"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#282824] via-[#282824]/60 to-[#282824]/30" />
          <div className="absolute inset-0 bg-primary/15 mix-blend-multiply" />

          <div className="relative z-10 flex h-full min-h-[556px] flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider shadow-sm backdrop-blur-md">
                <Icon className="text-primary" name="heart" size={17} /> Harambee & Esusu Reimagined
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary-fixed/90 px-4 py-2 text-[10px] font-bold text-on-secondary-fixed shadow-sm backdrop-blur-md">
                <Icon name="lock" size={15} /> ProvidusBank Escrow
              </span>
            </div>

            <div className="my-auto space-y-4 py-8">
              <div className="rounded-lg bg-white/90 p-4 shadow-md backdrop-blur-lg transition hover:-translate-y-0.5">
                <div className="flex items-center gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary"><Icon name="check" size={21} /></span>
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold leading-none">₦84,250,000+</p>
                    <p className="mt-1 truncate text-xs text-on-surface-variant">Safely disbursed directly to recipients</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-white/90 p-4 shadow-md backdrop-blur-lg transition hover:-translate-y-0.5">
                <div className="flex items-center gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tertiary-fixed text-tertiary"><Icon name="users" size={21} /></span>
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold leading-none">42,800+ Contributors</p>
                    <p className="mt-1 truncate text-xs text-on-surface-variant">Pledging for weddings, babies & new beginnings</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#282824]/80 p-5 text-white backdrop-blur-md">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-tertiary-fixed">
                <Icon name="quote" size={17} /> The Collective Oath
              </div>
              <blockquote className="text-lg font-bold italic leading-7">“In our village, no one carries joy or grief alone.”</blockquote>
              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-surface-container-high">
                <span>Yorùbá traditional wisdom for joyful modern circles</span>
                <Icon className="shrink-0 text-secondary-fixed" name="leaf" size={19} />
              </div>
            </div>
          </div>
        </aside>

        <section className="flex flex-col justify-center lg:col-span-7">
          <div className="rounded-xl bg-white p-6 shadow-card sm:p-8">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> Member Portal
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-[32px] sm:leading-10">Welcome back to your circle</h1>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Continue supporting friends, tracking circles, or managing your collective care hampers.
              </p>
            </div>

            <GoogleAuthButton />

            <div className="mb-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-surface-container-highest" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Or sign in with email</span>
              <span className="h-px flex-1 bg-surface-container-highest" />
            </div>

            <SignInForm />
          </div>
        </section>
      </div>
    </main>
  );
}
