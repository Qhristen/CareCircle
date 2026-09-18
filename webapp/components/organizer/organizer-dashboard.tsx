"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { getApiErrorMessage } from "@/lib/api-error";
import { daysUntil, presentOccasion } from "@/lib/circle-presenters";
import {
  useAddOrganizerWishlistItemMutation,
  useConfirmOrganizerAddressMutation,
  useCreateOrganizerPurchaseOrderMutation,
  useExportOrganizerContributionsMutation,
  useSendOrganizerBroadcastMutation,
  useThankOrganizerContributorMutation,
  useUpdateOrganizerSettingsMutation,
} from "@/lib/store/api/organizerApi";
import {
  getOrganizerDashboardData,
  type DashboardContributor,
  type DashboardPaymentFilter,
  type DashboardWishlistItem,
  type OrganizerDashboardData,
} from "@/lib/organizer-dashboard-data";
import type { Circle } from "@/types";

type ManagementTab = "contributors" | "wishlist";
type BroadcastChannel = "whatsapp" | "inApp" | "email";
type SendState = "idle" | "sending" | "sent";

const PAGE_SIZE = 6;
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full text-[13px] font-semibold leading-[18px] transition active:scale-[0.98]";

const accentClasses: Record<DashboardContributor["accent"], string> = {
  primary: "bg-primary-fixed text-primary",
  secondary: "bg-secondary-fixed text-secondary",
  tertiary: "bg-tertiary-fixed text-tertiary",
  neutral: "bg-surface-container-high text-outline",
};

