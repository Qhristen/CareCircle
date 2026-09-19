import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Icon } from "@/components/ui/icon";

const footerGroups = [
  {
    title: "Community Support",
    links: [
      ["Browse Circles", "/explore-circles"],
      ["Active Bundles", "/explore-circles#active-circles"],
      ["Create a Circle", "/create-circle"],
      ["Support Wishlists", "/explore-circles"],
    ],
  },
  {
    title: "Trust & Transparency",
    links: [
      ["How It Works", "/explore-circles#how-it-works"],
      ["Direct Escrow & Bank Vault", "/explore-circles#how-it-works"],
      ["Stories & Impact", "/explore-circles#impact"],
      ["Community Guidelines", "/explore-circles"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-12 w-full bg-surface-container-low">
      <div className="mx-auto max-w-[1240px] px-4 pb-8 pt-12 sm:px-6">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <Logo />
            <p className="max-w-sm text-sm leading-6 text-on-surface-variant">
              Bridging the ancestral heart of African collective support with
              transparent, secure, and meaningful digital giving.
            </p>
            {/* <div className="inline-flex items-center gap-2 rounded-full bg-secondary-fixed px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-on-secondary-fixed">
              <Icon name="shield" size={16} />
              Fidelity & Trust Guaranteed
            </div> */}
          </div>

          {footerGroups.map((group) => (
            <div className="space-y-3 lg:col-span-2" key={group.title}>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                {group.title}
              </h2>
              <ul className="space-y-2 text-xs leading-5 text-on-surface-variant">
                {group.links.map(([label, href]) => (
                  <li key={label}>
                    <Link className="transition hover:text-primary" href={href}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-4 rounded-xl bg-white p-6 shadow-soft lg:col-span-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-bold text-on-surface">
                Regional Currency Preference
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-secondary">
                <span className="h-2 w-2 rounded-full bg-secondary" />
                Live Hub
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3">
              <div className="flex items-center gap-3">
                <span className="text-xl font-extrabold text-primary">₦</span>
                <div>
                  <div className="text-[13px] font-bold text-on-surface">
                    NGN — Nigerian Naira
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    Local bank rails & zero-fee transfers
                  </div>
                </div>
              </div>
              <Icon className="text-secondary" name="check" size={18} />
            </div>
            <p className="text-xs leading-5 text-on-surface-variant">
              Powered by institutional micro-clearing and real-time community
              receipts.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-on-surface/[0.08] pt-6 text-center text-xs leading-5 text-on-surface-variant md:flex-row md:text-left">
          <div className="flex items-start gap-2">
            <Icon className="mt-0.5 shrink-0 text-tertiary" name="heart" size={15} />
            <span>
              Rooted in Harambee, Esusu, and Ajo solidarity traditions. Built
              with devotion across the continent.
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span>© {new Date().getFullYear()} CareCircle Inc.</span>
            <Link className="hover:text-on-surface" href="/">
              Privacy
            </Link>
            <Link className="hover:text-on-surface" href="/">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
