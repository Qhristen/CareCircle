"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/brand/logo";
import { Icon } from "@/components/ui/icon";

const footerGroups = [
  {
    titleKey: "footer.communitySupport",
    links: [
      ["footer.browseCircles", "/explore-circles"],
      ["footer.activeBundles", "/explore-circles#active-circles"],
      ["footer.createCircle", "/create-circle"],
      ["footer.supportWishlists", "/explore-circles"],
    ],
  },
  {
    titleKey: "footer.trustTransparency",
    links: [
      ["footer.howItWorks", "/explore-circles#how-it-works"],
      ["footer.escrow", "/explore-circles#how-it-works"],
      ["footer.stories", "/explore-circles#impact"],
      ["footer.guidelines", "/explore-circles"],
    ],
  },
];

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="mt-12 w-full bg-surface-container-low">
      <div className="mx-auto max-w-[1240px] px-4 pb-8 pt-12 sm:px-6">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <Logo />
            <p className="max-w-sm text-sm leading-6 text-on-surface-variant">
              {t("footer.tagline")}
            </p>
            {/* <div className="inline-flex items-center gap-2 rounded-full bg-secondary-fixed px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-on-secondary-fixed">
              <Icon name="shield" size={16} />
              Fidelity & Trust Guaranteed
            </div> */}
          </div>

          {footerGroups.map((group) => (
            <div className="space-y-3 lg:col-span-2" key={group.titleKey}>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                {t(group.titleKey)}
              </h2>
              <ul className="space-y-2 text-xs leading-5 text-on-surface-variant">
                {group.links.map(([label, href]) => (
                  <li key={label}>
                    <Link className="transition hover:text-primary" href={href}>
                      {t(label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-4 rounded-xl bg-white p-6 shadow-soft lg:col-span-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-bold text-on-surface">
                {t("footer.currencyPreference")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-secondary">
                <span className="h-2 w-2 rounded-full bg-secondary" />
                {t("footer.liveHub")}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
              <div className="flex items-center gap-3">
                <span className="text-xl font-extrabold text-primary">₦</span>
                <div>
                  <div className="text-[13px] font-bold text-on-surface">
                    {t("footer.naira")}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    {t("footer.bankRails")}
                  </div>
                </div>
              </div>
              <Icon className="text-secondary" name="check" size={18} />
            </div>
            <p className="text-xs leading-5 text-on-surface-variant">
              {t("footer.poweredBy")}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-on-surface/[0.08] pt-6 text-center text-xs leading-5 text-on-surface-variant md:flex-row md:text-left">
          <div className="flex items-start gap-2">
            <Icon className="mt-0.5 shrink-0 text-tertiary" name="heart" size={15} />
            <span>
              {t("footer.heritage")}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span>© {new Date().getFullYear()} CareCircle Inc.</span>
            <Link className="hover:text-on-surface" href="/">
              {t("footer.privacy")}
            </Link>
            <Link className="hover:text-on-surface" href="/">
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
