"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Icon, type IconName } from "@/components/ui/icon";

const steps: Array<{
  number: number;
  titleKey: string;
  descriptionKey: string;
  detailKey: string;
  icon: IconName;
  numberStyle: string;
  iconStyle: string;
}> = [
    {
      number: 1,
      titleKey: "explore.how.steps.oneTitle",
      descriptionKey: "explore.how.steps.oneDescription",
      detailKey: "explore.how.steps.oneDetail",
      icon: "book",
      numberStyle: "bg-primary-fixed text-on-primary-fixed",
      iconStyle: "text-primary",
    },
    {
      number: 2,
      titleKey: "explore.how.steps.twoTitle",
      descriptionKey: "explore.how.steps.twoDescription",
      detailKey: "explore.how.steps.twoDetail",
      icon: "shield",
      numberStyle: "bg-secondary-fixed text-on-secondary-fixed",
      iconStyle: "text-secondary",
    },
    {
      number: 3,
      titleKey: "explore.how.steps.threeTitle",
      descriptionKey: "explore.how.steps.threeDescription",
      detailKey: "explore.how.steps.threeDetail",
      icon: "heart",
      numberStyle: "bg-tertiary-fixed text-on-tertiary-fixed",
      iconStyle: "text-tertiary",
    },
  ];

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="mt-12 scroll-mt-20 bg-surface-container-low py-12"
      id="how-it-works"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">
            {t("explore.how.eyebrow")}
          </p>
          <h2
            className="text-[28px] font-extrabold tracking-tight text-on-surface sm:text-[32px]"
            id="how-it-works-heading"
          >
            {t("explore.how.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {t("explore.how.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <article
              className="rounded-2xl bg-white p-8 transition hover:-translate-y-1 hover:shadow-card"
              key={step.number}
            >
              <div
                className={`mb-5 grid h-12 w-12 place-items-center rounded-full text-xl font-extrabold ${step.numberStyle}`}
              >
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-on-surface">{t(step.titleKey)}</h3>
              <p className="mb-5 mt-2 text-sm leading-6 text-on-surface-variant">
                {t(step.descriptionKey)}
              </p>
              <div className="flex items-start gap-2.5 rounded-xl bg-surface-container-low p-3 text-xs leading-5 text-on-surface-variant">
                <Icon
                  className={`mt-0.5 shrink-0 ${step.iconStyle}`}
                  name={step.icon}
                  size={19}
                />
                <span>{t(step.detailKey)}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-primary to-primary-container p-7 text-white md:flex-row md:p-8">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold">{t("explore.how.ctaTitle")}</h3>
            <p className="mt-1 text-sm text-primary-fixed">
              {t("explore.how.ctaBody")}
            </p>
          </div>
          <Link
            className="shrink-0 rounded-full bg-white px-7 py-3.5 text-[13px] font-extrabold text-primary transition hover:bg-surface active:scale-[0.98]"
            href="/create-circle"
          >
            {t("explore.how.ctaButton")}
          </Link>
        </div>
      </div>
    </section>
  );
}
