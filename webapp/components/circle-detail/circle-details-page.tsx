"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { ContributionPanel, type ContributionInput } from "@/components/circle-detail/contribution-panel";
import { ContributorWall } from "@/components/circle-detail/contributor-wall";
import { OrganizerModal } from "@/components/circle-detail/organizer-modal";
import { WishlistSection } from "@/components/circle-detail/wishlist-section";
import { Icon } from "@/components/ui/icon";
import { getApiErrorMessage } from "@/lib/api-error";
import { daysUntil, presentOccasion } from "@/lib/circle-presenters";
import type { Backer, WishlistDetailItem } from "@/lib/circle-data";
import { useGetCircleQuery, useMessageOrganizerMutation } from "@/lib/store/api/circleApi";
import { useCreateContributionIntentMutation, useGetPublicContributionsQuery } from "@/lib/store/api/contributionApi";
import type { Circle, PublicContribution } from "@/types";

function initials(name: string) {
  return name?.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function relativeTime(value: string, t: TFunction) {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(elapsed / 60_000));
  if (minutes < 60) return t("circle.relative.minuteAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("circle.relative.hourAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("circle.relative.dayAgo", { count: days });
}

function toBacker(entry: PublicContribution, index: number, t: TFunction): Backer {
  const accents: Backer["accent"][] = ["primary", "secondary", "tertiary"];
  return {
    id: entry.id,
    initials: entry.initials,
    name: entry.displayName,
    amount: (entry.amountKobo ?? 0) / 100,
    amountHidden: entry.amountKobo === null,
    time: relativeTime(entry.createdAt, t),
    message: entry.message ?? "",
    item: entry.wishlistItem?.name,
    anonymous: entry.anonymous,
    accent: entry.anonymous ? "neutral" : accents[index % accents.length],
  };
}

export function CircleDetailsPage({ circleId }: { circleId: string }) {
  const { t } = useTranslation();
  const { data, error, isLoading, refetch } = useGetCircleQuery(circleId);

  if (isLoading) {
    return <main className="mx-auto min-h-screen max-w-[1240px] animate-pulse px-4 py-10 sm:px-6"><div className="h-12 w-2/3 rounded-xl bg-surface-container" /><div className="mt-8 h-96 rounded-2xl bg-surface-container" /></main>;
  }

  if (error || !data) {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-2xl place-items-center px-4 py-16 text-center">
        <div>
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-fixed text-primary"><Icon name="heart" size={24} /></span>
          <h1 className="mt-4 text-2xl font-extrabold text-on-surface">{t("circle.unavailableTitle")}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{getApiErrorMessage(error, t("circle.unavailableBody"))}</p>
          <div className="mt-6 flex justify-center gap-3"><button className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white" onClick={refetch} type="button">{t("common.tryAgain")}</button><Link className="rounded-full bg-surface-container px-5 py-2.5 text-sm font-bold" href="/explore-circles">{t("circle.exploreCircles")}</Link></div>
        </div>
      </main>
    );
  }

  return <LoadedCircleDetails circle={data.data} />;
}

