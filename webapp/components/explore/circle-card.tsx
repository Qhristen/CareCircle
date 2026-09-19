"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import { daysUntil, nairaFromKobo, presentOccasion } from "@/lib/circle-presenters";
import type { Circle } from "@/types";

const accentStyles = {
  primary: {
    badge: "bg-primary text-white",
    progress: "bg-primary",
    metric: "text-primary",
    button: "bg-primary text-white hover:bg-primary-container",
  },
  secondary: {
    badge: "bg-secondary text-white",
    progress: "bg-secondary",
    metric: "text-secondary",
    button: "bg-secondary text-white hover:bg-[#285b49]",
  },
  tertiary: {
    badge: "bg-tertiary-container text-white",
    progress: "bg-tertiary-container",
    metric: "text-tertiary",
    button: "bg-primary text-white hover:bg-primary-container",
  },
};

export function CircleCard({ circle }: { circle: Circle }) {
  const { t } = useTranslation();
  const funding = circle.funding ?? {
    currency: circle.currency ?? "NGN",
    goalKobo: Math.round(Number(circle.targetAmount ?? 0) * 100),
    raisedKobo: Math.round(Number(circle.amountRaised ?? 0) * 100),
    percent: 0,
    supporterCount: circle.supporterCount ?? 0,
    closesAt: circle.deadline ?? "",
  };
  const organizer = circle.organizer ?? {
    displayName: t("explore.card.defaultOrganizer"),
    verified: false,
  };
  const cover = circle.cover ?? {
    url: circle.coverImageUrl ?? null,
    alt: circle.coverAlt || circle.title,
  };
  const wishlistPreview =
    circle.wishlistPreview ??
    circle.wishlist?.slice(0, 3) ??
    circle.items?.slice(0, 3) ??
    [];
  const city = circle.city ?? circle.recipient?.city ?? circle.recipientCity;
  const countryCode =
    circle.countryCode ??
    circle.recipient?.countryCode ??
    circle.recipientCountryCode;
  const percentage = funding.percent;
  const progress = Math.min(percentage, 100);
  const presentation = presentOccasion(circle.occasion);
  const styles = accentStyles[presentation.accent];
  const extraContributors = Math.max(funding.supporterCount - 3, 0);
  const detailHref = `/circles/${circle.slug}`;
  const daysLeft = daysUntil(funding.closesAt);
  const actionClassName = `flex-1 rounded-full py-2.5 text-center text-[13px] font-bold shadow-sm transition active:scale-[0.98] ${styles.button}`;

  return (
    <article className="group flex min-h-full flex-col overflow-hidden rounded-2xl bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <div className="relative h-52 overflow-hidden bg-surface-container">
        <Image
          alt={cover.alt}
          className="object-cover transition duration-500 group-hover:scale-105"
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
          src={cover.url || "/onbording_image.png"}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#211b18]/90 via-transparent to-black/25" />

        <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-sm ${styles.badge}`}
          >
            <span aria-hidden="true">{presentation.emoji}</span>
            {t(`occasions.${circle.occasion}`, { defaultValue: t("occasions.other") })}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-on-surface shadow-sm backdrop-blur-sm">
            <span aria-hidden="true" className="text-primary">
              ●
            </span>
            {[city, countryCode].filter(Boolean).join(", ")}
          </span>
        </div>

        <div className="absolute inset-x-4 bottom-4">
          <h2 className="truncate text-xl font-bold tracking-tight text-white">
            {circle.title}
          </h2>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-primary-fixed">
            <span>{t("common.organizedBy", { name: organizer.displayName })}</span>
            {organizer.verified && <Icon className="shrink-0 text-secondary-fixed" name="check" size={14} />}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-5 p-6">
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-on-surface">
                {nairaFromKobo(funding.raisedKobo)}
              </span>
              <span className="text-xs text-on-surface-variant">
                {" "}/ {nairaFromKobo(funding.goalKobo)}
              </span>
            </div>
            <span className={`shrink-0 text-xs font-extrabold ${styles.metric}`}>
              {percentage >= 100 ? t("common.goalMet") : t("common.funded", { percent: percentage })}
            </span>
          </div>

          <div
            aria-label={`${progress}% funded`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="h-2.5 overflow-hidden rounded-full bg-surface-container-highest"
            role="progressbar"
          >
            <div
              className={`h-full rounded-full transition-all ${styles.progress}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div
              aria-label={`${funding.supporterCount} contributors`}
              className="flex items-center -space-x-2"
            >
          
              {extraContributors > 0 && (
                <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-surface-container-highest text-[9px] font-extrabold text-on-surface">
                  +{extraContributors}
                </span>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1 text-xs ${daysLeft === null
                  ? "font-bold text-secondary"
                  : "text-on-surface-variant"
                }`}
            >
              <Icon
                name={daysLeft === null ? "check" : "alarm"}
                size={14}
              />
              {daysLeft === null
                ? t("explore.card.wrappingUp")
                : t("common.dayLeft", { count: daysLeft })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link className={actionClassName} href={detailHref}>
              {t("explore.card.chipIn")}
            </Link>
            <button
              aria-label={t("explore.card.share", { title: circle.title })}
              className="grid h-10 w-10 place-items-center rounded-full bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high hover:text-primary"
              type="button"
            >
              <Icon name="share" size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