function naira(value: number) {
  return `₦${new Intl.NumberFormat("en-NG").format(value)}`;
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function OrganizerDashboard({ circle, dashboardData }: { circle: Circle; dashboardData?: OrganizerDashboardData }) {
  const derivedDashboard = useMemo(() => getOrganizerDashboardData(circle), [circle]);
  const dashboard = dashboardData ?? derivedDashboard;
  const funding = circle.funding ?? {
    currency: circle.currency ?? "NGN",
    goalKobo: Math.round(Number(circle.targetAmount ?? 0) * 100),
    raisedKobo: Math.round(Number(circle.amountRaised ?? 0) * 100),
    percent: 0,
    supporterCount: circle.supporterCount ?? 0,
    closesAt: circle.deadline ?? "",
  };
  const cover = circle.cover ?? {
    url: circle.coverImageUrl ?? null,
    alt: circle.coverAlt || circle.title,
  };
  const daysLeft = daysUntil(funding.closesAt);
  const presentation = presentOccasion(circle.occasion);
  const location = circle.city || circle.countryCode;
  const supporterCount = funding.supporterCount;
  const raised = funding.raisedKobo / 100;
  const goal = funding.goalKobo / 100;
  const coverUrl = cover.url || "/onbording_image.png";
  const [exportContributions] = useExportOrganizerContributionsMutation();
  const [addWishlistItem] = useAddOrganizerWishlistItemMutation();
  const [sendBroadcastRequest] = useSendOrganizerBroadcastMutation();
  const [thankContributorRequest] = useThankOrganizerContributorMutation();
  const [createPurchaseOrder] = useCreateOrganizerPurchaseOrderMutation();
  const [confirmAddress] = useConfirmOrganizerAddressMutation();
  const [updateSettings] = useUpdateOrganizerSettingsMutation();
  const [activeTab, setActiveTab] = useState<ManagementTab>("contributors");
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<DashboardPaymentFilter>("All");
  const [page, setPage] = useState(1);
  const [wishlist, setWishlist] = useState<DashboardWishlistItem[]>(
    dashboard.wishlist,
  );
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null,
  );
  const [thankedContributorIds, setThankedContributorIds] = useState<Set<string>>(
    new Set(),
  );
  const [broadcast, setBroadcast] = useState(
    dashboard.remaining
      ? `We are just ${naira(dashboard.remaining)} away from completing ${circle.title}. Let's finish strong before the circle closes.`
      : `${circle.title} is fully funded! Thank you for showing up for ${dashboard.recipientName}.`,
  );
  const [channels, setChannels] = useState<Record<BroadcastChannel, boolean>>({
    whatsapp: true,
    inApp: true,
    email: false,
  });
  const [sendState, setSendState] = useState<SendState>("idle");
  const [earlyPurchaseOrder, setEarlyPurchaseOrder] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [circleVisibility, setCircleVisibility] = useState<"link" | "public">(
    "link",
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    goal: "",
  });
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (sendTimer.current) clearTimeout(sendTimer.current);
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  }

  const filteredContributors = dashboard.contributors.filter((contributor) => {
    const matchesSearch = [
      contributor.name,
      contributor.meta,
      contributor.rail,
      contributor.allocation,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    return matchesSearch && (method === "All" || contributor.method === method);
  });
  const totalPages = Math.max(
    1,
    Math.ceil(filteredContributors.length / PAGE_SIZE),
  );
  const visibleContributors = filteredContributors.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const firstVisible = filteredContributors.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastVisible = Math.min(page * PAGE_SIZE, filteredContributors.length);
  const claimedItems = wishlist.filter((item) => item.complete).length;
  const bankContributorCount = dashboard.contributors.filter(
    (contributor) => contributor.method === "Bank Transfer",
  ).length;
  const bankPercent = Math.round(
    (bankContributorCount / Math.max(dashboard.contributors.length, 1)) * 100,
  );
  const contributionAmounts = dashboard.contributors.map(
    (contributor) => contributor.amount,
  );
  const contributionRange = contributionAmounts.length
    ? `${naira(Math.min(...contributionAmounts))} – ${naira(Math.max(...contributionAmounts))}`
    : "No contributions yet";
  const selectedChannels = Object.entries(channels)
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel as BroadcastChannel);
  const shareUrl = circle.shareUrl;
  const whatsappSnippet = `${circle.title} is at ${naira(raised)} (${dashboard.fundedPercent}%) with ${supporterCount} generous supporters. ${dashboard.remaining ? `Just ${naira(dashboard.remaining)} remains.` : "The goal is fully funded!"} View progress: ${shareUrl}`;
  const escrowDigits = dashboard.circleCode.split("-").at(-1) ?? "0000";

  const promptOptions = [
    {
      label: dashboard.remaining
        ? `🎯 Final ${naira(dashboard.remaining)} Sprint`
        : "🎯 Goal Completed",
      text: dashboard.remaining
        ? `Final sprint! Only ${naira(dashboard.remaining)} left to complete ${circle.title}.`
        : `${circle.title} is fully funded. Thank you for making this possible!`,
    },
    {
      label: "🎉 Milestone Achieved",
      text: `Great news! ${claimedItems} of ${wishlist.length} registry priorities are now fully funded for ${dashboard.recipientName}.`,
    },
    {
      label: "💌 Keepsake Reminder",
      text: `Please leave a personal blessing note for ${dashboard.recipientName}'s keepsake before the circle closes.`,
    },
  ];

  const pipeline = [
    {
      title: "Funding Campaign",
      badge: dashboard.fundedPercent >= 100 ? "FUNDED" : "IN PROGRESS",
      description: `${dashboard.fundedPercent}% complete. ${daysLeft === null ? "The campaign is now closed." : `${daysLeft} days remain before auto-lock.`}`,
      detail:
        daysLeft === null
          ? "Campaign locked"
          : `Target lock: ${daysLeft} days`,
      icon: "alarm" as IconName,
      active: dashboard.fundedPercent < 100,
    },
    {
      title: "Vendor Dispatch",
      badge: earlyPurchaseOrder ? "REQUESTED" : "QUEUED",
      description: "Purchase orders go directly to verified merchants when funding is complete.",
      detail: earlyPurchaseOrder ? "Early PO requested" : "Trigger Early PO",
      icon: earlyPurchaseOrder ? ("check" as IconName) : ("arrow-right" as IconName),
    },
    {
      title: "Bundle Assembly",
      badge: "PACKING",
      description: "Quality checks, careful packing, and keepsake integration by the fulfillment partner.",
      detail: `${dashboard.vendorName} QA`,
      icon: "gift" as IconName,
    },
    {
      title: "Doorstep Courier",
      badge: "LOGISTICS",
      description: `Tracked delivery will be dispatched to the verified address in ${location}.`,
      detail: addressConfirmed ? "Address verified" : "Address awaiting confirmation",
      icon: "compass" as IconName,
    },
    {
      title: "Recipient Reveal",
      badge: "REVEAL",
      description: `${dashboard.recipientName} receives the bundle and digital community scrapbook.`,
      detail: "Scrapbook PDF trigger",
      icon: "image" as IconName,
    },
  ];

  function scrollToBroadcaster() {
    document.getElementById("broadcaster-section")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function openWhatsApp(message = whatsappSnippet) {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function downloadCsv() {
    try {
      const csv = await exportContributions(circle.id).unwrap();
      downloadFile(`${circle.id}-contributors.csv`, csv, "text/csv;charset=utf-8");
      showToast(`${dashboard.contributors.length} contributor records downloaded.`);
    } catch (error) {
      showToast(getApiErrorMessage(error, "The contribution export could not be downloaded."));
    }
  }

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(whatsappSnippet);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = whatsappSnippet;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showToast("WhatsApp group snippet copied.");
  }

  async function sendBroadcast() {
    if (!broadcast.trim() || sendState !== "idle") return;
    if (!selectedChannels.length) {
      showToast("Select at least one dispatch channel.");
      return;
    }

    setSendState("sending");
    try {
      await sendBroadcastRequest({
        circleId: circle.id,
        message: broadcast.trim(),
        channels: selectedChannels.map((channel) => channel === "inApp" ? "in_app" : channel),
      }).unwrap();
      setSendState("sent");
      showToast(
        `Broadcast sent through ${selectedChannels.length} channel${selectedChannels.length === 1 ? "" : "s"}.`,
      );
      sendTimer.current = setTimeout(() => setSendState("idle"), 4000);
    } catch (error) {
      setSendState("idle");
      showToast(getApiErrorMessage(error, "The broadcast could not be queued."));
    }
  }

  function toggleChannel(channel: BroadcastChannel) {
    setChannels((current) => ({ ...current, [channel]: !current[channel] }));
  }

  async function thankContributor(contributor: DashboardContributor) {
    try {
      await thankContributorRequest({
        circleId: circle.id,
        contributionId: contributor.id,
        message: `Thank you for supporting ${dashboard.recipientName}'s CareCircle. Your kindness means so much to us.`,
      }).unwrap();
      setThankedContributorIds((current) => new Set(current).add(contributor.id));
      showToast(`Thank-you sent to ${contributor.name}.`);
    } catch (error) {
      showToast(getApiErrorMessage(error, "The thank-you message could not be sent."));
    }
  }

  function downloadReceipt(contributor: DashboardContributor) {
    const receipt = [
      "CareCircle VERIFIED CONTRIBUTION RECEIPT",
      `Circle: ${circle.title}`,
      `Circle ID: ${dashboard.circleCode}`,
      `Supporter: ${contributor.name}`,
      `Amount: ${naira(contributor.amount)}`,
      `Allocation: ${contributor.allocation}`,
      `Payment rail: ${contributor.rail}`,
      `Recorded: ${contributor.meta}`,
    ].join("\n");
    downloadFile(
      `${circle.id}-${contributor.id}-receipt.txt`,
      receipt,
      "text/plain;charset=utf-8",
    );
    showToast(`${contributor.name}'s receipt downloaded.`);
  }

  function highlightWishlistItem(item: DashboardWishlistItem) {
    setHighlightedItemId(item.id);
    const remaining = Math.max(item.goal - item.raised, 0);
    setBroadcast(
      `${item.name} still needs ${naira(remaining)}. Please help us complete this priority for ${dashboard.recipientName}.`,
    );
    showToast(`${item.name} highlighted in the broadcaster.`);
    requestAnimationFrame(scrollToBroadcaster);
  }

  async function addRegistryItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const goal = Number(newItem.goal);
    if (!newItem.name.trim() || !Number.isFinite(goal) || goal <= 0) {
      showToast("Enter an item name and a valid target amount.");
      return;
    }

    try {
      const response = await addWishlistItem({
        circleId: circle.id,
        name: newItem.name.trim(),
        description: newItem.description.trim() || undefined,
        emoji: "🎁",
        targetAmountKobo: Math.round(goal * 100),
      }).unwrap();
      setWishlist((current) => [...current, {
        id: response.data.id,
        emoji: "🎁",
        name: response.data.name,
        description: response.data.description || "Organizer-added registry priority.",
        raised: response.data.fundedAmountKobo / 100,
        goal: response.data.targetAmountKobo / 100,
        complete: false,
      }]);
      setNewItem({ name: "", description: "", goal: "" });
      setAddItemOpen(false);
      showToast("Registry item added to the wishlist.");
    } catch (error) {
      showToast(getApiErrorMessage(error, "The registry item could not be added."));
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface text-[14px] leading-[22px] text-on-surface">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[320px] w-[980px] max-w-[95vw] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/10 via-tertiary-fixed/20 to-transparent blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-[1240px] space-y-6 px-4 py-6 sm:px-6">
        <section className="flex flex-col justify-between gap-4 rounded-xl bg-white p-6 shadow-sm lg:flex-row lg:items-center">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed px-4 py-1 text-[11px] font-bold uppercase leading-4 tracking-[0.08em] text-secondary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                Circle Organizer Mode
              </span>
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold leading-[18px] text-on-surface-variant">
                <Icon className="text-primary" name="link" size={15} />
                {dashboard.circleCode}
              </span>
              <span className="text-[13px] font-semibold text-outline">•</span>
              <span className="text-[13px] font-semibold leading-[18px] text-on-surface-variant">
                Created {dashboard.createdAt}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2 pt-1">
              <h1 className="text-[30px] font-bold leading-10 tracking-[-0.01em] sm:text-[32px]">
                {circle.title} {presentation.emoji}
              </h1>
            </div>
            <p className="max-w-2xl text-on-surface-variant">{dashboard.summary}</p>
          </div>

          <div className="flex shrink-0 flex-col items-start justify-between gap-2 rounded-lg bg-surface-container-low p-4 sm:flex-row lg:flex-col lg:items-end">
            <div className="flex items-center gap-2">
              <Icon className="text-secondary" name="check" size={20} />
              <span className="text-[13px] font-bold leading-[18px] text-secondary">
                {dashboard.fundedPercent}% Funded
              </span>
              <span className="text-xs leading-[18px] text-outline">
                ({naira(raised)} of {naira(goal)})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold leading-4">
              <Icon className="text-tertiary" name="alarm" size={16} />
              <span>
                {daysLeft === null
                  ? "Circle funding has closed"
                  : `${daysLeft} days remaining`}
              </span>
              <span className="font-normal text-outline">
                {daysLeft === null ? "for fulfillment" : "until auto-lock"}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest lg:w-56">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#ffb95f]"
                style={{ width: `${Math.min(dashboard.fundedPercent, 100)}%` }}
              />
            </div>
          </div>
        </section>

        <section
          aria-label="Organizer quick actions"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container p-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`${buttonBase} bg-primary px-4 py-2 text-white shadow-sm hover:bg-primary-container`}
              onClick={scrollToBroadcaster}
              type="button"
            >
              <Icon name="message" size={16} /> Broadcast Update
            </button>
            <button
              className={`${buttonBase} bg-secondary px-4 py-2 text-white shadow-sm hover:bg-[#15503e]`}
              onClick={() => openWhatsApp()}
              type="button"
            >
              <Icon name="share" size={16} /> WhatsApp Reminder Blast
            </button>
            {/* <button
              className={`${buttonBase} bg-white px-4 py-2 text-on-surface shadow-sm hover:bg-surface-container-high`}
              onClick={downloadCsv}
              type="button"
            >
              <Icon className="text-primary" name="save" size={16} />
              Download CSV ({supporterCount})
            </button> */}
          </div>
          <div className="flex items-center gap-2">
            <Link
              className={`${buttonBase} bg-white px-4 py-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface`}
              href={`/circles/${circle.id}`}
            >
              <Icon name="eye" size={16} /> Public Circle View
            </Link>
            <button
              aria-label="Settings and access control"
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-on-surface-variant transition hover:bg-surface-container-high"
              onClick={() => setSettingsOpen(true)}
              type="button"
            >
              <Icon name="tune" size={18} />
            </button>
          </div>
        </section>

        <section
          aria-label="Circle performance"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <KpiCard
            accent="primary"
            detail={`${supporterCount} contributions (${bankPercent}% bank rails)`}
            footer={`Goal: ${naira(goal)}`}
            footerValue={
              dashboard.remaining
                ? `${naira(dashboard.remaining)} left`
                : `${dashboard.fundedPercent}% complete`
            }
            icon="gift"
            title="Total Escrow Vault"
            value={naira(raised)}
          />
          <KpiCard
            accent="secondary"
            detail={`Range: ${contributionRange}`}
            footer="Community participation"
            footerValue={supporterCount > 30 ? "Healthy mix" : "Growing"}
            icon="users"
            title="Average Contribution"
            value={naira(dashboard.averageContribution)}
          />
          <KpiCard
            accent="tertiary"
            detail={
              wishlist
                .filter((item) => item.complete)
                .slice(0, 2)
                .map((item) => item.name)
                .join(", ") || "No items fully claimed yet"
            }
            footer={`${wishlist.length - claimedItems} priorities pending`}
            footerValue={`${claimedItems} fulfilled`}
            icon="gift"
            title="Items Claimed"
            value={`${claimedItems} of ${wishlist.length}`}
          />
          <KpiCard
            accent="primary"
            detail="Ready for keepsake printing"
            footer="Community notes auto-synced"
            footerValue="Live"
            icon="heart"
            title="Community Blessings"
            value={`${dashboard.blessingCount} Notes`}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Icon className="text-primary" name="compass" size={20} />
                <h2 className="text-xl font-bold leading-7">
                  Fulfillment &amp; Dispatch Tracker
                </h2>
              </div>
              <p className="text-xs leading-[18px] text-on-surface-variant">
                Live transparent pipeline from group escrow to {dashboard.recipientName}
                {` in ${location}`}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary-fixed/40 px-3 py-1 text-[13px] font-semibold leading-[18px] text-secondary">
              <Icon name="check" size={16} /> Partner Vendor: {dashboard.vendorName}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
            {pipeline.map((step, index) => (
              <article
                className={`space-y-1 rounded-xl p-4 ${step.active ? "bg-primary/5" : "bg-surface-container-low"}`}
                key={step.title}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold leading-4 ${step.active ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface"}`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold leading-4 ${step.active ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant"}`}
                  >
                    {step.badge}
                  </span>
                </div>
                <h3 className="text-[18px] font-bold leading-[26px]">{step.title}</h3>
                <p className="min-h-[54px] text-xs leading-[18px] text-on-surface-variant">
                  {step.description}
                </p>
                {index === 1 ? (
                  <button
                    className="inline-flex items-center gap-1 pt-2 text-left text-[11px] font-bold leading-4 text-primary disabled:text-secondary"
                    disabled={earlyPurchaseOrder}
                    onClick={async () => {
                      if (!wishlist.length) {
                        showToast("Add at least one wishlist item before requesting a purchase order.");
                        return;
                      }
                      try {
                        await createPurchaseOrder({ circleId: circle.id, wishlistItemIds: wishlist.map((item) => item.id) }).unwrap();
                        setEarlyPurchaseOrder(true);
                        showToast("Early purchase order submitted for vendor review.");
                      } catch (error) {
                        showToast(getApiErrorMessage(error, "The purchase order could not be submitted."));
                      }
                    }}
                    type="button"
                  >
                    <Icon name={step.icon} size={14} /> {step.detail}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1 pt-2 text-[11px] font-bold leading-4 text-outline">
                    <Icon className={step.active ? "text-primary" : ""} name={step.icon} size={14} />
                    {step.detail}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-surface-container-low p-4 md:flex-row">
            <div className="flex min-w-0 items-center gap-4">
              <Image
                alt={cover.alt}
                className="h-16 w-16 shrink-0 rounded-lg bg-tertiary-fixed object-cover shadow-sm"
                height={64}
                src={coverUrl}
                width={64}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[18px] font-bold leading-[26px]">
                    Bundle Preview: &quot;{dashboard.bundleName}&quot;
                  </h3>
                  <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase leading-4 text-white">
                    {claimedItems ? "Ready to pack" : "Awaiting funding"}
                  </span>
                </div>
                <p className="text-xs leading-[18px] text-on-surface-variant">
                  {dashboard.vendorName} has confirmed {claimedItems} of {wishlist.length}
                  {` priority allocations.`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                className={`${buttonBase} bg-white px-4 py-2 text-on-surface hover:bg-surface-container-highest`}
                onClick={() => setPreviewOpen(true)}
                type="button"
              >
                Preview Box Presentation
              </button>
              <button
                className={`${buttonBase} px-4 py-2 text-white shadow-sm ${addressConfirmed ? "bg-tertiary" : "bg-secondary hover:bg-[#15503e]"}`}
                disabled={addressConfirmed}
                onClick={async () => {
                  try {
                    await confirmAddress(circle.id).unwrap();
                    setAddressConfirmed(true);
                    showToast(`Delivery address in ${location} confirmed.`);
                  } catch (error) {
                    showToast(getApiErrorMessage(error, "Save a delivery address before confirming it."));
                  }
                }}
                type="button"
              >
                {addressConfirmed ? "Address Confirmed ✓" : "Confirm Delivery Address"}
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-1 shadow-sm">
              <div
                aria-label="Circle management views"
                className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
                role="tablist"
              >
                <TabButton
                  active={activeTab === "contributors"}
                  controls="contributors-panel"
                  icon="users"
                  label={`Contributor Roster (${supporterCount})`}
                  onClick={() => setActiveTab("contributors")}
                />
                <TabButton
                  active={activeTab === "wishlist"}
                  controls="wishlist-panel"
                  icon="gift"
                  label={`Wishlist Breakdown (${wishlist.length} Items)`}
                  onClick={() => setActiveTab("wishlist")}
                />
              </div>
              <div className="hidden shrink-0 items-center gap-2 pr-3 sm:flex">
                <span className="text-[11px] leading-4 text-outline">Real-time ledger</span>
                <span className="h-2 w-2 rounded-full bg-secondary" />
              </div>
            </div>

            {activeTab === "contributors" ? (
              <section
                aria-label="Contributor roster"
                className="space-y-4 rounded-xl bg-white p-4 shadow-sm"
                id="contributors-panel"
                role="tabpanel"
              >
                <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                  <label className="relative w-full sm:w-72">
                    <span className="sr-only">Filter contributors</span>
                    <Icon
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                      name="search"
                      size={17}
                    />
                    <input
                      className="w-full rounded-full bg-surface-container-low py-2 pl-9 pr-4 text-xs leading-[18px] outline-none placeholder:text-outline focus:bg-white focus:shadow-sm"
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                      placeholder="Filter by supporter name or bank ref..."
                      type="search"
                      value={search}
                    />
                  </label>
                  <div className="flex items-center gap-1 self-end">
                    <span className="mr-1 text-[11px] leading-4 text-on-surface-variant">
                      Method:
                    </span>
                    {(["All", "Bank Transfer", "Card"] as DashboardPaymentFilter[]).map(
                      (filter) => (
                        <button
                          aria-pressed={method === filter}
                          className={`rounded-full px-2.5 py-1 text-xs transition ${method === filter ? "bg-surface-container font-bold text-on-surface" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`}
                          key={filter}
                          onClick={() => {
                            setMethod(filter);
                            setPage(1);
                          }}
                          type="button"
                        >
                          {filter}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-xs leading-[18px]">
                    <thead>
                      <tr className="bg-surface-container-low text-[13px] font-semibold text-on-surface-variant">
                        <th className="rounded-l-lg px-4 py-3">Supporter</th>
                        <th className="px-2 py-3">Amount / Allocation</th>
                        <th className="px-2 py-3">Payment Rail</th>
                        <th className="px-2 py-3">Blessing Note</th>
                        <th className="rounded-r-lg px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                      {visibleContributors.map((contributor) => {
                        const thanked = thankedContributorIds.has(contributor.id);
                        return (
                          <tr
                            className="transition-colors hover:bg-surface-container-low/60"
                            key={contributor.id}
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold ${accentClasses[contributor.accent]}`}
                                >
                                  {contributor.anonymous ? (
                                    <Icon name="eye" size={16} />
                                  ) : (
                                    contributor.initials
                                  )}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1 text-[13px] font-bold leading-[18px]">
                                    {contributor.name}
                                    {contributor.anonymous && (
                                      <span className="rounded bg-surface-container-highest px-1.5 text-[10px] font-normal text-outline">
                                        Hidden
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-outline">{contributor.meta}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-3.5">
                              <div className="text-base font-bold leading-[26px]">
                                {naira(contributor.amount)}
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold leading-4 ${contributor.allocation === "General Gift Vault" ? "text-primary" : "text-secondary"}`}
                              >
                                <Icon
                                  name={
                                    contributor.allocation === "General Gift Vault"
                                      ? "gift"
                                      : "check"
                                  }
                                  size={12}
                                />
                                {contributor.allocation}
                              </span>
                            </td>
                            <td className="px-2 py-3.5">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${contributor.method === "Card" ? "bg-surface-container-high text-on-surface-variant" : "bg-secondary-fixed text-on-secondary-fixed"}`}
                              >
                                {contributor.rail}
                              </span>
                            </td>
                            <td className="max-w-[200px] px-2 py-3.5">
                              <p
                                className="truncate text-on-surface-variant"
                                title={contributor.note}
                              >
                                &quot;{contributor.note}&quot;
                              </p>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  aria-label={
                                    thanked
                                      ? `${contributor.name} thanked`
                                      : `Thank ${contributor.name}`
                                  }
                                  className={`rounded-full p-1.5 transition hover:bg-surface-container ${thanked ? "text-secondary" : "text-on-surface-variant hover:text-primary"}`}
                                  disabled={thanked}
                                  onClick={() => thankContributor(contributor)}
                                  type="button"
                                >
                                  <Icon name={thanked ? "check" : "message"} size={18} />
                                </button>
                                <button
                                  aria-label={`Download ${contributor.name}'s receipt`}
                                  className="rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
                                  onClick={() => downloadReceipt(contributor)}
                                  type="button"
                                >
                                  <Icon name="book" size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!visibleContributors.length && (
                    <p className="py-10 text-center text-sm text-outline">
                      No contributors match this filter.
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center justify-between gap-2 pt-1 text-xs leading-[18px] text-on-surface-variant sm:flex-row">
                  <span>
                    Showing {firstVisible}–{lastVisible} of {filteredContributors.length}
                    {` verified contributors`}
                  </span>
                  <div className="inline-flex items-center gap-2">
                    <button
                      className="rounded bg-surface-container-low px-3 py-1 text-xs font-semibold transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={page === 1}
                      onClick={() => setPage((current) => Math.max(current - 1, 1))}
                      type="button"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-bold text-primary">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="rounded bg-surface-container-low px-3 py-1 text-xs font-semibold transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={page === totalPages}
                      onClick={() =>
                        setPage((current) => Math.min(current + 1, totalPages))
                      }
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <WishlistBreakdown
                highlightedItemId={highlightedItemId}
                items={wishlist}
                onAdd={() => setAddItemOpen(true)}
                onHighlight={highlightWishlistItem}
              />
            )}

            <section className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="text-primary" name="book" size={20} />
                  <h3 className="text-[18px] font-bold leading-[26px]">
                    Printed Keepsake Card Preview ({dashboard.blessingCount} Messages)
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[13px] font-bold leading-[18px] text-secondary">
                  <Icon name="save" size={16} /> Ready for Velvet Foil Print
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {dashboard.contributors.slice(0, 2).map((contributor) => (
                  <BlessingCard contributor={contributor} key={contributor.id} />
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:col-span-4">
            <section
              className="space-y-4 rounded-xl bg-white p-6 shadow-sm"
              id="broadcaster-section"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-fixed text-primary">
                  <Icon name="message" size={18} />
                </span>
                <div>
                  <h3 className="text-[18px] font-bold leading-[26px]">
                    Broadcaster Tool
                  </h3>
                  <p className="text-xs leading-[18px] text-on-surface-variant">
                    Ping all {supporterCount} circle contributors at once
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase leading-4 tracking-wider text-on-surface-variant">
                  Fast Prompts:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {promptOptions.map((prompt) => (
                    <button
                      className="rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-medium text-on-surface-variant transition hover:bg-surface-container"
                      key={prompt.label}
                      onClick={() => setBroadcast(prompt.text)}
                      type="button"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1">
                <span className="flex items-center justify-between text-[11px] leading-4 text-on-surface-variant">
                  <span>Update Message</span>
                  <span>{broadcast.length} / 280</span>
                </span>
                <textarea
                  className="w-full resize-none rounded-xl bg-surface-container-low p-2 text-xs leading-[18px] outline-none focus:bg-white focus:shadow-inner"
                  maxLength={280}
                  onChange={(event) => setBroadcast(event.target.value)}
                  placeholder={`Type your broadcast to all ${supporterCount} supporters...`}
                  rows={4}
                  value={broadcast}
                />
              </label>

              <fieldset className="space-y-2 pt-1 text-xs leading-[18px]">
                <legend className="mb-1 text-[11px] font-bold uppercase leading-4 tracking-wider text-on-surface-variant">
                  Dispatch Channels:
                </legend>
                <ChannelCheckbox
                  checked={channels.whatsapp}
                  label="WhatsApp Announcement Digest"
                  onChange={() => toggleChannel("whatsapp")}
                />
                <ChannelCheckbox
                  checked={channels.inApp}
                  label="CareCircle In-App Feed Notification"
                  onChange={() => toggleChannel("inApp")}
                />
                <ChannelCheckbox
                  checked={channels.email}
                  label={`Instant Email Notification (${supporterCount} addresses)`}
                  onChange={() => toggleChannel("email")}
                />
              </fieldset>

              <div className="space-y-2 pt-2">
                <button
                  className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-[13px] font-bold leading-[18px] text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${sendState === "sent" ? "bg-secondary" : "bg-primary hover:bg-primary-container"}`}
                  disabled={sendState !== "idle" || !broadcast.trim()}
                  onClick={sendBroadcast}
                  type="button"
                >
                  <Icon
                    className={sendState === "sending" ? "animate-spin" : ""}
                    name={
                      sendState === "sent"
                        ? "check"
                        : sendState === "sending"
                          ? "alarm"
                          : "share"
                    }
                    size={16}
                  />
                  {sendState === "sending"
                    ? "Dispatching..."
                    : sendState === "sent"
                      ? `Dispatched to ${supporterCount} supporters!`
                      : `Send Broadcast to ${supporterCount} Supporters`}
                </button>
                {sendState === "sent" && (
                  <div className="rounded-lg bg-secondary-fixed p-2 text-center text-[11px] font-semibold leading-4 text-secondary">
                    ✓ Broadcast dispatched through the selected channels.
                  </div>
                )}
              </div>

            </section>

            <section className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Image
                  alt={cover.alt}
                  className="h-11 w-11 rounded-full bg-primary-fixed object-cover shadow-sm"
                  height={44}
                  src={coverUrl}
                  width={44}
                />
                <div>
                  <div className="text-[13px] font-bold leading-[18px]">
                    {dashboard.recipientName}
                  </div>
                  <div className="text-xs leading-[18px] text-outline">
                    Recipient • {location}
                  </div>
                </div>
              </div>
              <Icon className={addressConfirmed ? "text-secondary" : "text-primary"} name={addressConfirmed ? "check" : "compass"} size={20} />
            </section>
          </aside>
        </div>
      </div>

      <ModalShell
        onClose={() => setSettingsOpen(false)}
        open={settingsOpen}
        title="Circle Settings & Access"
      >
        <fieldset className="space-y-3 text-sm">
          <legend className="mb-2 font-bold">Public visibility</legend>
          <label className="flex cursor-pointer gap-3 rounded-xl bg-surface-container-low p-3">
            <input
              checked={circleVisibility === "link"}
              className="accent-primary"
              name="visibility"
              onChange={() => setCircleVisibility("link")}
              type="radio"
            />
            <span>
              <strong className="block">Link-only</strong>
              <span className="text-xs text-on-surface-variant">
                Only people with the circle link can open it.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-xl bg-surface-container-low p-3">
            <input
              checked={circleVisibility === "public"}
              className="accent-primary"
              name="visibility"
              onChange={() => setCircleVisibility("public")}
              type="radio"
            />
            <span>
              <strong className="block">Public discovery</strong>
              <span className="text-xs text-on-surface-variant">
                The circle can appear in search and Explore Circles.
              </span>
            </span>
          </label>
        </fieldset>
        <button
          className={`${buttonBase} w-full bg-primary px-5 py-3 text-white`}
          onClick={async () => {
            try {
              await updateSettings({ circleId: circle.id, privacy: circleVisibility }).unwrap();
              setSettingsOpen(false);
              showToast(`Circle visibility saved as ${circleVisibility === "link" ? "link-only" : "public"}.`);
            } catch (error) {
              showToast(getApiErrorMessage(error, "Circle visibility could not be updated."));
            }
          }}
          type="button"
        >
          Save Settings
        </button>
      </ModalShell>

      <ModalShell
        onClose={() => setPreviewOpen(false)}
        open={previewOpen}
        title="Bundle Presentation Preview"
      >
        <div className="relative h-52 overflow-hidden rounded-xl bg-tertiary-fixed">
          <Image
            alt={cover.alt}
            className="object-cover"
            fill
            sizes="(max-width: 640px) 90vw, 520px"
            src={coverUrl}
          />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">CareCircle</p>
              <h3 className="text-xl font-bold">{dashboard.bundleName}</h3>
            </div>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {wishlist.slice(0, 4).map((item) => (
            <li className="flex items-center justify-between rounded-lg bg-surface-container-low p-3" key={item.id}>
              <span>{item.emoji} {item.name}</span>
              <span className={item.complete ? "font-bold text-secondary" : "text-outline"}>
                {item.complete ? "Packed" : "Pending"}
              </span>
            </li>
          ))}
        </ul>
      </ModalShell>

      <ModalShell
        onClose={() => setAddItemOpen(false)}
        open={addItemOpen}
        title="Add Registry Item"
      >
        <form className="space-y-4" onSubmit={addRegistryItem}>
          <Field label="Item name">
            <input
              className="w-full rounded-xl bg-surface-container-low px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20"
              onChange={(event) =>
                setNewItem((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="e.g. Meal delivery package"
              required
              value={newItem.name}
            />
          </Field>
          <Field label="Description">
            <textarea
              className="w-full resize-none rounded-xl bg-surface-container-low px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20"
              onChange={(event) =>
                setNewItem((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Vendor or fulfillment details"
              rows={3}
              value={newItem.description}
            />
          </Field>
          <Field label="Target amount (NGN)">
            <input
              className="w-full rounded-xl bg-surface-container-low px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20"
              min="1"
              onChange={(event) =>
                setNewItem((current) => ({ ...current, goal: event.target.value }))
              }
              placeholder="25000"
              required
              type="number"
              value={newItem.goal}
            />
          </Field>
          <button className={`${buttonBase} w-full bg-primary px-5 py-3 text-white`} type="submit">
            <Icon name="plus" size={17} /> Add to Wishlist
          </button>
        </form>
      </ModalShell>

      <ModalShell
        onClose={() => setPolicyOpen(false)}
        open={policyOpen}
        title="Micro-Clearing Escrow Policy"
      >
        <div className="space-y-3 text-sm leading-6 text-on-surface-variant">
          <p>
            Contributions for {circle.title} remain in a dedicated virtual escrow
            account until the circle reaches its target or closing date.
          </p>
          <p>
            Organizer accounts cannot withdraw these funds. Approved disbursements
            require dual authorization and settle directly with verified vendors.
          </p>
          <p>
            Every payment, allocation, and vendor settlement remains visible in the
            organizer ledger and contributor receipts.
          </p>
        </div>
      </ModalShell>

      <div
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl bg-[#30312e] px-5 py-3 text-sm font-bold text-white shadow-2xl transition duration-300 ${toast ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}
      >
        {toast}
      </div>
    </main>
  );
}

function KpiCard({
  title,
  value,
  detail,
  footer,
  footerValue,
  accent,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  footer: string;
  footerValue: string;
  accent: "primary" | "secondary" | "tertiary";
  icon: IconName;
}) {
  const styles = {
    primary: {
      icon: "bg-primary-fixed text-primary",
      detail: "text-primary",
      footer: "text-primary",
    },
    secondary: {
      icon: "bg-secondary-fixed text-secondary",
      detail: "text-secondary",
      footer: "text-secondary",
    },
    tertiary: {
      icon: "bg-tertiary-fixed text-tertiary",
      detail: "text-on-surface-variant",
      footer: "text-tertiary",
    },
  }[accent];

  return (
    <article className="group flex min-h-[194px] flex-col justify-between overflow-hidden rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold leading-[18px] text-on-surface-variant">
          {title}
        </span>
        <span className={`grid h-10 w-10 place-items-center rounded-full ${styles.icon}`}>
          <Icon name={icon} size={20} />
        </span>
      </div>
      <div className="mt-4">
        <div className="text-[36px] font-extrabold leading-[44px] tracking-[-0.02em]">
          {value}
        </div>
        <div className={`mt-1 flex items-center gap-1 text-[11px] font-semibold leading-4 ${styles.detail}`}>
          <Icon
            name={
              accent === "primary"
                ? "arrow-right"
                : accent === "secondary"
                  ? "users"
                  : "check"
            }
            size={15}
          />
          <span className="line-clamp-2">{detail}</span>
        </div>
      </div>
      <div className="-mx-6 -mb-6 mt-4 flex items-center justify-between gap-2 bg-surface-container-low px-6 py-2 text-[11px] leading-4 text-on-surface-variant">
        <span>{footer}</span>
        <span className={`text-right font-bold ${styles.footer}`}>{footerValue}</span>
      </div>
    </article>
  );
}

function TabButton({
  active,
  controls,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  controls: string;
  icon: IconName;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-controls={controls}
      aria-selected={active}
      className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] leading-[18px] transition ${active ? "bg-primary font-bold text-white shadow-sm" : "font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}`}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <Icon name={icon} size={16} /> {label}
    </button>
  );
}

function WishlistBreakdown({
  items,
  highlightedItemId,
  onAdd,
  onHighlight,
}: {
  items: DashboardWishlistItem[];
  highlightedItemId: string | null;
  onAdd: () => void;
  onHighlight: (item: DashboardWishlistItem) => void;
}) {
  return (
    <section
      aria-label="Wishlist breakdown"
      className="space-y-4 rounded-xl bg-white p-4 shadow-sm"
      id="wishlist-panel"
      role="tabpanel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold leading-7">
            Itemized Bundle Registry Breakdown
          </h3>
          <p className="text-xs leading-[18px] text-on-surface-variant">
            Contributors can chip into overall funds or directly claim bundle priorities.
          </p>
        </div>
        <button
          className={`${buttonBase} bg-primary px-4 py-2 text-white hover:bg-primary-container`}
          onClick={onAdd}
          type="button"
        >
          <Icon name="plus" size={16} /> Add Registry Item
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const highlighted = highlightedItemId === item.id;
          const remaining = Math.max(item.goal - item.raised, 0);
          return (
            <article
              className={`flex flex-col items-start justify-between gap-4 rounded-lg p-4 sm:flex-row sm:items-center ${highlighted ? "bg-primary-fixed/50 ring-1 ring-primary/20" : "bg-surface-container-low"}`}
              key={item.id}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg text-2xl ${item.complete ? "bg-secondary-fixed text-secondary" : "bg-tertiary-fixed text-tertiary"}`}
                >
                  {item.emoji}
                </span>
                <div>
                  <h4 className="text-[18px] font-bold leading-[26px]">{item.name}</h4>
                  <p className="text-xs leading-[18px] text-on-surface-variant">
                    {item.description}
                  </p>
                </div>
              </div>
              <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                <div className="text-right">
                  <div className={`text-base font-bold leading-[26px] ${item.complete ? "" : "text-primary"}`}>
                    {naira(item.raised)} / {naira(item.goal)}
                  </div>
                  <span className={`text-[11px] font-bold leading-4 ${item.complete ? "text-secondary" : "text-primary"}`}>
                    {item.complete ? "100% CLAIMED" : `${naira(remaining)} remaining`}
                  </span>
                </div>
                {item.complete ? (
                  <Icon className="text-secondary" name="check" size={24} />
                ) : (
                  <button
                    className={`rounded-full px-4 py-1.5 text-xs font-bold ${highlighted ? "bg-secondary text-white" : "bg-primary text-white hover:bg-primary-container"}`}
                    disabled={highlighted}
                    onClick={() => onHighlight(item)}
                    type="button"
                  >
                    {highlighted ? "Highlighted ✓" : "Highlight to Circle"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BlessingCard({ contributor }: { contributor: DashboardContributor }) {
  return (
    <article className="space-y-1 rounded-lg bg-surface-container-low p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-bold leading-[18px] text-primary">
          Blessing from {contributor.name}
        </span>
        <span className="text-[11px] leading-4 text-outline">
          {naira(contributor.amount)} Contributor
        </span>
      </div>
      <p className="text-xs italic leading-relaxed">&quot;{contributor.note}&quot;</p>
    </article>
  );
}

function ChannelCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        checked={checked}
        className="h-4 w-4 accent-secondary"
        onChange={onChange}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function DataRow({
  label,
  value,
  mono = false,
  accent = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd
        className={`text-right font-bold ${mono ? "font-mono text-[11px]" : ""} ${accent ? "text-secondary" : "text-on-surface"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-semibold">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ModalShell({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      aria-labelledby="organizer-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/35 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="my-auto w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold" id="organizer-modal-title">
            {title}
          </h2>
          <button
            aria-label={`Close ${title}`}
            className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
