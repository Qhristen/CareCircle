import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

const steps: Array<{
  number: number;
  title: string;
  description: string;
  detail: string;
  icon: IconName;
  numberStyle: string;
  iconStyle: string;
}> = [
    {
      number: 1,
      title: "Start a Circle in 60s",
      description:
        "Set up an occasion, add specific wishlist items, or choose a flexible mutual-aid milestone in Naira.",
      detail: "Thoughtful templates for birthdays, bridal, and care funds.",
      icon: "book",
      numberStyle: "bg-primary-fixed text-on-primary-fixed",
      iconStyle: "text-primary",
    },
    {
      number: 2,
      title: "Share & Chip In Flexibly",
      description:
        "Share one beautiful link on WhatsApp, social media, or email. Anyone can chip in",
      detail: "Card, transfer, and USSD payments on secure settlement rails.",
      icon: "shield",
      numberStyle: "bg-secondary-fixed text-on-secondary-fixed",
      iconStyle: "text-secondary",
    },
    {
      number: 3,
      title: "Delivery & Keepsake Card",
      description:
        "Funds clear to verified fulfillment or the recipient, alongside a scrapbook of everyone’s warm blessings.",
      detail: "99.4% delivery verification with transparent community receipts.",
      icon: "heart",
      numberStyle: "bg-tertiary-fixed text-on-tertiary-fixed",
      iconStyle: "text-tertiary",
    },
  ];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="mt-12 scroll-mt-20 bg-surface-container-low py-12"
      id="how-it-works"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">
            Simple, Dignified, Transparent
          </p>
          <h2
            className="text-[28px] font-extrabold tracking-tight text-on-surface sm:text-[32px]"
            id="how-it-works-heading"
          >
            How CareCircle Works
          </h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Replace fragmented group transfers, awkward reminders, and lost
            delivery coordination with one warm collective experience.
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
              <h3 className="text-xl font-bold text-on-surface">{step.title}</h3>
              <p className="mb-5 mt-2 text-sm leading-6 text-on-surface-variant">
                {step.description}
              </p>
              <div className="flex items-start gap-2.5 rounded-xl bg-surface-container-low p-3 text-xs leading-5 text-on-surface-variant">
                <Icon
                  className={`mt-0.5 shrink-0 ${step.iconStyle}`}
                  name={step.icon}
                  size={19}
                />
                <span>{step.detail}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-primary to-primary-container p-7 text-white md:flex-row md:p-8">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold">Have someone special in mind?</h3>
            <p className="mt-1 text-sm text-primary-fixed">
              Create a private or public circle now — no initial payment needed.
            </p>
          </div>
          <Link
            className="shrink-0 rounded-full bg-white px-7 py-3.5 text-[13px] font-extrabold text-primary transition hover:bg-surface active:scale-[0.98]"
            href="/create-circle"
          >
            Start a CareCircle in 60 Seconds
          </Link>
        </div>
      </div>
    </section>
  );
}
