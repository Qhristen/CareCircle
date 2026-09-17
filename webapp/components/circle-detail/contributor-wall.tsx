"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { Backer } from "@/lib/circle-data";

const avatarStyles = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/15 text-secondary",
  tertiary: "bg-tertiary/15 text-tertiary",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

function naira(value: number) {
  return `₦${new Intl.NumberFormat("en-NG").format(value)}`;
}

export function ContributorWall({
  backers,
  supporters,
}: {
  backers: Backer[];
  supporters: number;
}) {
  const [tab, setTab] = useState<"all" | "prayers">("all");
  const [visibleCount, setVisibleCount] = useState(4);
  const filtered = useMemo(
    () => (tab === "prayers" ? backers.filter((backer) => backer.message) : backers),
    [backers, tab],
  );
  const messageCount = backers.filter((backer) => backer.message).length;

  return (
    <section className="space-y-4 rounded-2xl bg-white p-5 shadow-soft sm:p-8">
      <div className="flex flex-col justify-between gap-3 border-b border-surface-container pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5 overflow-x-auto">
          {[
            ["all", "All Contributions", supporters],
            ["prayers", "Messages & Prayers", messageCount],
          ].map(([value, label, count]) => (
            <button
              aria-pressed={tab === value}
              className={`flex shrink-0 items-center gap-2 border-b-2 pb-2 text-base font-bold transition ${
                tab === value
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
              key={value}
              onClick={() => {
                setTab(value as "all" | "prayers");
                setVisibleCount(4);
              }}
              type="button"
            >
              {label}
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px]">{count}</span>
            </button>
          ))}
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary">
          <Icon name="shield" size={14} /> Bank Verified Ledger
        </span>
      </div>

      <div className="space-y-4">
        {filtered.slice(0, visibleCount).map((backer) => (
          <article className="flex items-start gap-4 rounded-xl bg-surface-container-low/70 p-4" key={backer.id}>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-extrabold ${avatarStyles[backer.accent]}`}>
              {backer.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-on-surface">{backer.name}</span>
                  <span className="rounded-full bg-secondary-fixed px-2 py-0.5 text-[11px] font-extrabold text-on-secondary-fixed">
                    {backer.amountHidden ? "Private amount" : backer.item ? `Funded Item: ${naira(backer.amount)}` : naira(backer.amount)}
                  </span>
                </div>
                <span className="text-xs text-on-surface-variant">{backer.time}</span>
              </div>
              {backer.item && <p className="mt-1 text-xs font-medium text-on-surface-variant">Full sponsorship of <em>{backer.item}</em></p>}
              {backer.message && <p className="mt-1 text-sm italic leading-6 text-on-surface">“{backer.message}”</p>}
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-xl bg-surface-container-low px-4 py-8 text-center text-sm text-on-surface-variant">
          No public {tab === "prayers" ? "messages" : "contributions"} yet.
        </p>
      )}

      {visibleCount < filtered.length && (
        <button
          className="w-full rounded-full bg-surface-container py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high"
          onClick={() => setVisibleCount((count) => count + 3)}
          type="button"
        >
          Load More Messages & Well-Wishes
        </button>
      )}
    </section>
  );
}
