"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Icon, type IconName } from "@/components/ui/icon";

const communityReasons: Array<{ icon: IconName; titleKey: string; bodyKey: string; iconClass: string }> = [
  { icon: "wallet", titleKey: "auth.signUpPage.reasons.transfersTitle", bodyKey: "auth.signUpPage.reasons.transfersBody", iconClass: "bg-primary-fixed text-primary" },
  { icon: "book", titleKey: "auth.signUpPage.reasons.wishlistsTitle", bodyKey: "auth.signUpPage.reasons.wishlistsBody", iconClass: "bg-secondary-fixed text-secondary" },
  { icon: "lock", titleKey: "auth.signUpPage.reasons.privateTitle", bodyKey: "auth.signUpPage.reasons.privateBody", iconClass: "bg-tertiary-fixed text-tertiary" },
];

export function SignUpPageContent() {
  const { t } = useTranslation();

  return (
    <main className="bg-surface py-8 sm:py-10">
      <div className="mx-auto grid max-w-[1240px] items-start gap-8 px-4 sm:px-6 lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-5" aria-label={t("auth.signUpPage.asideLabel")}>
          <section className="group relative h-[340px] overflow-hidden rounded-xl bg-surface-container shadow-card">
            <Image alt={t("auth.signUpPage.imageAlt")} className="object-cover transition duration-700 group-hover:scale-105" fill priority sizes="(min-width: 1024px) 40vw, 100vw" src="/onbording_image.png" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#242522] via-[#242522]/40 to-transparent" />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-surface/90 px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-primary shadow-sm backdrop-blur-md"><Icon name="heart" size={17} />{t("auth.signUpPage.prosperity")}</div>
            <div className="absolute inset-x-5 bottom-5 text-white">
              <div aria-label={t("auth.signUpPage.stars")} className="mb-2 flex gap-1 text-[#ffb95f]">{Array.from({ length: 5 }, (_, index) => <span aria-hidden="true" key={index}>☆</span>)}</div>
              <blockquote className="text-base font-semibold leading-6 drop-shadow-sm sm:text-lg">{t("auth.signUpPage.testimonial")}</blockquote>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold"><span className="text-surface-container-high">Amaka K. • Lekki, Lagos</span><span className="rounded bg-secondary/80 px-2 py-1 text-secondary-fixed">{t("auth.signUpPage.verifiedRecipient")}</span></div>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-soft">
            <h2 className="mb-5 text-xl font-bold tracking-tight">{t("auth.signUpPage.whyTitle")}</h2>
            <div className="divide-y divide-surface-container-high">
              {communityReasons.map((reason) => (
                <div className="flex gap-4 py-4 first:pt-0 last:pb-0" key={reason.titleKey}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${reason.iconClass}`}><Icon name={reason.icon} size={19} /></span>
                  <div><h3 className="text-[13px] font-extrabold">{t(reason.titleKey)}</h3><p className="mt-1 text-sm leading-6 text-on-surface-variant">{t(reason.bodyKey)}</p></div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col items-start justify-between gap-3 rounded-xl bg-surface-container-low p-4 text-xs sm:flex-row sm:items-center">
            <span className="inline-flex items-center gap-3 font-bold uppercase tracking-wider text-on-surface-variant"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-60" /><span className="relative h-3 w-3 rounded-full bg-secondary" /></span>{t("auth.signUpPage.activeNow")}</span>
            <strong className="text-on-surface">{t("auth.signUpPage.activeCount")}</strong>
          </section>
        </aside>

        <section className="rounded-xl bg-white p-6 shadow-card sm:p-8 lg:col-span-7">
          <div className="mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-fixed px-4 py-1.5 text-[11px] font-extrabold tracking-wide text-primary"><Icon name="arrow-left" size={15} />{t("auth.signUpPage.join")}</div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-[32px] sm:leading-10">{t("auth.signUpPage.title")}</h1>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant sm:text-base">{t("auth.signUpPage.description")}</p>
          </div>
          <GoogleAuthButton />
          <div className="mb-6 flex items-center gap-4"><span className="h-px flex-1 bg-surface-container-high" /><span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-on-surface-variant">{t("auth.signUpPage.emailDivider")}</span><span className="h-px flex-1 bg-surface-container-high" /></div>
          <SignUpForm />
          <div className="mt-6 flex flex-wrap items-center justify-around gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-center text-[10px] font-semibold text-on-surface-variant sm:text-[11px]">
            <span className="hidden h-3 w-px bg-outline/30 sm:block" /><span className="inline-flex items-center gap-1.5"><strong className="text-base text-primary">%</strong> {t("auth.signUpPage.zeroFees")}</span><span className="hidden h-3 w-px bg-outline/30 sm:block" /><span className="inline-flex items-center gap-1.5"><Icon className="text-tertiary" name="check" size={16} /> {t("auth.signUpPage.licensedBank")}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
