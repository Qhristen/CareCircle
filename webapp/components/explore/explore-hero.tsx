"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import { spotlightImage } from "@/lib/explore-data";

const stats = [
  {
    value: "₦84.2M+",
    labelKey: "explore.hero.stats.deliveredLabel",
    noteKey: "explore.hero.stats.deliveredNote",
    color: "text-primary",
  },
  {
    value: "1,420+",
    labelKey: "explore.hero.stats.completedLabel",
    noteKey: "explore.hero.stats.completedNote",
    color: "text-secondary",
  },
  {
    value: "99.4%",
    labelKey: "explore.hero.stats.fulfillmentLabel",
    noteKey: "explore.hero.stats.fulfillmentNote",
    color: "text-tertiary",
  },
  {
    valueKey: "explore.hero.stats.zeroValue",
    labelKey: "explore.hero.stats.stressLabel",
    noteKey: "explore.hero.stats.stressNote",
    color: "text-primary",
  },
];

export function ExploreHero() {
  const { t } = useTranslation();

  return (
    <section
      className="relative scroll-mt-20 overflow-hidden bg-surface-container-low pb-12"
      id="start-a-circle"
    >
      <div className="pointer-events-none absolute -right-28 -top-36 h-[440px] w-[440px] rounded-full bg-primary-fixed/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-secondary-fixed/60 blur-3xl" />

      <div className="relative mx-auto max-w-[1240px] px-4 pt-10 sm:px-6 md:pt-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="z-10 space-y-5 lg:col-span-7">
            <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full bg-surface-container px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] shadow-sm sm:text-[11px]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-primary">{t("explore.hero.eyebrow")}</span>
              <span className="text-outline">•</span>
              <span className="text-on-surface-variant">{t("explore.hero.liveCities")}</span>
            </div>
            {/* 
            <h1 className="max-w-3xl text-[36px] font-extrabold leading-[1.13] tracking-[-0.035em] text-on-surface sm:text-[44px] sm:leading-[1.15]">
              Turning individual contributions into{" "}
              <span className="italic text-primary">collective support.</span>
            </h1> */}

            <h1 className="max-w-3xl text-[36px] font-extrabold leading-[1.13] tracking-[-0.035em] text-on-surface sm:text-[44px] sm:leading-[1.15]">
              {t("explore.hero.titleStart")} <span className="pr-2 italic text-primary">{t("explore.hero.titleEmphasis")}</span> {t("explore.hero.titleEnd")}
            </h1>

            <p className="max-w-xl text-base leading-7 text-on-surface-variant">
              {t("explore.hero.description")}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-lg active:scale-[0.98]"
                href="/create-circle"
              >
                <Icon name="heart" size={18} />
                {t("explore.hero.startFree")}
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[13px] font-bold text-on-surface transition hover:bg-surface"
                href="#active-circles"
              >
                <Icon className="text-secondary" name="compass" size={18} />
                {t("explore.hero.exploreOpen")}
              </Link>
            </div>

            <div className="flex max-w-2xl items-center gap-3 pt-1 text-xs leading-5 text-on-surface-variant">
              <div aria-hidden="true" className="flex shrink-0 -space-x-2">
                {[
                  ["EA", "bg-[#f4b69f]"],
                  ["KO", "bg-[#94cbb3]"],
                  ["MN", "bg-[#f1c275]"],
                ].map(([initials, color]) => (
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full border-2 border-surface-container-low text-[8px] font-black text-on-surface ${color}`}
                    key={initials}
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <span>
                {t("explore.hero.trustLine")}
              </span>
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_20px_50px_-25px_rgba(67,32,16,0.35)] sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-fixed px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-on-tertiary-fixed">
                  <Icon name="heart" size={14} />
                  {t("explore.hero.urgentAppeal")}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  {t("explore.hero.liveUpdates")}
                </span>
              </div>

              <div className="relative my-3 h-48 overflow-hidden rounded-xl">
                <Image
                  alt={t("explore.hero.spotlightAlt")}
                  className="object-cover"
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 40vw"
                  src={spotlightImage}
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#211b18]/90 via-[#211b18]/20 to-transparent p-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary-fixed">
                    {t("explore.hero.spotlightCategory")}
                  </span>
                  <h2 className="mt-0.5 text-xl font-bold text-white">
                    {t("explore.hero.spotlightTitle")}
                  </h2>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <span className="text-2xl font-extrabold tracking-tight text-primary">
                      ₦1,850,000
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {" "}{t("explore.hero.raisedOf", { goal: "₦4,500,000" })}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary-fixed px-2.5 py-1 text-[11px] font-extrabold text-on-secondary-fixed">
                    41% Funded
                  </span>
                </div>
                <div
                  aria-label="41% funded"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={41}
                  className="h-3 overflow-hidden rounded-full bg-surface-container-highest"
                  role="progressbar"
                >
                  <div className="h-full w-[41%] rounded-full bg-primary" />
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-on-surface-variant">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="text-secondary" name="users" size={16} />
                    {t("explore.hero.peopleContributing", { count: 96 })}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-tertiary">
                    <Icon name="alarm" size={15} />{t("explore.hero.hoursLeft", { count: 18 })}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    className="flex-1 rounded-full bg-primary py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-primary-container"
                    type="button"
                  >
                    {t("explore.hero.helpMariam")}
                  </button>
                  <button
                    aria-label={t("explore.hero.viewNeeds")}
                    className="grid h-10 w-10 place-items-center rounded-full bg-surface-container text-on-surface-variant transition hover:text-primary"
                    type="button"
                  >
                    <Icon name="heart" size={17} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-10 grid grid-cols-2 gap-x-4 gap-y-7 rounded-2xl bg-white p-6 md:grid-cols-4 md:gap-6"
          id="impact"
        >
          {stats.map((stat) => (
            <div className="flex flex-col" key={stat.labelKey}>
              <span className={`text-2xl font-extrabold tracking-tight ${stat.color}`}>
                {stat.valueKey ? t(stat.valueKey) : stat.value}
              </span>
              <span className="mt-0.5 text-[13px] font-extrabold text-on-surface">
                {t(stat.labelKey)}
              </span>
              <span className="text-[11px] leading-5 text-on-surface-variant">
                {t(stat.noteKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
