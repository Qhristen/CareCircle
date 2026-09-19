"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import type { WishlistDetailItem } from "@/lib/circle-data";

const accentStyles = {
  primary: {
    border: "border-primary",
    badge: "bg-primary-fixed text-on-primary-fixed",
    progress: "bg-primary",
  },
  secondary: {
    border: "border-secondary",
    badge: "bg-secondary-fixed text-on-secondary-fixed",
    progress: "bg-secondary",
  },
  tertiary: {
    border: "border-tertiary-container",
    badge: "bg-tertiary-fixed text-on-tertiary-fixed",
    progress: "bg-tertiary-container",
  },
};

function naira(value: number) {
  return `₦${new Intl.NumberFormat("en-NG").format(value)}`;
}

export function WishlistSection({
  items,
  location,
  onFundItem,
}: {
  items: WishlistDetailItem[];
  location: string;
  onFundItem: (item: WishlistDetailItem) => void;
}) {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="wishlist-heading" className="space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold text-on-surface" id="wishlist-heading">
            {t("circle.wishlist.title")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">
            {t("circle.wishlist.description", { location })}
          </p>
        </div>
        <span className="w-fit rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface">
          {t("circle.wishlist.priorityCount", { count: items?.length ?? 0 })}
        </span>
      </div>

      <div className="space-y-4">
        {items?.map((item) => {
          const funded = item.raised >= item.goal;
          const remaining = Math.max(item.goal - item.raised, 0);
          const percentage = Math.min(Math.round((item.raised / item.goal) * 100), 100);
          const styles = accentStyles[item.accent];

          return (
            <article
              className={`flex flex-col items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-soft transition hover:shadow-card md:flex-row md:items-center
              `}
              key={item.id}
            >
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-surface-container-low text-3xl">
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-on-surface">{item.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${styles.badge}`}>
                      {funded ? t("circle.wishlist.funded") : t("circle.wishlist.remaining", { amount: naira(remaining) })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    {item.description}
                  </p>

                  {funded ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                      <strong className="text-on-surface">{naira(item.goal)}</strong>
                      <span>•</span>
                      <span className="font-semibold text-secondary">{item.completionNote}</span>
                    </div>
                  ) : (
                    <div className="mt-3 max-w-sm">
                      <div
                        aria-label={`${percentage}% funded`}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={percentage}
                        className="h-2 overflow-hidden rounded-full bg-surface-container"
                        role="progressbar"
                      >
                        <div className={`h-full rounded-full ${styles.progress}`} style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="mt-1 flex justify-between gap-3 text-xs text-on-surface-variant">
                        <strong className="text-on-surface">{t("circle.wishlist.raised", { amount: naira(item.raised) })}</strong>
                        <span>{t("circle.wishlist.target", { amount: naira(item.goal), percent: percentage })}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {funded ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary-fixed px-3 py-2 text-xs font-bold text-secondary">
                  <Icon name="check" size={15} /> {t("circle.wishlist.bundleSecured")}
                </span>
              ) : (
                <button
                  className={`inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold shadow-sm transition active:scale-95 md:w-auto ${
                    item.id === "carrier"
                      ? "bg-primary text-white hover:bg-primary-container"
                      : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                  }`}
                  onClick={() => onFundItem(item)}
                  type="button"
                >
                  {item.id === "carrier" ? t("circle.wishlist.fundRemaining", { amount: naira(remaining) }) : t("circle.wishlist.contributeItem")}
                  <Icon name={item.id === "carrier" ? "arrow-right" : "plus"} size={15} />
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