function LoadedCircleDetails({ circle }: { circle: Circle }) {
  const { t } = useTranslation();
  const presentation = presentOccasion(circle?.occasion);
  const organizer = circle.organizer ?? {
    displayName: t("circle.defaultOrganizer"),
    verified: false,
  };
  const recipient = circle.recipient ?? {
    displayName: circle.recipientName ?? circle.title,
    city: circle.recipientCity ?? circle.city ?? null,
    countryCode:
      circle.recipientCountryCode ?? circle.countryCode ?? "NG",
  };
  const cover = circle.cover ?? {
    url: circle.coverImageUrl ?? null,
    alt: circle.coverAlt || circle.title,
  };
  const funding = circle.funding ?? {
    currency: circle.currency ?? "NGN",
    goalKobo: Math.round(Number(circle.targetAmount ?? 0) * 100),
    raisedKobo: Math.round(Number(circle.amountRaised ?? 0) * 100),
    percent: 0,
    supporterCount: circle.supporterCount ?? 0,
    closesAt: circle.deadline ?? "",
    acceptsContributions: circle.status.toLowerCase() === "active",
  };
  const wishlistItems = circle.wishlist ?? [];
  const viewer = circle.viewer ?? {
    canView: true,
    canContribute: true,
    canManage: false,
  };
  const organizerName = organizer.displayName;
  const beneficiaryName = recipient.displayName;
  const location = [recipient.city, recipient.countryCode].filter(Boolean).join(", ");
  const circleLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/circles/${circle?.slug}`;
  const wishlist: WishlistDetailItem[] = wishlistItems.map((item, index) => ({
    id: item.id,
    emoji: item.emoji || "🎁",
    name: item.name,
    description: item.description || t("circle.priorityDescription"),
    goal: item.targetAmountKobo / 100,
    raised: item.fundedAmountKobo / 100,
    accent: (["primary", "secondary", "tertiary"] as const)[index % 3],
    completionNote: item.status === "funded" ? t("circle.securedByCommunity") : undefined,
    suggestedAmount: item.suggestedContributionKobo / 100,
  }));
  const { data: wallData } = useGetPublicContributionsQuery({ circleId: circle?.id, limit: 50 });
  const backers = (wallData?.data ?? []).map((entry, index) => toBacker(entry, index, t));
  const [createIntent] = useCreateContributionIntentMutation();
  const [messageOrganizer, { isLoading: isSendingMessage }] = useMessageOrganizerMutation();
  const [amount, setAmount] = useState(5000);
  const [allocation, setAllocation] = useState("general");
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [organizerMessage, setOrganizerMessage] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
  }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 3500);
  }

  async function copyCircleLink() {
    await navigator.clipboard.writeText(circleLink);
    setCopied(true);
    showToast(t("circle.linkCopied"));
    setTimeout(() => setCopied(false), 2500);
  }

  async function shareCircle() {
    try {
      if (navigator.share) await navigator.share({ title: circle.title, text: t("circle.shareText", { title: circle.title }), url: circleLink });
      else await copyCircleLink();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) showToast(t("circle.shareUnavailable"));
    }
  }

  function selectWishlistItem(item: WishlistDetailItem) {
    const remaining = Math.max(item.goal - item.raised, 0);
    setAmount(item.suggestedAmount ?? remaining);
    setAllocation(item.id);
    document.getElementById("contribution-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleContribution(input: ContributionInput) {
    const response = await createIntent({
      circleId: circle.id,
      idempotencyKey: crypto.randomUUID(),
      body: {
        amount: input.amount,
        amountKobo: Math.round(input.amount * 100),
        currency: funding.currency,
        wishlistItemId: input.allocation === "general" ? undefined : input.allocation,
        message: input.message || undefined,
        privacy: { anonymous: input.anonymous, hideAmount: input.anonymous },
        returnUrl: `${circleLink}?payment=return`,
      },
    }).unwrap();
    if (!response.data.checkout.url) throw new Error(t("circle.paymentLinkMissing"));
    window.location.assign(response.data.checkout.url);
  }

  async function sendOrganizerMessage() {
    try {
      await messageOrganizer({ circleId: circle?.id, message: organizerMessage.trim(), replyEmail: replyEmail.trim() }).unwrap();
      setOrganizerOpen(false);
      setOrganizerMessage("");
      showToast(t("circle.messageSent", { name: organizerName }));
    } catch (error) {
      showToast(getApiErrorMessage(error, t("circle.messageError")));
    }
  }

  const raised = funding.raisedKobo / 100;
  const goal = funding.goalKobo / 100;
  const supporters = funding.supporterCount;

  return (
    <main className="min-h-screen bg-surface">
      <section className="border-b border-surface-container-high bg-surface-container-low/60 px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
          <nav aria-label={t("circle.breadcrumb")} className="flex min-w-0 flex-wrap items-center gap-2"><Link className="hover:text-primary" href="/">{t("circle.home")}</Link><span>/</span><Link className="hover:text-primary" href="/explore-circles">{t("circle.explore")}</Link><span>/</span><span>{t(`occasions.${circle.occasion}`, { defaultValue: t("occasions.other") })}</span><span>/</span><span className="max-w-[190px] truncate font-semibold text-on-surface sm:max-w-none">{circle?.title}</span></nav>
          <div className="flex items-center gap-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed/60 px-2.5 py-1 text-[11px] font-extrabold text-secondary"><span className="h-1.5 w-1.5 rounded-full bg-secondary" /> {circle?.status}</span><button aria-label={t("explore.card.share", { title: circle?.title })} className="inline-flex items-center gap-1 font-bold hover:text-primary" onClick={shareCircle} type="button"><Icon name="share" size={15} /> {t("circle.share")}</button></div>
        </div>
      </section>

      <header className="bg-gradient-to-b from-surface-container-low via-surface to-surface px-4 pb-8 pt-6 sm:px-6">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-3 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed px-3 py-1 text-[11px] font-extrabold text-on-secondary-fixed"><Icon name="check" size={14} /> {organizer.verified ? t("circle.verifiedCircle") : t("circle.communityCircle")}</span><span className="rounded-full bg-surface-container-highest px-3 py-1 text-[11px] font-semibold text-on-surface-variant">{circle?.privacy === "public" ? t("circle.public") : circle?.privacy === "invite" ? t("circle.inviteOnly") : t("circle.linkOnly")}</span><span className="rounded-full bg-surface-container px-3 py-1 text-[11px]">📍 {location || "Nigeria"}</span></div>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-3xl"><h1 className="text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">{circle?.title}</h1><p className="mt-2 text-base leading-7 text-on-surface-variant">{t("circle.summary", { beneficiary: beneficiaryName, organizer: organizerName })}</p></div><span className="rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-sm">{t("circle.supporterCount", { count: supporters })}</span></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-start gap-8 px-4 pb-12 sm:px-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-8 lg:col-span-8">
          <section className="overflow-hidden rounded-2xl bg-white shadow-card">
            <div className="relative h-72 bg-surface-container sm:h-96"><Image alt={cover.alt} className="object-cover" fill priority sizes="(max-width: 1023px) 100vw, 66vw" src={cover.url || "/onbording_image.png"} unoptimized /><div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#211b18]/85 via-transparent to-transparent p-6 text-white"><span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-fixed">{presentation.emoji} {t(`occasions.${circle.occasion}`, { defaultValue: t("occasions.other") })}</span><p className="mt-1 max-w-xl text-xl font-bold leading-7">{t("circle.careQuote")}</p></div></div>
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-full bg-primary-fixed text-sm font-extrabold text-primary">{initials(organizerName)}</span><div><div className="inline-flex items-center gap-1.5 font-bold">{organizerName} {organizer.verified && <Icon className="text-secondary" name="check" size={16} />}</div><p className="text-xs text-on-surface-variant">{t("circle.organizer")} • {location}</p></div></div><button className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-primary hover:bg-surface-container" onClick={() => setOrganizerOpen(true)} type="button"><Icon name="message" size={16} /> {t("circle.messageOrganizer")}</button></div>
          </section>

          <article className="space-y-4 rounded-2xl bg-white p-6 shadow-soft sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="inline-flex items-center gap-2 text-xl font-bold"><Icon className="text-primary" name="heart" size={20} /> {t("circle.storyTitle")}</h2><span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{t("circle.updated", { time: circle.updatedAt ? relativeTime(circle.updatedAt, t) : t("circle.recently") })}</span></div><p className="whitespace-pre-wrap text-sm leading-7 text-on-surface-variant sm:text-base">{circle?.storyMarkdown || t("circle.storyFallback", { organizer: organizerName, beneficiary: beneficiaryName })}</p></article>

          <WishlistSection items={wishlist} location={location || "Nigeria"} onFundItem={selectWishlistItem} />
          <ContributorWall backers={backers} supporters={supporters} />
        </div>

        <ContributionPanel acceptsContributions={Boolean(funding.acceptsContributions && viewer.canContribute)} allocation={allocation} amount={amount} beneficiaryName={beneficiaryName} circleTitle={circle?.title} copied={copied} daysLeft={daysUntil(funding.closesAt)} location={location || "Nigeria"} onAllocationChange={setAllocation} onAmountChange={setAmount} onContribute={handleContribution} onCopy={copyCircleLink} raised={raised} shareUrl={circleLink} supporters={supporters} target={goal} wishlist={wishlist} />
      </div>

      <OrganizerModal circleTitle={circle?.title} message={organizerMessage} onClose={() => setOrganizerOpen(false)} onMessageChange={setOrganizerMessage} onReplyEmailChange={setReplyEmail} onSend={sendOrganizerMessage} open={organizerOpen} organizerName={organizerName} replyEmail={replyEmail} sending={isSendingMessage} />

      <div aria-live="polite" className={`pointer-events-none fixed bottom-6 right-6 z-[80] flex max-w-sm items-center gap-2 rounded-xl bg-[#30312e] px-5 py-3 text-sm font-bold text-white shadow-2xl transition duration-300 ${toast ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}><Icon className="text-secondary-fixed" name="check" size={18} /> {toast}</div>
    </main>
  );
}
