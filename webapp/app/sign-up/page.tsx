import type { Metadata } from "next";
import Image from "next/image";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Create Your Account",
  description: "Join CareCircle and start supporting the people and moments that matter.",
};

const communityReasons = [
  {
    icon: "wallet" as const,
    title: "No fragmented bank transfers",
    body: "Forget chasing lost WhatsApp spreadsheets or cross-checking 20 separate account alerts.",
    iconClass: "bg-primary-fixed text-primary",
  },
  {
    icon: "book" as const,
    title: "Transparent verified wishlists",
    body: "Friends contribute directly toward verified retail partner items with doorstep dispatch.",
    iconClass: "bg-secondary-fixed text-secondary",
  },
  {
    icon: "lock" as const,
    title: "Confidential invite-only circles",
    body: "Organize surprise birthdays, recoveries, or weddings without leaking plans to celebrants.",
    iconClass: "bg-tertiary-fixed text-tertiary",
  },
];

export default function SignUpPage() {
  return (
    <main className="bg-surface py-8 sm:py-10">
      <div className="mx-auto grid max-w-[1240px] items-start gap-8 px-4 sm:px-6 lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-5" aria-label="Why communities choose CareCircle">
          <section className="group relative h-[340px] overflow-hidden rounded-xl bg-surface-container shadow-card">
            <Image
              alt="A joyful Nigerian family celebrating together around a festive table"
              className="object-cover transition duration-700 group-hover:scale-105"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              src="/onbording_image.png"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#242522] via-[#242522]/40 to-transparent" />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-surface/90 px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-primary shadow-sm backdrop-blur-md">
              <Icon name="heart" size={17} />
              Collective Prosperity
            </div>
            <div className="absolute inset-x-5 bottom-5 text-white">
              <div aria-label="Five out of five stars" className="mb-2 flex gap-1 text-[#ffb95f]">
                {Array.from({ length: 5 }, (_, index) => <span aria-hidden="true" key={index}>☆</span>)}
              </div>
              <blockquote className="text-base font-semibold leading-6 drop-shadow-sm sm:text-lg">
                “CareCircle turned our baby shower into a seamless village effort. 38 friends chipped in and our nursery was 100% prepared!”
              </blockquote>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                <span className="text-surface-container-high">Amaka K. • Lekki, Lagos</span>
                <span className="rounded bg-secondary/80 px-2 py-1 text-secondary-fixed">Verified Recipient</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-soft">
            <h2 className="mb-5 text-xl font-bold tracking-tight">Why communities choose us</h2>
            <div className="divide-y divide-surface-container-high">
              {communityReasons.map((reason) => (
                <div className="flex gap-4 py-4 first:pt-0 last:pb-0" key={reason.title}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${reason.iconClass}`}>
                    <Icon name={reason.icon} size={19} />
                  </span>
                  <div>
                    <h3 className="text-[13px] font-extrabold">{reason.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-on-surface-variant">{reason.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col items-start justify-between gap-3 rounded-xl bg-surface-container-low p-4 text-xs sm:flex-row sm:items-center">
            <span className="inline-flex items-center gap-3 font-bold uppercase tracking-wider text-on-surface-variant">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-60" />
                <span className="relative h-3 w-3 rounded-full bg-secondary" />
              </span>
              Active This Hour
            </span>
            <strong className="text-on-surface">1,420 Circles active across West Africa</strong>
          </section>
        </aside>

        <section className="rounded-xl bg-white p-6 shadow-card sm:p-8 lg:col-span-7">
          <div className="mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-4 py-1.5 text-[11px] font-extrabold tracking-wide text-primary">
              <Icon name="arrow-left" size={15} />
              Join the Community
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-[32px] sm:leading-10">Create your CareCircle account</h1>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant sm:text-base">
              Start a circle for a milestone, support a friend in recovery, or chip in easily.
            </p>
          </div>
          <GoogleAuthButton />

          <div className="mb-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-surface-container-high" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant">Or create with email</span>
            <span className="h-px flex-1 bg-surface-container-high" />
          </div>

          <SignUpForm />

          <div className="mt-6 flex flex-wrap items-center justify-around gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-center text-[10px] font-semibold text-on-surface-variant sm:text-[11px]">
            {/* <span className="inline-flex items-center gap-1.5"><Icon className="text-secondary" name="shield" size={16} /> Fidelity Escrow Protected</span> */}
            <span className="hidden h-3 w-px bg-outline/30 sm:block" />
            <span className="inline-flex items-center gap-1.5"><strong className="text-base text-primary">%</strong> Zero Hidden Fees</span>
            <span className="hidden h-3 w-px bg-outline/30 sm:block" />
            <span className="inline-flex items-center gap-1.5"><Icon className="text-tertiary" name="check" size={16} /> CBN Licensed Partner Bank</span>
          </div>
        </section>
      </div>
    </main>
  );
}
