"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import { getApiErrorMessage } from "@/lib/api-error";
import type { WishlistDetailItem } from "@/lib/circle-data";

function naira(value: number) {
  return `₦${new Intl.NumberFormat("en-NG").format(value)}`;
}

export type ContributionInput = {
  amount: number;
  allocation: string;
  message: string;
  anonymous: boolean;
};

export function ContributionPanel({
  amount,
  allocation,
  beneficiaryName,
  circleTitle,
  raised,
  target,
  daysLeft,
  location,
  shareUrl,
  supporters,
  wishlist,
  copied,
  onAmountChange,
  onAllocationChange,
  onContribute,
  onCopy,
  acceptsContributions,
}: {
  amount: number;
  allocation: string;
  beneficiaryName: string;
  circleTitle: string;
  raised: number;
  target: number;
  daysLeft: number | null;
  location: string;
  shareUrl: string;
  supporters: number;
  wishlist: WishlistDetailItem[];
  copied: boolean;
  onAmountChange: (amount: number) => void;
  onAllocationChange: (allocation: string) => void;
  onContribute: (input: ContributionInput) => Promise<void>;
  onCopy: () => void;
  acceptsContributions: boolean;
}) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const percentage = Math.min(Math.round((raised / target) * 100), 100);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${t("circle.shareText", { title: circleTitle })} ${shareUrl}`,
  )}`;

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4" id="contribution-panel">
      <div className="rounded-2xl border border-surface-container bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-surface-container pb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700">
            <Icon name={daysLeft === null ? "check" : "alarm"} size={14} /> {daysLeft === null ? t("circle.contribution.complete") : t("circle.contribution.lockdownDays", { count: daysLeft })}
          </span>
          <span className="rounded-full bg-secondary-fixed px-2 py-0.5 text-[11px] font-extrabold text-secondary">
            {t("common.funded", { percent: percentage })}
          </span>
        </div>

        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-extrabold tracking-tight text-on-surface">{naira(raised)}</span>
            <span className="text-sm text-on-surface-variant">{t("circle.contribution.raised")}</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-on-surface-variant">
            <span>{t("circle.contribution.target")} <strong className="text-on-surface">{naira(target)}</strong></span>
            <span><strong>{supporters}</strong> {t("circle.contribution.supporters")}</span>
          </div>
        </div>

        <div
          aria-label={`${percentage}% funded`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={percentage}
          className="mb-5 h-3.5 overflow-hidden rounded-full bg-surface-container"
          role="progressbar"
        >
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary-container transition-[width] duration-500" style={{ width: `${percentage}%` }} />
        </div>

        {acceptsContributions ? <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (amount < 500) return;
            setError("");
            setIsSubmitting(true);
            try {
              await onContribute({ amount, allocation, message, anonymous });
            } catch (requestError) {
              setError(getApiErrorMessage(requestError, t("circle.contribution.checkoutError")));
              setIsSubmitting(false);
            }
          }}
        >

          <div>
            <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor="contribution-amount">
              {t("circle.contribution.selectAmount")}
            </label>
            <div className="mb-2 grid grid-cols-4 gap-2">
              {[2000, 5000, 10000, 25000].map((preset) => (
                <button
                  className={`rounded-lg py-2 text-xs font-bold transition ${amount === preset
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                    }`}
                  key={preset}
                  onClick={() => onAmountChange(preset)}
                  type="button"
                >
                  ₦{preset / 1000}k
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-outline">₦</span>
              <input
                className="w-full rounded-xl border-2 border-surface-container-high bg-white py-2.5 pl-9 pr-4 text-base font-bold text-on-surface outline-none ring-secondary/20 transition focus:border-secondary focus:ring-4"
                id="contribution-amount"
                min={500}
                onChange={(event) => onAmountChange(Number(event.target.value))}
                required
                step={500}
                type="number"
                value={amount}
              />
            </div>
          </div>

          <label className="block text-xs font-semibold text-on-surface-variant">
            <span className="mb-1 block">{t("circle.contribution.allocate")}</span>
            <select
              className="w-full rounded-lg border border-surface-container-high bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none focus:border-secondary"
              onChange={(event) => onAllocationChange(event.target.value)}
              value={allocation}
            >
              <option value="general">{t("circle.contribution.generalBundle")}</option>
              {wishlist
                .filter((item) => item.raised < item.goal)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({t("circle.contribution.needed", { amount: naira(item.goal - item.raised) })})
                  </option>
                ))}
            </select>
          </label>



          <label className="block text-xs font-semibold text-on-surface-variant">
            <span className="mb-1 block">{t("circle.contribution.noteLabel", { name: beneficiaryName })}</span>
            <textarea
              className="w-full resize-none rounded-lg border border-surface-container-high bg-white p-3 text-sm leading-6 text-on-surface outline-none focus:border-secondary"
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("circle.contribution.notePlaceholder", { name: beneficiaryName })}
              rows={3}
              value={message}
            />
          </label>

          <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-on-surface-variant">
            <input
              checked={anonymous}
              className="mt-0.5 h-4 w-4 accent-secondary"
              onChange={(event) => setAnonymous(event.target.checked)}
              type="checkbox"
            />
            {t("circle.contribution.anonymous")}
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700" role="alert">{error}</p>}

          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-primary-container active:scale-[0.99] disabled:cursor-wait disabled:opacity-70" disabled={isSubmitting} type="submit">
            <Icon name="heart" size={18} /> {isSubmitting ? t("circle.contribution.preparing") : t("circle.contribution.contribute", { amount: naira(amount || 0) })}
          </button>
        </form> : (
          <div className="rounded-xl bg-surface-container-low p-4 text-center">
            <p className="text-sm font-bold text-on-surface">{t("circle.contribution.closedTitle")}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{t("circle.contribution.closedBody")}</p>
          </div>
        )}

        <div className="mt-5 border-t border-surface-container pt-4 text-center">
          <p className="text-[11px] font-bold tracking-wider text-on-surface-variant">
            {t("circle.contribution.secureVia")} <strong className="text-on-surface">Paystack</strong>
          </p>

        </div>
      </div>

      <div className="rounded-2xl border border-surface-container bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-on-surface">
            <Icon className="text-secondary" name="sparkles" size={16} /> {t("circle.contribution.pipeline")}
          </h3>
          <span className="text-[11px] font-bold text-secondary">{t("circle.contribution.stageActive")}</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-on-surface-variant">{t("circle.contribution.pipelineIntro")}</p>
        <ol className="relative mt-4 space-y-4 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-0.5 before:bg-surface-container-high">
          {[
            [t("circle.contribution.targetFunding"), t("circle.contribution.targetFundingDetail", { count: supporters, amount: naira(raised) })],
            [t("circle.contribution.groupPurchase"), t("circle.contribution.groupPurchaseDetail")],
            [t("circle.contribution.delivery", { location }), t("circle.contribution.deliveryDetail")],
            [t("circle.contribution.keepsake"), t("circle.contribution.keepsakeDetail", { name: beneficiaryName })],
          ].map(([label, detail], index) => (
            <li className={`relative ${index > 0 ? "opacity-65" : ""}`} key={label}>
              <span className={`absolute -left-6 top-0.5 h-4 w-4 rounded-full ${index === 0 ? "bg-primary ring-4 ring-primary-fixed" : "border-2 border-surface-container-high bg-white"}`} />
              <p className="text-xs font-bold text-on-surface">{index + 1}. {label}</p>
              <p className="mt-0.5 text-xs leading-5 text-on-surface-variant">{detail}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-surface-container bg-white p-6 shadow-soft">
        <h3 className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-on-surface">
          <Icon className="text-primary" name="share" size={16} /> {t("circle.contribution.spreadWord")}
        </h3>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t("circle.contribution.spreadBody")}</p>
        <div className="mt-4 space-y-2">
          <a
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366]/15 px-4 py-2.5 text-sm font-bold text-[#128C7E] transition hover:bg-[#25D366]/25"
            href={whatsappUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Icon name="message" size={17} /> {t("circle.contribution.shareWhatsApp")}
          </a>
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface transition hover:bg-surface-container-high" onClick={onCopy} type="button">
            <Icon name={copied ? "check" : "copy"} size={17} /> {copied ? t("circle.contribution.copied") : t("circle.contribution.copyLink")}
          </button>
        </div>
      </div>
    </aside>
  );
}
