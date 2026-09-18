"use client";

import Link from "next/link";
import { OrganizerDashboard } from "@/components/organizer/organizer-dashboard";
import { Icon } from "@/components/ui/icon";
import { getApiErrorMessage } from "@/lib/api-error";
import { presentOccasion } from "@/lib/circle-presenters";
import {
  useGetManagedCircleQuery,
  useGetOrganizerContributionsQuery,
  useGetOrganizerDashboardQuery,
} from "@/lib/store/api/organizerApi";
import type { DashboardContributor, OrganizerDashboardData } from "@/lib/organizer-dashboard-data";
import type { Circle } from "@/types";

function contributorInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "GC";
}

export function OrganizerDashboardRoute({ circleId }: { circleId: string }) {
  const dashboardQuery = useGetOrganizerDashboardQuery(circleId);
  const circleQuery = useGetManagedCircleQuery(circleId);
  const contributionsQuery = useGetOrganizerContributionsQuery(circleId);
  const isLoading = dashboardQuery.isLoading || circleQuery.isLoading || contributionsQuery.isLoading;
  const error = dashboardQuery.error || circleQuery.error || contributionsQuery.error;

  if (isLoading) {
    return <main className="mx-auto min-h-screen max-w-[1240px] animate-pulse px-4 py-8 sm:px-6"><div className="h-32 rounded-2xl bg-surface-container" /><div className="mt-6 grid gap-4 md:grid-cols-3"><div className="h-40 rounded-2xl bg-surface-container" /><div className="h-40 rounded-2xl bg-surface-container" /><div className="h-40 rounded-2xl bg-surface-container" /></div></main>;
  }

  if (error || !dashboardQuery.data || !circleQuery.data || !contributionsQuery.data) {
    return <main className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-4 text-center"><div><Icon className="mx-auto text-primary" name="lock" size={34} /><h1 className="mt-4 text-2xl font-extrabold">Dashboard unavailable</h1><p className="mt-2 text-sm text-on-surface-variant">{getApiErrorMessage(error, "Sign in with the organizer account to manage this circle.")}</p><Link className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white" href="/sign-in">Sign in</Link></div></main>;
  }

  const managed = circleQuery.data;
  const live = dashboardQuery.data.data;
  const occasion = managed.occasion.toLowerCase().replaceAll("_", "-");
  const presentation = presentOccasion(occasion);
  const managedItems = managed.items ?? [];
  const recipientName =
    managed.recipientName ?? managed.recipient?.displayName ?? managed.title;
  const deadline = managed.deadline ?? managed.funding?.closesAt ?? "";
  const circle: Circle = {
    id: managed.id,
    slug: managed.slug,
    title: managed.title,
    occasion,
    city: managed.recipientCity ?? managed.recipient?.city ?? null,
    countryCode:
      managed.recipientCountryCode ?? managed.recipient?.countryCode ?? "NG",
    organizer: {
      displayName: "You",
      verified: true,
    },
    cover: {
      url: managed.coverImageUrl ?? managed.cover?.url ?? null,
      alt: managed.coverAlt || managed.cover?.alt || `${managed.title} cover`,
    },
    wishlistPreview: managedItems.slice(0, 3).map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
    })),
    funding: {
      currency: managed.currency ?? live.metrics.currency,
      goalKobo: live.metrics.goalKobo,
      raisedKobo: live.metrics.raisedKobo,
      percent: live.metrics.fundedPercent,
      supporterCount: live.metrics.supporterCount,
      closesAt: deadline,
    },
    status: managed.status,
    shareUrl:
      managed.shareUrl ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/circles/${managed.slug}`,
  };

  const accents: DashboardContributor["accent"][] = ["primary", "secondary", "tertiary", "neutral"];
  const contributors: DashboardContributor[] = contributionsQuery.data.data.map((entry, index) => ({
    id: entry.id,
    initials: contributorInitials(entry.displayName),
    name: entry.displayName,
    meta: `${new Date(entry.paidAt || entry.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })} • ${entry.paymentReference}`,
    amount: entry.amountKobo / 100,
    allocation: entry.allocation?.name || "General Gift Vault",
    rail: entry.paymentMethod === "bank_transfer" ? "Bank Transfer" : "Card / Paystack",
    note: entry.note || "No message was included with this contribution.",
    accent: accents[index % accents.length],
    method: entry.paymentMethod === "bank_transfer" ? "Bank Transfer" : "Card",
  }));
  const wishlist = managedItems.map((item) => ({
    id: item.id,
    emoji: item.emoji || "🎁",
    name: item.name,
    description: item.description || "Organizer wishlist priority.",
    raised: Number(item.fundedAmount),
    goal: Number(item.targetAmount),
    complete: Number(item.fundedAmount) >= Number(item.targetAmount),
  }));
  const dashboardData: OrganizerDashboardData = {
    circleCode: `GC-${managed.id.slice(0, 8).toUpperCase()}`,
    createdAt: managed.createdAt
      ? new Date(managed.createdAt).toLocaleDateString("en-NG", {
          dateStyle: "medium",
        })
      : "Recently created",
    recipientName,
    summary: `Managing ${presentation.label.toLowerCase()} support for ${recipientName} with transparent contributions and fulfillment.`,
    fundedPercent: live.metrics.fundedPercent,
    remaining: live.metrics.remainingKobo / 100,
    averageContribution: live.metrics.averageContributionKobo / 100,
    claimedItems: live.metrics.claimedItemCount,
    blessingCount: live.metrics.blessingCount,
    vendorName: live.fulfillment.vendor.name,
    bundleName: `${recipientName}'s ${presentation.label} Bundle`,
    contributors,
    wishlist,
  };

  return <OrganizerDashboard circle={circle} dashboardData={dashboardData} />;
}
